require("dotenv").config(); // Wajib tambahkan baris ini di paling atas!
const { createClient } = require("@supabase/supabase-js");

// Inisialisasi ulang Supabase di controller
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Logika Register
exports.register = async (req, res) => {
  const { email, password, role } = req.body;

  // Mendaftarkan user ke Supabase Auth
  const { data, error } = await supabase.auth.signUp({
    email: email,
    password: password,
  });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  // Catatan: Untuk RBAC (Role), nanti kita akan tambahkan logika untuk
  // menyimpan variabel 'role' ke tabel khusus (misal tabel 'users' atau 'profiles')

  return res.status(201).json({
    message: "Registrasi berhasil!",
    user: data.user,
  });
};

// Logika Login
exports.login = async (req, res) => {
  const { email, password } = req.body;

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password,
  });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  return res.status(200).json({
    message: "Login berhasil!",
    token: data.session.access_token,
  });
};
