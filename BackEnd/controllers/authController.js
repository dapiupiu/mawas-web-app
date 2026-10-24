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
    const nama = user.user_metadata?.nama || "User";
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
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'http://localhost:5173/dashboard', // URL frontend setelah sukses login
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

  if (!nama && !avatar_url) {
    return res.status(400).json({ error: "Atribut yang ingin diperbarui (nama/avatar_url) wajib diisi." });
  }

  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: "Token autentikasi tidak ditemukan." });
    }

    // Menyiapkan data metadata yang akan di-update
    const updateData = {};
    if (nama) updateData.nama = nama;
    if (avatar_url) updateData.avatar_url = avatar_url;

    // Update user_metadata di Supabase Auth berdasarkan token aktif
    const { data, error } = await supabase.auth.updateUser({
      data: updateData
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
        nama: updatedUser.user_metadata?.nama,
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

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: "Password baru wajib diisi dan minimal 6 karakter." });
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