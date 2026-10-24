# React + TypeScript + Vite

## Backend API

- **Development:** Jalankan Backend Express di port `5000` dan Frontend dengan `npm run dev`. Request `/api/*` dari Vite akan diteruskan ke `http://localhost:5000`, jadi browser memakai origin Vite dan tidak perlu alamat Backend lokal di kode Frontend.
- **Production (Vercel):** Frontend dan Backend Express dapat menjadi dua proyek Vercel terpisah dari repository yang sama. Atur Root Directory proyek Frontend ke `FrontEnd` dan proyek Backend ke `BackEnd`, lalu pilih preset/framework Express untuk proyek Backend. Vercel menjalankan aplikasi yang diekspor dari `BackEnd/index.js` sebagai serverless function. Atur environment variable `VITE_API_URL` di proyek Frontend ke origin URL Backend, misalnya `https://mawas-backend.vercel.app` (tanpa akhiran `/api`), lalu redeploy Frontend. Atur `SUPABASE_URL`, `SUPABASE_KEY` (atau `SUPABASE_ANON_KEY`), `SUPABASE_SERVICE_ROLE_KEY`, `GROQ_API_KEY`, dan `FRONTEND_URL` pada proyek Backend Vercel; jangan memasukkan secret ke Frontend. `SUPABASE_KEY`/`SUPABASE_ANON_KEY` adalah anon key Supabase, sedangkan service role key hanya untuk Backend.
- **Development:** Jalankan `npm run dev` di `BackEnd` dan `npm run dev` di `FrontEnd` pada dua terminal. Backend tetap berjalan sebagai Express lokal pada port `5000`; Vite meneruskan request `/api/*` ke sana. Jangan set `VITE_API_URL` lokal, karena Frontend development menggunakan proxy Vite.
- **Google OAuth:** Atur `FRONTEND_URL` pada environment Backend ke origin Frontend aktif (misalnya URL Vercel) agar callback OAuth kembali ke domain yang benar. Untuk lokal, default callback tetap `http://localhost:5173`.

Jangan set `VITE_API_URL` ke `localhost` pada deployment production. Environment variable `VITE_*` hanya untuk konfigurasi publik, bukan untuk secret seperti `GROQ_API_KEY` atau `SUPABASE_SERVICE_ROLE_KEY`.

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
