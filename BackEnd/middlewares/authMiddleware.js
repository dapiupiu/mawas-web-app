const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL, 
    process.env.SUPABASE_KEY
);

// Middleware 1: Verifikasi apakah user sudah login (memiliki Token JWT yang valid)
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"

    if (!token) {
        return res.status(401).json({ 
            error: "Akses ditolak! Token autentikasi tidak ditemukan." 
        });
    }

    try {
        // Verifikasi token ke Supabase
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(403).json({ 
                error: "Token tidak valid atau sudah kadaluwarsa." 
            });
        }
        if (user.banned_until && new Date(user.banned_until) > new Date()) {
            return res.status(403).json({ error: "Akun dinonaktifkan. Hubungi Superadmin." });
        }

        // Simpan objek user ke req.user agar bisa dibaca middleware/controller berikutnya
        req.user = user;
        next();
    } catch (err) {
        return res.status(500).json({ 
            error: "Kesalahan server saat verifikasi token." 
        });
    }
};

// Middleware 2: Pengecekan Hak Akses (RBAC)
const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                error: "Pengguna belum terautentikasi." 
            });
        }

        // Jika argumen dilewatkan sebagai array tunggal, misal: authorizeRoles(['superadmin', 'operator'])
        const roles = Array.isArray(allowedRoles[0]) ? allowedRoles[0] : allowedRoles;

        // Mengambil role dari user_metadata Supabase
        const userRole = req.user?.user_metadata?.role || req.user?.role || 'user';

        if (!roles.includes(userRole)) {
            return res.status(403).json({ 
                error: `Akses ditolak! Fitur ini hanya untuk role: ${roles.join(', ')}` 
            });
        }

        next();
    };
};

module.exports = {
    authenticateToken,
    authorizeRoles
};