# Issue: Household Members Relation & Invitation System

> **Target**: Junior Programmer / AI Model  
> **Prioritas**: High  
> **Stack**: ElysiaJS + Bun + MongoDB Atlas

---

## Ringkasan

Saat ini sistem `households` hanya mengenal satu `ownerId`. Kita perlu mengubahnya menjadi sistem multi-member agar dua orang (misalnya pasangan) bisa berbagi satu `household` bersama.

Dua fitur utama yang akan diimplementasikan:
1. **Household Members Relation** — Mengubah `ownerId` menjadi array `members` berisi `{ userId, role }`.
2. **Invitation System** — Mekanisme undangan berbasis token agar user bisa mengundang orang lain masuk ke household-nya.

---

## Konteks Codebase Saat Ini

Struktur direktori `apps/api/src`:
```
src/
├── config/
│   └── db.ts                    # Koneksi MongoDB Atlas
├── controllers/
│   ├── auth.controller.ts
│   └── household.controller.ts
├── middlewares/
│   └── auth.middleware.ts       # JWT middleware
├── models/
│   ├── user.model.ts
│   └── household.model.ts       # PERLU DIMODIFIKASI
├── routes/
│   ├── auth.routes.ts
│   └── household.routes.ts
├── services/
│   ├── auth.service.ts          # PERLU DIMODIFIKASI
│   └── household.service.ts     # PERLU DIMODIFIKASI
├── utils/
│   ├── password.util.ts
│   └── response.util.ts
└── index.ts                     # PERLU DIMODIFIKASI (mount route baru)
```

### File yang Perlu Dibuat (Baru)
```
src/
├── models/
│   └── invitation.model.ts      # BARU
├── services/
│   └── invitation.service.ts    # BARU
├── controllers/
│   └── invitation.controller.ts # BARU
├── routes/
│   └── invitation.routes.ts     # BARU
└── utils/
    └── token.util.ts            # BARU
```

---

## 1. Skema Database MongoDB

### Collection: `households` (DIMODIFIKASI)

Hapus field `ownerId`, ganti dengan array `members`:

```typescript
// SEBELUM
{
  _id: ObjectId,
  name: string,
  currency: string,
  timezone: string,
  ownerId: ObjectId,       // <-- HAPUS INI
  settings: { ... },
  createdAt: Date,
  updatedAt: Date
}

// SESUDAH
{
  _id: ObjectId,
  name: string,
  currency: string,
  timezone: string,
  members: [               // <-- GANTI DENGAN INI
    {
      userId: ObjectId,
      role: "owner" | "member"
    }
  ],
  settings: { ... },
  createdAt: Date,
  updatedAt: Date
}
```

**Role yang tersedia (cukup dua, jangan lebih):**
- `"owner"` — pembuat household, punya hak penuh (edit, delete, undang)
- `"member"` — anggota biasa, bisa lihat dan input data

### Collection: `invitations` (BARU)

```typescript
{
  _id: ObjectId,
  householdId: ObjectId,
  invitedBy: ObjectId,     // userId yang membuat undangan
  email: string,           // email orang yang diundang
  tokenHash: string,       // SHA-256 hash dari token (JANGAN simpan plaintext!)
  status: "pending" | "accepted" | "expired" | "cancelled",
  expiresAt: Date,         // biasanya 7 hari dari createdAt
  acceptedAt?: Date,       // diisi saat status berubah jadi "accepted"
  createdAt: Date
}
```

---

## 2. Endpoint API Baru

### Invitation Endpoints (prefix: `/api/invitations`)

| Method | Path | Deskripsi | Auth Required |
|--------|------|-----------|---------------|
| `POST` | `/api/invitations` | Buat undangan baru | Ya |
| `GET` | `/api/invitations/validate/:token` | Validasi token (untuk calon member) | Tidak |
| `POST` | `/api/invitations/accept/:token` | Terima undangan | Ya |

#### `POST /api/invitations`
- Request body: `{ householdId: string, email: string }`
- Hanya `owner` dari household yang bisa membuat undangan
- Generate random token, hash dengan SHA-256, simpan `tokenHash` ke DB
- Return: plain token (untuk disisipkan ke URL undangan), bukan hash-nya
- Contoh response:
  ```json
  {
    "meta": { "status": "success", "statusCode": 201, "message": "Invitation created" },
    "data": {
      "invitationId": "...",
      "token": "abc123plaintoken...",
      "expiresAt": "2026-09-24T10:00:00Z"
    }
  }
  ```

#### `GET /api/invitations/validate/:token`
- Tidak perlu JWT (calon member belum tentu punya akun)
- Hash token dari URL, cari di DB berdasarkan `tokenHash`
- Validasi: status harus `pending`, `expiresAt` belum lewat
- Return: info household (nama, currency) agar calon member bisa preview
- Contoh response:
  ```json
  {
    "meta": { "status": "success", "statusCode": 200, "message": "Invitation is valid" },
    "data": {
      "householdName": "Ridwan & Partner",
      "invitedByName": "Ridwan",
      "expiresAt": "2026-09-24T10:00:00Z"
    }
  }
  ```

#### `POST /api/invitations/accept/:token`
- Perlu JWT (user harus sudah login/register dulu)
- Hash token dari URL, cari di DB
- Validasi: status `pending`, belum expired
- Push `{ userId, role: "member" }` ke array `members` di collection `households`
- Update status invitation menjadi `accepted`, isi `acceptedAt`
- Return: data household yang baru dimasuki

---

## 3. Flow Undangan Lengkap

```
Ridwan (owner)
  |
  |-- POST /api/invitations
  |     body: { householdId, email: "istri@example.com" }
  |     <- response: { token: "xyz123..." }
  |
  |-- Ridwan kirim link ke istri:
  |     https://app.duitkita.com/invite/xyz123...
  |
Istri (calon member)
  |
  |-- GET /api/invitations/validate/xyz123...
  |     <- response: { householdName: "Ridwan & Partner", ... }
  |
  |-- [Register / Login] jika belum punya akun
  |     POST /api/auth/register atau POST /api/auth/login
  |     <- response: { token: "JWT..." }
  |
  |-- POST /api/invitations/accept/xyz123...
        header: Authorization: Bearer JWT...
        <- response: { household: { name: "Ridwan & Partner", members: [...] } }
```

---

## 4. Detail Teknis Penting

### Token Generation & Hashing
- **Generate**: Gunakan `crypto.randomBytes(32).toString("hex")` 64 karakter hex, URL-safe
- **Hash**: Gunakan `crypto.createHash("sha256").update(token).digest("hex")`
- **Simpan ke DB**: hanya `tokenHash` (hasil hash)
- **Kirim ke user**: hanya `token` (plaintext, sebelum di-hash)
- **Verifikasi**: hash ulang token dari URL, lalu cari `tokenHash` di DB

```typescript
// Contoh di token.util.ts
import crypto from "crypto";

export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
```

### Pengecekan Role di Household
Setiap operasi yang memerlukan otorisasi (buat undangan, edit household, delete household) harus mengecek role user di array `members`:

```typescript
// Contoh helper
function getMemberRole(household: HouseholdDocument, userId: string): string | null {
  const member = household.members.find(
    (m) => m.userId.toString() === userId
  );
  return member?.role ?? null;
}
```

### Query MongoDB yang Berubah
```typescript
// SEBELUM - cari berdasarkan ownerId
households.find({ ownerId: new ObjectId(userId) })

// SESUDAH - cari berdasarkan keberadaan userId di array members
households.find({ "members.userId": new ObjectId(userId) })

// SEBELUM - cek apakah user adalah owner
households.findOne({ _id: householdId, ownerId: userId })

// SESUDAH - cek apakah user adalah owner (ada di members dengan role "owner")
households.findOne({
  _id: householdId,
  members: { $elemMatch: { userId: new ObjectId(userId), role: "owner" } }
})
```

---

## 5. Daftar File yang Harus Dimodifikasi

### `src/models/household.model.ts`
- Tambahkan interface `HouseholdMember` dengan properti `userId: ObjectId` dan `role: "owner" | "member"`
- Hapus `ownerId: ObjectId` dari interface `HouseholdDocument`
- Tambahkan `members: HouseholdMember[]` ke interface `HouseholdDocument`

### `src/services/auth.service.ts`
- Di method `register()`, saat membuat `initialHousehold`:
  - Hapus field `ownerId`
  - Ganti dengan `members: [{ userId: userId, role: "owner" }]`

### `src/services/household.service.ts`
- Method `createHousehold(ownerId, input)`:
  - Hapus `ownerId: new ObjectId(ownerId)` dari dokumen baru
  - Tambahkan `members: [{ userId: new ObjectId(ownerId), role: "owner" }]`
- Method `getHouseholdsByUser(userId)`:
  - Query: `{ "members.userId": new ObjectId(userId) }` (ganti dari `{ ownerId: ... }`)
- Method `getHouseholdById(householdId, userId)`:
  - Hapus filter `ownerId` dari query, cukup cari by `_id`, lalu validasi keberadaan userId di `members`
- Method `updateHousehold(householdId, userId, input)`:
  - Ganti filter `ownerId` dengan `$elemMatch` untuk memastikan user adalah `"owner"`
- Method `deleteHousehold(householdId, userId)`:
  - Ganti filter `ownerId` dengan `$elemMatch` untuk memastikan user adalah `"owner"`

### `src/index.ts`
- Import `invitationRoutes` dari `./routes/invitation.routes`
- Tambahkan `.use(invitationRoutes)` di dalam `.group("/api", ...)`

---

## 6. Tahapan Implementasi (Panduan Eksekusi)

Bagian ini ditujukan untuk **Junior Programmer** atau **AI Model** sebagai panduan pengerjaan yang terstruktur (step-by-step). **Jangan melompati tahapan-tahapan ini!**

### Tahap 1: Buat Utility Baru
1. Buat file `src/utils/token.util.ts` yang berisi dua fungsi:
   - `generateToken()` - generate random 32-byte hex string
   - `hashToken(token: string)` - hash string dengan SHA-256, return hex

### Tahap 2: Perbarui Model
1. Modifikasi `src/models/household.model.ts`:
   - Tambahkan interface `HouseholdMember`
   - Hapus `ownerId` dari `HouseholdDocument`
   - Tambahkan `members: HouseholdMember[]`
2. Buat `src/models/invitation.model.ts`:
   - Interface `InvitationDocument`
   - Elysia schema `CreateInvitationSchema` dengan body `{ householdId: string, email: string }`
   - Status enum: `"pending" | "accepted" | "expired" | "cancelled"`

### Tahap 3: Perbarui Services yang Ada
1. **`auth.service.ts`**: Di method `register()`, ubah pembuatan `initialHousehold` agar menggunakan `members` array, bukan `ownerId`.
2. **`household.service.ts`**: Update semua query dan filter seperti yang dijelaskan di Bagian 5.

### Tahap 4: Buat Invitation Service
1. Buat `src/services/invitation.service.ts` dengan tiga method:
   - `createInvitation(invitedByUserId, input)` - generate token, hash, simpan ke DB, return plaintext token
   - `validateInvitation(token)` - hash token, cari di DB, validasi status & expiry, return info household
   - `acceptInvitation(token, acceptingUserId)` - hash token, validasi, push member ke household, update status

### Tahap 5: Buat Controller dan Routes
1. Buat `src/controllers/invitation.controller.ts` dengan handler untuk setiap endpoint.
2. Buat `src/routes/invitation.routes.ts` yang mount semua handler dengan method dan path yang sesuai.

### Tahap 6: Mount Routes di Index
1. Di `src/index.ts`, import `invitationRoutes` dan tambahkan ke group `/api`.

### Tahap 7: Update Test
1. Buka file `apps/api/test-flow.ts`.
2. Sesuaikan test yang sudah ada (household tests) agar tidak lagi mengecek field `ownerId`, melainkan mengecek array `members`.
3. Tambahkan test baru untuk full invitation flow:
   - Login sebagai user 1 (owner)
   - Buat invitation
   - Validate token (tanpa auth)
   - Register/login sebagai user 2
   - Accept invitation dengan token
   - Verifikasi user 2 sudah masuk ke array `members` household
4. Jalankan `bun run test` dari direktori `apps/api` dan pastikan semua test lulus.

---

## 7. Acceptance Criteria (Definition of Done)

- [ ] `bun run test` di `apps/api` lulus 100% tanpa error
- [ ] Field `ownerId` sudah tidak ada lagi di collection `households`
- [ ] Field `members` berisi array `{ userId, role }` yang valid
- [ ] Saat register, user otomatis masuk ke array `members` household awal dengan role `"owner"`
- [ ] Endpoint `POST /api/invitations` hanya bisa diakses oleh `owner` household
- [ ] Token undangan tidak tersimpan dalam bentuk plaintext di database
- [ ] Token expired setelah 7 hari
- [ ] Endpoint `GET /api/invitations/validate/:token` bisa diakses tanpa JWT
- [ ] Endpoint `POST /api/invitations/accept/:token` memerlukan JWT yang valid
- [ ] Setelah accept, user baru muncul di array `members` dengan role `"member"`
- [ ] Status invitation berubah menjadi `"accepted"` dan field `acceptedAt` terisi
- [ ] Semua response mengikuti format standar: `{ meta: { status, statusCode, message }, data }`
