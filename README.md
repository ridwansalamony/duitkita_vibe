# Finance App (Monorepo)

Monorepo fullstack finance application yang dibangun menggunakan **Bun**, **ElysiaJS** (Backend API), dan **SvelteKit** (Frontend Web).

## 📁 Struktur Monorepo

```text
finance-app/
├── apps/
│   ├── web/              # Frontend web application (SvelteKit)
│   └── api/              # Backend REST API (ElysiaJS + Bun)
├── packages/
│   ├── types/            # Shared TypeScript definitions
│   ├── constants/        # Shared constants
│   └── validation/       # Shared validation schemas
├── package.json          # Monorepo workspaces config
└── README.md
```

## 🚀 Memulai Proyek

### Kebutuhan
- [Bun](https://bun.sh/) (v1.0.0 atau lebih baru)

### Instalasi Dependensi
Jalankan perintah berikut di root folder:
```bash
bun install
```

### Menjalankan Server Development

Menjalankan seluruh aplikasi (Backend & Frontend) secara paralel:
```bash
bun run dev
```

Atau menjalankan aplikasi secara terpisah:
- **Backend API (ElysiaJS)**:
  ```bash
  bun run dev:api
  ```
  API akan berjalan di `http://localhost:3000` (atau port yang ditentukan).

- **Frontend Web (SvelteKit)**:
  ```bash
  bun run dev:web
  ```
  Web frontend akan berjalan di `http://localhost:5173`.

## 📦 Packages Bersama

- `@finance-app/types`: Menyimpan type/interface data (User, Transaction, dsb) yang dipakai bersama oleh frontend dan backend.
- `@finance-app/constants`: Konstanta aplikasi (Status codes, category types, error codes).
- `@finance-app/validation`: Validasi skema bersama.
