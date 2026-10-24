# React + TypeScript + Vite

## Backend API

- **Development:** Jalankan Backend Express di port `5000` dan Frontend dengan `npm run dev`. Request `/api/*` dari Vite akan diteruskan ke `http://localhost:5000`, jadi browser memakai origin Vite dan tidak perlu alamat Backend lokal di kode Frontend.
- **Production (Vercel):** Atur environment variable `VITE_API_URL` ke URL publik Backend Express, misalnya `https://backend.example.com`. Setelah mengubah variable, lakukan redeploy Frontend. Backend harus di-deploy dan mengizinkan origin domain Frontend melalui CORS.

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
