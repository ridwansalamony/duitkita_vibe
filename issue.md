# Task: Implementasi Autentikasi dan Manajemen Household API

## Deskripsi Singkat
Task ini bertujuan untuk membangun pondasi backend API (ElysiaJS) yang mencakup sistem Autentikasi User dan Manajemen Household. Sistem ini dirancang untuk mendukung fitur "multi-family" di masa depan, sehingga setiap data finansial (transaksi, akun, dsb) akan menginduk pada entitas `Household`, bukan langsung pada `User`.

---

## 1. Prinsip Arsitektur Utama: Household-Centric

**⚠️ SANGAT PENTING ⚠️**
Jangan membuat desain database di mana tabel/collection transaksi langsung merujuk pada `userId` (contoh: menganggap data transaksi milik user tersebut mewakili seluruh data keluarganya). 

**Gunakan struktur berikut:**
```text
User
  ↓ (1 atau lebih user bisa berada dalam 1 household)
Household
  ↓ (Setiap data finansial dimiliki oleh household)
Financial Data (Accounts, Categories, Transactions, Budgets, Goals)
```

Dengan desain ini, aplikasi siap jika nantinya satu akun *User* ingin mengakses lebih dari satu *Household* (misal: keuangan rumah tangga dan keuangan bisnis kecil) atau beberapa *User* (suami & istri) mengakses *Household* yang sama.

---

## 2. Struktur Database & Aturan Validasi (MongoDB Atlas)

Gunakan standar validasi dari ekosistem ElysiaJS (biasanya menggunakan TypeBox) untuk memvalidasi payload dari user sebelum masuk ke database, dan gunakan tipe data yang tepat saat menyimpan ke MongoDB.

### A. Collection: `users`
| Field | Tipe Data | Validasi / Aturan |
| :--- | :--- | :--- |
| `_id` | ObjectId | Auto-generated oleh MongoDB |
| `name` | String | Wajib, min: 3 karakter, max: 255 karakter |
| `email` | String | Wajib, format email valid, unik (unique index), lowercase |
| `passwordHash` | String | Wajib (hash menggunakan bcrypt/argon2/bun:password) |
| `avatar` | String | Opsional, format URL valid |
| `phone` | String | Opsional, min: 10 digit, max: 15 digit |
| `isActive` | Boolean | Default: `true` |
| `lastLoginAt` | ISODate | Opsional |
| `createdAt` | ISODate | Otomatis diisi saat insert |
| `updatedAt` | ISODate | Otomatis diupdate saat ada perubahan |

### B. Collection: `households`
| Field | Tipe Data | Validasi / Aturan |
| :--- | :--- | :--- |
| `_id` | ObjectId | Auto-generated oleh MongoDB |
| `name` | String | Wajib, min: 3 karakter, max: 100 karakter |
| `currency` | String | Wajib, format: 3 huruf kapital (contoh: "IDR", "USD"), max: 3 |
| `timezone` | String | Wajib, format IANA (contoh: "Asia/Jakarta") |
| `ownerId` | ObjectId | Wajib, merujuk ke `users._id` (pembuat household) |
| `settings` | Object | Menyimpan pengaturan spesifik household |
| `settings.startOfMonth` | Number | Opsional, angka 1-31 (default: 1) |
| `settings.defaultAccountId` | ObjectId | Opsional, merujuk ke collection Accounts (jika ada) |
| `settings.defaultCategoryId`| ObjectId | Opsional, merujuk ke collection Categories (jika ada) |
| `createdAt` | ISODate | Otomatis diisi saat insert |
| `updatedAt` | ISODate | Otomatis diupdate saat ada perubahan |

---

## 3. Daftar Endpoint API

### Auth Endpoints
- `POST /api/auth/register` : Mendaftarkan user baru (membuat dokumen di collection `users`).
- `POST /api/auth/login` : Autentikasi user, menghasilkan JWT Token.
- `POST /api/auth/logout` : Logout user (invalidasi di klien atau hapus cookie).
- `GET /api/auth/me` : Mengambil data profil user yang sedang login berdasarkan token.
- `PUT /api/auth/me` : Mengupdate data profil user yang sedang login.
- `DELETE /api/auth/me` : Menghapus atau menonaktifkan akun user.

### Household Endpoints
- `POST /api/households` : Membuat household baru (terkait dengan user yang login sebagai owner).
- `GET /api/households` : Mengambil daftar household yang dimiliki/diikuti oleh user yang sedang login.
- `PUT /api/households/:id` : Mengupdate informasi household.
- `DELETE /api/households/:id` : Menghapus household (hanya diizinkan untuk user sebagai `ownerId`).

---

## 4. Standar Response API

Setiap response dari API **WAJIB** mengikuti format standar berikut:

**✅ Contoh Sukses (Status Code: 200/201)**
```json
{
    "meta": {
        "status": true,
        "statusCode": 200,
        "message": "Operasi berhasil dilakukan"
    },
    "data": {
        // Objek atau array data yang dikembalikan API (profil user, dll)
    }
}
```

**❌ Contoh Error (Status Code: 400/401/403/404/500)**
```json
{
    "meta": {
        "status": false,
        "statusCode": 400,
        "message": "Validasi gagal: Email sudah terdaftar"
    },
    "data": {
        // Opsional: detail pesan error atau object error validasi
    }
}
```

---

## 5. Struktur Folder dan Penamaan File

Letakkan seluruh logika backend di dalam environment `apps/api/src/`. Gunakan struktur direktori yang modular dan *separation of concerns*:

- `controllers/` : Berisi *controller* API yang menerima *request* dari *routes*, memanggil *service*, dan mengembalikan *response* sesuai format di atas.
  - Penamaan: `*.controller.ts` (misal: `user.controller.ts`)
- `routes/` : Deklarasi endpoint (ElysiaJS route definition) dan menghubungkannya dengan controller terkait.
  - Penamaan: `*.routes.ts` (misal: `user.routes.ts`)
- `models/` : Definisi skema MongoDB dan juga validasi skema TypeBox untuk *request body*.
  - Penamaan: `*.model.ts` (misal: `user.model.ts`)
- `services/` : Berisi *business logic* dan operasi langsung ke *database* (CRUD).
  - Penamaan: `*.service.ts` (misal: `user.service.ts`)
- `middlewares/` : Berisi logika pencegatan/intercept untuk hal seperti autentikasi JWT dan proteksi endpoint.
  - Penamaan: `*.middleware.ts` (misal: `auth.middleware.ts`)
- `utils/` : Utility pembantu untuk operasi standar.
  - Penamaan: `*.util.ts` (misal: `response.util.ts`, `password.util.ts`)

---

## 6. Tahapan Implementasi (Panduan Eksekusi)

Bagian ini ditujukan untuk **Junior Programmer** atau **AI Model** sebagai panduan pengerjaan yang terstruktur (step-by-step). **Jangan melompati tahapan-tahapan ini!**

### Tahap 1: Setup Utilities
1. Buat file `utils/response.util.ts` yang berisi *helper function* untuk membuat format response standar (struktur `meta` dan `data`), sehingga kode *controller* tidak *redundant*.
2. Buat file `utils/password.util.ts` untuk abstraksi *hashing* (bisa menggunakan `Bun.password` yang *native* pada runtime Bun).

### Tahap 2: Setup Database & Models
1. Konfigurasikan koneksi MongoDB (jika belum ada) di dalam folder config.
2. Buat `models/user.model.ts` dengan schema MongoDB yang mengatur aturan validasi (misalnya `unique: true` pada `email`) serta mendefinisikan skema validasi request (TypeBox) untuk payload.
3. Buat `models/household.model.ts` dengan schema untuk Household.

### Tahap 3: Logic Layer (Services)
1. Buat `services/auth.service.ts`. Implementasikan logika:
   - `registerUser`: Validasi ketersediaan email, hash password, simpan ke database.
   - `loginUser`: Cari email, verifikasi password, generate informasi payload untuk JWT.
   - Fungsi untuk operasi profil lainnya.
2. Buat `services/household.service.ts`. Implementasikan logika pembuatan, pencarian, dan update household yang terikat dengan *userId* pemiliknya.

### Tahap 4: HTTP Layer (Controllers)
1. Buat `controllers/auth.controller.ts`. Gunakan *try-catch* untuk memanggil fungsi dari `auth.service.ts` dan me-return datanya dibungkus dengan `response.util.ts`.
2. Buat `controllers/household.controller.ts` dengan pendekatan yang sama.

### Tahap 5: Implementasi Middleware (Proteksi Rute)
1. Buat `middlewares/auth.middleware.ts`. Buat plugin Elysia yang berfungsi mengekstrak Bearer token dari *headers*, memvalidasi JWT (gunakan `@elysiajs/jwt`), dan menyuntikkan data *user context* (contoh: `userId`) ke proses rute selanjutnya. Jika gagal, kembalikan response *error* 401.

### Tahap 6: Deklarasi Endpoint (Routes)
1. Buat `routes/auth.routes.ts`. Hubungkan dengan method-method dari `auth.controller.ts`.
2. Buat `routes/household.routes.ts`. Hubungkan dengan method dari `household.controller.ts`. Gunakan *middleware* autentikasi di *route* ini agar hanya user yang login yang bisa mengaksesnya.
3. Integrasikan semua rute tersebut ke dalam *entry point* API (`apps/api/src/index.ts`).

### Tahap 7: Testing
1. Uji fungsi register. Pastikan field mandatory tervalidasi dan standar response dikembalikan.
2. Uji kondisi gagal, misal register menggunakan *email* yang sudah ada.
3. Uji login dan pastikan *token* didapatkan.
4. Uji endpoint terproteksi (`/api/households`) baik tanpa token (harus gagal) maupun dengan token.
