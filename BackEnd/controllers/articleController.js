const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const TABLE = 'artikel_cms';
const BUCKET = 'artikel-thumbnails';
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const MIME_EXTENSIONS = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};
const MANAGED_IMAGE_PATH = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(jpg|png|webp)$/i;
const EDITABLE_FIELDS = ['judul', 'isi', 'kategori', 'penulis', 'thumbnail_path', 'status'];

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function articleDto(row) {
  const thumbnailPath = row.thumbnail_path || undefined;
  let thumbnailUrl;
  if (thumbnailPath) {
    if (/^https?:\/\//i.test(thumbnailPath)) {
      thumbnailUrl = thumbnailPath;
    } else {
      const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(thumbnailPath);
      thumbnailUrl = data.publicUrl;
    }
  }

  const updatedAt = row.updated_at || row.published_at || row.created_at;
  let diperbaruiPada = '';
  if (updatedAt && !Number.isNaN(Date.parse(updatedAt))) {
    diperbaruiPada = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(updatedAt));
  }

  return {
    id: row.id,
    judul: row.judul,
    isi: row.isi,
    kategori: row.kategori,
    thumbnailPath,
    thumbnailUrl,
    penulis: row.penulis || 'Admin',
    diperbaruiPada,
  };
}

function validateArticle(body, partial = false) {
  const requiredFields = ['judul', 'isi', 'kategori'];
  for (const field of requiredFields) {
    if (!partial || Object.prototype.hasOwnProperty.call(body, field)) {
      if (typeof body[field] !== 'string' || !body[field].trim()) {
        return `${field} wajib berupa teks dan tidak boleh kosong.`;
      }
    }
  }

  if (body.judul?.trim().length > 200) return 'Judul maksimal 200 karakter.';
  if (body.isi?.length > 100000) return 'Isi artikel maksimal 100.000 karakter.';
  if (body.kategori?.trim().length > 100) return 'Kategori maksimal 100 karakter.';
  if (body.penulis !== undefined &&
      (typeof body.penulis !== 'string' || body.penulis.trim().length > 100)) {
    return 'Penulis harus berupa teks maksimal 100 karakter.';
  }
  if (body.thumbnail_path !== undefined && body.thumbnail_path !== null &&
      (typeof body.thumbnail_path !== 'string' || body.thumbnail_path.length > 2048)) {
    return 'Path gambar harus berupa teks maksimal 2048 karakter.';
  }
  if (body.status !== undefined && !['draft', 'published'].includes(body.status)) {
    return 'Status artikel tidak valid.';
  }
  if (partial && !EDITABLE_FIELDS.some((field) => Object.prototype.hasOwnProperty.call(body, field))) {
    return 'Minimal satu atribut artikel harus diperbarui.';
  }
  return null;
}

async function removeStoredThumbnail(path) {
  if (!path || !MANAGED_IMAGE_PATH.test(path)) return null;
  try {
    const { error } = await supabaseAdmin.storage.from(BUCKET).remove([path]);
    return error;
  } catch (error) {
    return error;
  }
}

exports.listPublished = async (_req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .select('*')
      .eq('status', 'published')
      .order('published_at', { ascending: false, nullsFirst: false })
      .order('updated_at', { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
    const articles = (data || []).map(articleDto);
    return res.status(200).json({ status: 'success', total: articles.length, data: articles });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getPublishedById = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .select('*')
      .eq('id', req.params.id)
      .eq('status', 'published')
      .maybeSingle();

    if (error) return res.status(400).json({ error: error.message });
    if (!data) return res.status(404).json({ error: 'Artikel tidak ditemukan.' });
    return res.status(200).json({ status: 'success', data: articleDto(data) });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.listManage = async (_req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
    const articles = (data || []).map(articleDto);
    return res.status(200).json({ status: 'success', total: articles.length, data: articles });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.create = async (req, res) => {
  const validationError = validateArticle(req.body);
  if (validationError) return res.status(400).json({ error: validationError });

  try {
    const status = req.body.status || 'published';
    const article = {
      judul: req.body.judul.trim(),
      isi: req.body.isi.trim(),
      kategori: req.body.kategori.trim(),
      thumbnail_path: req.body.thumbnail_path?.trim() || null,
      penulis: req.body.penulis?.trim() || req.user.user_metadata?.nama || req.user.email || 'Admin',
      status,
      created_by: req.user.id,
      published_at: status === 'published' ? new Date().toISOString() : null,
    };
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .insert(article)
      .select('*')
      .single();

    if (error) return res.status(400).json({ error: error.message });
    return res.status(201).json({ status: 'success', data: articleDto(data) });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.update = async (req, res) => {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(req.params.id)) {
    return res.status(400).json({ error: 'ID artikel tidak valid.' });
  }
  const validationError = validateArticle(req.body, true);
  if (validationError) return res.status(400).json({ error: validationError });

  try {
    const { data: existing, error: existingError } = await supabaseAdmin
      .from(TABLE)
      .select('thumbnail_path,status,published_at')
      .eq('id', req.params.id)
      .maybeSingle();
    if (existingError) return res.status(400).json({ error: existingError.message });
    if (!existing) return res.status(404).json({ error: 'Artikel tidak ditemukan.' });

    const update = { updated_at: new Date().toISOString() };
    for (const field of EDITABLE_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) update[field] = req.body[field];
    }
    for (const field of ['judul', 'isi', 'kategori', 'penulis', 'thumbnail_path']) {
      if (typeof update[field] === 'string') update[field] = update[field].trim() || null;
    }
    if (req.body.status === 'published' && existing.status !== 'published') {
      update.published_at = new Date().toISOString();
    }
    if (req.body.status === 'draft') update.published_at = null;
    delete update.created_by;

    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .update(update)
      .eq('id', req.params.id)
      .select('*')
      .single();
    if (error) return res.status(400).json({ error: error.message });

    let cleanupWarning;
    if (Object.prototype.hasOwnProperty.call(req.body, 'thumbnail_path') &&
        existing.thumbnail_path !== data.thumbnail_path) {
      const cleanupError = await removeStoredThumbnail(existing.thumbnail_path);
      if (cleanupError) cleanupWarning = 'Artikel tersimpan, tetapi gambar lama gagal dibersihkan dari Storage.';
    }
    return res.status(200).json({
      status: 'success',
      data: articleDto(data),
      ...(cleanupWarning ? { warning: cleanupWarning } : {}),
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.remove = async (req, res) => {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(req.params.id)) {
    return res.status(400).json({ error: 'ID artikel tidak valid.' });
  }

  try {
    const { data: existing, error: findError } = await supabaseAdmin
      .from(TABLE)
      .select('id,thumbnail_path')
      .eq('id', req.params.id)
      .maybeSingle();
    if (findError) return res.status(400).json({ error: findError.message });
    if (!existing) return res.status(404).json({ error: 'Artikel tidak ditemukan.' });

    const { error } = await supabaseAdmin.from(TABLE).delete().eq('id', req.params.id);
    if (error) return res.status(400).json({ error: error.message });

    const cleanupError = await removeStoredThumbnail(existing.thumbnail_path);
    const warning = cleanupError
      ? 'Artikel terhapus, tetapi gambar gagal dibersihkan dari Storage.'
      : undefined;
    return res.status(200).json({ status: 'success', data: { id: existing.id }, ...(warning ? { warning } : {}) });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.uploadImage = async (req, res) => {
  const extension = MIME_EXTENSIONS[req.get('Content-Type')?.split(';')[0].trim()];
  if (!extension) return res.status(415).json({ error: 'Format gambar harus JPEG, PNG, atau WebP.' });
  if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
    return res.status(400).json({ error: 'File gambar tidak ditemukan.' });
  }
  if (req.body.length > MAX_IMAGE_BYTES) {
    return res.status(413).json({ error: 'Ukuran gambar maksimal 4 MB.' });
  }

  try {
    const path = `${req.user.id}/${require('crypto').randomUUID()}.${extension}`;
    const { error } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(path, req.body, { contentType: `image/${extension === 'jpg' ? 'jpeg' : extension}`, upsert: false });
    if (error) return res.status(400).json({ error: error.message });

    const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);
    return res.status(201).json({ status: 'success', data: { path, url: data.publicUrl } });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.deleteImage = async (req, res) => {
  const { path } = req.body || {};
  if (typeof path !== 'string' || !MANAGED_IMAGE_PATH.test(path)) {
    return res.status(400).json({ error: 'Path gambar tidak valid.' });
  }
  try {
    const { error } = await supabaseAdmin.storage.from(BUCKET).remove([path]);
    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json({ status: 'success' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
