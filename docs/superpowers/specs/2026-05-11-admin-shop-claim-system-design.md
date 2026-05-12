# Admin Shop Creation & Claim System — Design Spec

## Date: 2026-05-11

---

## Overview

A system that allows the admin (UID: `3sPa1kDv6JcC2nEHeuJQOeL7Xl53`) to create "ownerless" shops on the map, upload logos/banners via Cloudinary, and generate unique invitation links. When a recipient signs up via that link, the shop automatically transfers to them — moving its location to their GPS coordinates and making them the owner.

---

## Admin Page (`/admin`)

### Access Control
- Protected by `useAuth` + `ADMIN_UID` check from `lib/admin-config.ts`
- Non-admin users see a 403-style message

### Section 1: Create New Shop
Form fields:
- **Shop Name (EN)** — required
- **Shop Name (MM)** — optional
- **Category** — dropdown
- **Phone** — required
- **Address** — required
- **Facebook** — optional
- **TikTok** — optional
- **Logo Upload** — Cloudinary, folder: `shop-logos`
- **Banner Upload** — Cloudinary, folder: `shop-banners`, multiple
- **Location Picker** — Leaflet map, click to drop a temporary pin. Admin can drag to adjust.

**On Submit:**
- Upload images to Cloudinary
- `POST /api/admin/shops`
- Shop created with:
  - `owner_id: "PENDING"` (special sentinel value, not a real UID)
  - `created_by: "3sPa1kDv6JcC2nEHeuJQOeL7Xl53"`
  - `status: "active"`
  - `location` from the map pin
  - All form fields

### Section 2: All Shops Overview
A table/grid showing every shop in the `shops` collection.

**Columns/Card fields:**
- Shop name
- Category
- Status badge: **Ownerless** (red) or **Claimed** (green) + owner display name
- Temporary location (lat, lng)
- Copy Invite Link button → copies `/auth?claim={shop_id}`
- **Open Dashboard** button → navigates to `/shop/dashboard` (reuses existing dashboard)

---

## API Endpoints

### `POST /api/admin/shops`
- **Auth:** Rejects if `x-user-id` header !== `ADMIN_UID`
- **Body:** Full shop data including `logo_url`, `image_urls[]`, `location`
- **Action:** Creates shop doc in Firestore with `owner_id: "PENDING"`
- **Returns:** `{ shop_id, ...shopData }`

### `GET /api/admin/shops`
- **Auth:** Admin-only
- **Action:** Returns all shops from Firestore
- **Returns:** Array of shops enriched with `isClaimed: owner_id !== "PENDING"`

### `POST /api/admin/shops/[shopId]/claim`
- **Auth:** Must include `x-user-id` of the newly signed-up user
- **Body:** `{ user_lat, user_lng }` — the new owner's GPS coordinates
- **Validation:** Only works if shop `owner_id === "PENDING"`
- **Action:**
  1. Update `owner_id` to the caller's UID
  2. Update `location` GeoPoint to `{ user_lat, user_lng }`
  3. Update `updated_at`
- **Returns:** `{ success: true, shop_id }`

---

## Auth Flow Modification (`/auth` page)

### URL Parameter Detection
- On mount, check for `claim` query param (`/auth?claim=SHOP_ID`)
- If present and valid shop ID (Firestore doc exists, `owner_id === "PENDING"`):
  - Show a banner: "You're claiming ownership of [Shop Name]"
  - After successful signup (not login), auto-call the claim API

### Post-Signup Claim Sequence
1. User completes signup → Firebase auth created
2. Get user's GPS location via `navigator.geolocation`
3. `POST /api/admin/shops/{shopId}/claim` with user UID + GPS coords
4. On success → redirect to `/shop/dashboard`
5. On failure → show error, but user account still exists

### Important Edge Case
- If user already has an account and visits `/auth?claim=SHOP_ID`:
  - If logged in: show "Claim shop" button instead of signup form
  - If not logged in: after login, prompt to claim

---

## Firestore Schema Changes

### `shops` collection (existing, extended)
New/updated fields:
- `owner_id: string` — `"PENDING"` for admin-created ownerless shops, real UID after claim
- `created_by: string` — Admin UID, for tracking (optional)

No migration needed — existing shops with real `owner_id` keep working.

---

## Files to Create

| File | Purpose |
|------|---------|
| `app/admin/page.tsx` | Main admin page UI |
| `app/api/admin/shops/route.ts` | POST (create), GET (list) |
| `app/api/admin/shops/[shopId]/claim/route.ts` | POST claim ownership |
| `app/api/admin/shops/[shopId]/route.ts` | GET single shop details |
| `components/admin/location-picker.tsx` | Map for admin to place pin |
| `components/admin/shop-card.tsx` | Card for shop in admin grid |
| `hooks/use-admin-guard.ts` | Hook to protect admin-only routes |

## Files to Modify

| File | Change |
|------|--------|
| `app/auth/page.tsx` | Detect `claim` param, show banner, post-signup claim flow |
| `lib/auth-context.tsx` | Add `claimShop(shopId)` helper or leave in page logic |

## No-Modify List (Existing systems stay untouched)

- `app/shop/dashboard/page.tsx` — existing dashboard reused as-is
- `app/api/shops/create/route.ts` — normal registration flow unchanged
- `app/api/shops/my-shop/route.ts` — unchanged
- `lib/upload.ts` — Cloudinary util reused as-is

---

## Security Considerations

1. **Admin-only APIs** — Every admin endpoint must verify `x-user-id` header matches `ADMIN_UID`
2. **Claim validation** — Only shops with `owner_id === "PENDING"` can be claimed
3. **One-time claim** — Once claimed, `owner_id` is a real UID and cannot be re-claimed
4. **Location privacy** — User's GPS only sent after explicit signup consent

---

## UI/UX Decisions

- Admin page uses the existing dark mode CSS variables (`bg-[var(--background)]`, etc.)
- Map picker reuses existing Leaflet configuration from `lib/leaflet-config.ts`
- Invite link is just a URL string — no JWT/token needed since `owner_id === "PENDING"` is the only gate
- "Copy Link" uses `navigator.clipboard.writeText()` with a toast confirmation

---

## Open Questions (Resolved)

| Question | Decision |
|----------|----------|
| Invite link format? | `/auth?claim=SHOP_ID` (Option A) |
| Location on claim? | Auto-move to user's GPS, no choice |
| Admin sees all shops? | Yes, all shops with status badges and dashboard links |
