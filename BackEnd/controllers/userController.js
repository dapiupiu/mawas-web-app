const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const listAuthUsers = async () => {
  const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw error;
  return data.users;
};

const toOperator = (user) => ({
  id: user.id,
  email: user.email,
  name: user.user_metadata?.nama || user.user_metadata?.name || 'Operator',
  role: 'operator',
  avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
  status: user.banned_until && new Date(user.banned_until) > new Date() ? 'nonaktif' : 'aktif',
  registeredAt: user.created_at,
});

const ensureOperator = async (id) => {
  const { data, error } = await supabaseAdmin.auth.admin.getUserById(id);
  if (error) throw error;
  if (data.user?.user_metadata?.role !== 'operator') {
    const errorNotOperator = new Error('Akun operator tidak ditemukan.');
    errorNotOperator.status = 404;
    throw errorNotOperator;
  }
  return data.user;
};

exports.getAllOperators = async (req, res) => {
  try {
    const users = await listAuthUsers();
    const operators = users
      .filter((user) => user.user_metadata?.role === 'operator')
      .map(toOperator);
    return res.status(200).json({ status: 'success', data: operators });
  } catch (error) {
    console.error('Gagal mengambil daftar operator:', error.message);
    return res.status(500).json({ error: 'Daftar operator gagal dimuat.' });
  }
};

exports.createOperator = async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const requestedName = typeof req.body.nama === 'string' ? req.body.nama.trim() : '';

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Email operator yang valid wajib diisi.' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password awal minimal 8 karakter.' });
  }
  if (requestedName.length > 100) {
    return res.status(400).json({ error: 'Nama operator maksimal 100 karakter.' });
  }

  try {
    const users = await listAuthUsers();
    const operatorNames = users
      .filter((user) => user.user_metadata?.role === 'operator')
      .map((user) => Number(String(user.user_metadata?.nama || '').match(/^Operator (\d+)$/i)?.[1] || 0));
    const nextNumber = Math.max(0, ...operatorNames) + 1;
    const nama = requestedName || `Operator ${nextNumber}`;

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: { role: 'operator', nama, name: nama },
      email_confirm: true,
    });
    if (error) throw error;

    return res.status(201).json({
      status: 'success',
      message: `${nama} berhasil didaftarkan.`,
      data: { ...toOperator(data.user), temporaryPassword: password },
    });
  } catch (error) {
    console.error('Gagal membuat akun operator:', error.message);
    return res.status(400).json({ error: error.message || 'Akun operator gagal dibuat.' });
  }
};

exports.updateOperator = async (req, res) => {
  const { id } = req.params;
  const { nama, status } = req.body;
  if (typeof nama !== 'string' && !['aktif', 'nonaktif'].includes(status)) {
    return res.status(400).json({ error: 'Nama atau status operator harus diperbarui.' });
  }

  try {
    const user = await ensureOperator(id);
    const updates = {};
    if (typeof nama === 'string') {
      const normalizedName = nama.trim();
      if (!normalizedName || normalizedName.length > 100) {
        return res.status(400).json({ error: 'Nama wajib diisi dan maksimal 100 karakter.' });
      }
      updates.user_metadata = {
        ...(user.user_metadata || {}),
        nama: normalizedName,
        name: normalizedName,
      };
    }
    if (status === 'aktif' || status === 'nonaktif') {
      updates.ban_duration = status === 'aktif' ? 'none' : '876000h';
    }

    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(id, updates);
    if (error) throw error;
    return res.status(200).json({ status: 'success', data: toOperator(data.user) });
  } catch (error) {
    console.error('Gagal memperbarui akun operator:', error.message);
    return res.status(error.status || 400).json({ error: error.message || 'Akun operator gagal diperbarui.' });
  }
};

exports.resetOperatorPassword = async (req, res) => {
  const password = String(req.body.password || '');
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password baru minimal 8 karakter.' });
  }

  try {
    await ensureOperator(req.params.id);
    const { error } = await supabaseAdmin.auth.admin.updateUserById(req.params.id, { password });
    if (error) throw error;
    return res.status(200).json({ status: 'success', temporaryPassword: password });
  } catch (error) {
    console.error('Gagal mereset password operator:', error.message);
    return res.status(error.status || 400).json({ error: error.message || 'Password operator gagal diperbarui.' });
  }
};

exports.deleteOperator = async (req, res) => {
  const detachedVerifications = [];
  const restoreVerificationLinks = async () => {
    const results = await Promise.all(detachedVerifications.map((verification) =>
      supabaseAdmin
        .from('verifikasi_risiko')
        .update({ diverifikasi_user_id: req.params.id })
        .eq('kode_kabupaten', verification.kode_kabupaten)
        .eq('tanggal', verification.tanggal)
        .eq('horizon_hari', verification.horizon_hari)
        .is('diverifikasi_user_id', null)
    ));
    const failedRestore = results.find((result) => result.error)?.error;
    if (failedRestore) {
      console.error('Gagal memulihkan tautan verifikasi setelah penghapusan akun gagal:', failedRestore.message);
    }
  };

  try {
    await ensureOperator(req.params.id);

    const { data: verifications, error: lookupError } = await supabaseAdmin
      .from('verifikasi_risiko')
      .select('kode_kabupaten,tanggal,horizon_hari')
      .eq('diverifikasi_user_id', req.params.id);
    if (lookupError) throw lookupError;

    for (const verification of verifications || []) {
      const { error } = await supabaseAdmin
        .from('verifikasi_risiko')
        .update({ diverifikasi_user_id: null })
        .eq('kode_kabupaten', verification.kode_kabupaten)
        .eq('tanggal', verification.tanggal)
        .eq('horizon_hari', verification.horizon_hari)
        .eq('diverifikasi_user_id', req.params.id);
      if (error) {
        await restoreVerificationLinks();
        throw error;
      }
      detachedVerifications.push(verification);
    }

    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(req.params.id);
    if (deleteError) {
      await restoreVerificationLinks();
      throw deleteError;
    }

    return res.status(200).json({
      status: 'success',
      message: 'Akun operator berhasil dihapus. Riwayat verifikasi tetap tersimpan.',
    });
  } catch (error) {
    console.error('Gagal menghapus akun operator:', error.message);
    return res.status(error.status || 400).json({
      error: error.message || 'Akun operator gagal dihapus.',
    });
  }
};
