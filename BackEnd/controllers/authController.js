require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

// Inisialisasi Supabase Client (Standard)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Inisialisasi Supabase Admin Client (Khusus Manajemen Auth Tingkat Lanjut/Service Role)
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Disable Registrasi Mandiri Publik
exports.register = async (req, res) => {
  return res.status(403).json({
    error: "Pendaftaran mandiri dinonaktifkan. Akun dibuat langsung oleh SuperAdmin via Dashboard User Management."
  });
};

// Logika Login Email & Password
exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email dan password wajib diisi." });
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      return res.status(401).json({ error: "Email atau password salah." });
    }

    const user = data.user;
    const role = user.user_metadata?.role || "user";
    const nama = user.user_metadata?.nama || user.user_metadata?.name || "User";
    const avatar = user.user_metadata?.avatar_url || null;

    return res.status(200).json({
      status: "success",
      message: "Login berhasil!",
      token: data.session.access_token,
      user: {
        id: user.id,
        email: user.email,
        nama: nama,
        role: role,
        avatar_url: avatar
      }
    });
  } catch (err) {
    return res.status(500).json({ error: "Terjadi kesalahan pada server saat login." });
  }
};

// Logika Login / Register via Google OAuth
exports.googleLogin = async (req, res) => {
  try {
    const configuredFrontendUrl = process.env.FRONTEND_URL;
    if (!configuredFrontendUrl && process.env.NODE_ENV === 'production') {
      return res.status(500).json({
        error: 'FRONTEND_URL wajib diatur pada environment Backend untuk callback Google OAuth.',
      });
    }

    const frontendUrl = (configuredFrontendUrl || 'http://localhost:5173').replace(/\/+$/, '');
    let frontendOrigin;
    try {
      const parsedFrontendUrl = new URL(frontendUrl);
      if (
        !['http:', 'https:'].includes(parsedFrontendUrl.protocol) ||
        (process.env.NODE_ENV === 'production' && parsedFrontendUrl.hostname === 'localhost')
      ) {
        throw new Error('Origin Frontend tidak valid untuk environment ini.');
      }
      frontendOrigin = parsedFrontendUrl.origin;
    } catch {
      return res.status(500).json({
        error: 'FRONTEND_URL harus berupa origin Frontend yang valid, misalnya https://mawas.vercel.app.',
      });
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${frontendOrigin}/dashboard`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Mengembalikan URL pengalihan ke OAuth Google
    return res.status(200).json({ url: data.url });
  } catch (err) {
    return res.status(500).json({ error: "Terjadi kesalahan pada server saat OAuth Google." });
  }
};

// Logika Update Profil (Nama & Foto Profil / Avatar)
exports.updateProfile = async (req, res) => {
  const { nama, avatar_url } = req.body;

  if (typeof nama !== 'string' && typeof avatar_url !== 'string') {
    return res.status(400).json({ error: "Atribut yang ingin diperbarui (nama/avatar_url) wajib diisi." });
  }

  try {
    const updateData = { ...(req.user.user_metadata || {}) };
    if (typeof nama === 'string') {
      const normalizedName = nama.trim();
      if (!normalizedName || normalizedName.length > 100) {
        return res.status(400).json({ error: "Nama wajib diisi dan maksimal 100 karakter." });
      }
      updateData.nama = normalizedName;
      updateData.name = normalizedName;
    }
    if (typeof avatar_url === 'string') updateData.avatar_url = avatar_url;

    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(req.user.id, {
      user_metadata: updateData
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const updatedUser = data.user;

    return res.status(200).json({
      status: "success",
      message: "Profil berhasil diperbarui!",
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        nama: updatedUser.user_metadata?.nama || updatedUser.user_metadata?.name,
        role: updatedUser.user_metadata?.role || "user",
        avatar_url: updatedUser.user_metadata?.avatar_url || null
      }
    });
  } catch (err) {
    return res.status(500).json({ error: "Terjadi kesalahan server saat memperbarui profil." });
  }
};

// Logika Ganti Password (Mendukung Akun OAuth Google & Manual)
exports.changePassword = async (req, res) => {
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({ error: "Password baru wajib diisi dan minimal 8 karakter." });
  }

  try {
    // req.user disuntikkan dari middleware authenticateToken
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "Pengguna tidak terautentikasi." });
    }

    // Menggunakan Admin API untuk langsung set/update password user berdasarkan ID-nya
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(req.user.id, {
      password: newPassword
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({
      status: "success",
      message: "Password berhasil diperbarui! Sekarang kamu bisa login manual menggunakan password baru ini."
    });
  } catch (err) {
    return res.status(500).json({ error: "Terjadi kesalahan server saat mengganti password." });
  }
};

exports.uploadAvatar = async (req, res) => {
  const contentType = req.headers['content-type'];
  const extensionByType = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  };
  const extension = extensionByType[contentType];
  if (!extension || !Buffer.isBuffer(req.body) || req.body.length === 0) {
    return res.status(400).json({ error: "Unggah foto JPG, PNG, atau WebP yang valid." });
  }
  if (req.body.length > 5 * 1024 * 1024) {
    return res.status(413).json({ error: "Ukuran foto maksimal 5 MB." });
  }

  try {
    const objectPath = `${req.user.id}/avatar.${extension}`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from('avatars')
      .upload(objectPath, req.body, { contentType, upsert: true });
    if (uploadError) throw uploadError;

    const { data: publicUrl } = supabaseAdmin.storage
      .from('avatars')
      .getPublicUrl(objectPath);
    const metadata = {
      ...(req.user.user_metadata || {}),
      avatar_url: publicUrl.publicUrl,
    };
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(req.user.id, {
      user_metadata: metadata,
    });
    if (error) throw error;

    return res.status(200).json({
      status: 'success',
      avatar_url: publicUrl.publicUrl,
      user: {
        id: data.user.id,
        email: data.user.email,
        nama: data.user.user_metadata?.nama || data.user.user_metadata?.name || 'User',
        role: data.user.user_metadata?.role || 'user',
        avatar_url: data.user.user_metadata?.avatar_url || null,
      },
    });
  } catch (error) {
    console.error('Gagal mengunggah avatar:', error.message);
    return res.status(500).json({ error: 'Foto profil gagal diunggah.' });
  }
};