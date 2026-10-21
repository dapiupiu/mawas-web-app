const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Middleware 1: Verifikasi apakah user sudah login (memiliki Token JWT yang valid)
exports.authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"

    if (!token) {
        return res.status(401).json({ error: "Akses ditolak! Token autentikasi tidak ditemukan." });
    }

    // Verifikasi token ke Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
        return res.status(403).json({ error: "Token tidak valid atau sudah kadaluwarsa." });
    }

    // Simpan objek user ke req.user agar bisa dibaca middleware/controller berikutnya
    req.user = user;
    next();
};

// Middleware 2: Pengecekan Hak Akses (RBAC)
exports.authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        // Mengambil role yang tersimpan di user_metadata Supabase saat registrasi
        const userRole = req.user?.user_metadata?.role || req.user?.role || 'user';

        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({ 
                error: `Akses ditolak! Fitur ini hanya untuk role: ${allowedRoles.join(', ')}` 
            });
        }

        next();
    };
};