require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const port = process.env.PORT || 5000;

// Inisialisasi Supabase (Kredensial diambil dari .env)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.json({ message: "Server mawas berjalan lancar!" });
});

app.listen(port, () => {
    console.log(`Server berjalan di http://localhost:${port}`);
});