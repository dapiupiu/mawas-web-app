const { createClient } = require('@supabase/supabase-js');

// Menggunakan Service Role Key agar bisa mengelola akun Auth Supabase
const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 1. Get List Semua Operator
exports.getAllOperators = async (req, res) => {
    try {
        const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();

        if (error) throw error;

        // Filter khusus user ber-role 'operator'
        const operators = users
            .filter(u => u.user_metadata?.role === 'operator')
            .map(u => ({
                id: u.id,
                email: u.email,
                nama: u.user_metadata?.nama || 'Operator',
                role: u.user_metadata?.role,
                createdAt: u.created_at
            }));

        return res.status(200).json({
            status: 'success',
            data: operators
        });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

// 2. Tambah Operator Baru (Bisa Pakai Email Google / Password Manual)
exports.createOperator = async (req, res) => {
    const { email, password } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email operator wajib diisi.' });
    }

    try {
        // Ambil semua user untuk menghitung urutan operator
        const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        if (listError) throw listError;

        const operatorCount = users.filter(u => u.user_metadata?.role === 'operator').length;
        const namaOperator = `Operator ${operatorCount + 1}`;

        // Jika password tidak dikirim (login via Google), buat password acak secara otomatis
        const generatedPassword = password || `OpMawas_${Math.random().toString(36).slice(-8)}!`;

        // Buat user baru di Supabase Auth
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
            email,
            password: generatedPassword,
            user_metadata: {
                role: 'operator',
                nama: namaOperator
            },
            email_confirm: true // Otomatis verifikasi email agar siap di-link dengan Google OAuth
        });

        if (error) throw error;

        return res.status(201).json({
            status: 'success',
            message: `${namaOperator} (${email}) berhasil mendaftarkan akun!`,
            data: {
                id: data.user.id,
                email: data.user.email,
                nama: namaOperator,
                role: 'operator'
            }
        });
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
};

// 3. Hapus Operator berdasarkan ID
exports.deleteOperator = async (req, res) => {
    const { id } = req.params;

    try {
        const { error } = await supabaseAdmin.auth.admin.deleteUser(id);

        if (error) throw error;

        return res.status(200).json({
            status: 'success',
            message: 'Operator berhasil dihapus.'
        });
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
};