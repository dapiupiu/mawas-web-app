require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

// Inisialisasi Supabase Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Logika Register dengan Penyimpanan Role ke User Metadata
exports.register = async (req, res) => {
  // Mengambil email, password, dan role (default ke 'operator' jika role tidak dikirim)
  const { email, password, role = 'operator' } = req.body;

  // Mendaftarkan user ke Supabase Auth beserta role di options.data
  const { data, error } = await supabase.auth.signUp({
    email: email,
    password: password,
    options: {
      data: {
        role: role
      }
    }
  });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  return res.status(201).json({
    message: "Registrasi berhasil!",
    user: data.user,
  });
};

// Logika Login Email & Password
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

// Logika Login / Register via Google OAuth
exports.googleLogin = async (req, res) => {
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
};