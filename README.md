# Varsha Cushions - Car Accessories Catalogue

A responsive product catalogue and administration platform for an automotive
accessories business. Built with Next.js, Firebase, Cloudinary, and Vercel.

## Catalogue Categories

The catalogue is driven by reusable category configuration instead of separate
copies of the same gallery code.

### Company-wise galleries

- Car Seat Covers
- Roof Design

Customers first choose a company and then browse its designs.

### Direct galleries

- Steering Covers
- Floor Lamination

Customers browse all designs directly without choosing a company.

## Customer Features

- Responsive navy-and-gold catalogue interface
- Company-wise and direct gallery modes
- Three-column, Google Photos-style mobile gallery
- Fullscreen image viewer
- Desktop arrow and keyboard navigation
- Mobile swipe navigation
- Finger-following mobile slide animation
- Mobile pinch-to-zoom up to 4x with one-finger panning
- Previous and next image preloading within the swipe track
- WhatsApp inquiry button for every design
- Product type, company name, and image link included in inquiries
- Public Cloudinary display watermarks
- Consistently scaled watermarks across different image dimensions
- Lazy-loaded 480 x 480 Cloudinary gallery thumbnails
- Automatic modern image formats and mobile-friendly quality compression
- Fullscreen images limited to 1600 x 1600 instead of original resolution
- Original Cloudinary uploads remain unchanged
- Right-click, image dragging, selection, and mobile long-press deterrents

> Browser protections cannot completely prevent screenshots or access through
> developer tools. Display watermarks provide the stronger protection.

## Admin Features

- Firebase Authentication login gate for the complete admin area
- Dashboard totals across all catalogue categories
- Category-based gallery management
- Create, rename, and delete companies
- Drag company rows directly to reorder them, with persistent Firestore order
- Upload multiple images through Cloudinary
- Auto-closing upload status dropdown with percentage, file count, transferred
  size, and live upload speed
- Drag image tiles directly to reorder them
- Bulk image selection and deletion
- Recycle bin with image restoration
- Soft-delete confirmation with error-only failure messaging
- Permanent recycle-bin clearing from both Cloudinary and Firestore
- Permanent deletion also supports photos uploaded before this feature was added
- Firebase-authenticated server endpoint for protected Cloudinary deletion
- Clean original images in admin views without public watermarks
- Legacy seat-cover admin links redirect to the new category routes

## Architecture

Category behavior is configured in:

```text
src/catalogue/categories.ts
```

Shared customer components support both gallery modes:

```text
src/components/catalogue/
```

Shared admin components handle category, company, and image management:

```text
src/components/admin/
```

Public Cloudinary watermark URLs are generated in:

```text
src/catalogue/cloudinary.ts
```

## Firestore Structure

Company-wise galleries use one Firestore collection per category:

```text
seat-covers/{companyId}
roof-design/{companyId}
```

Each company document contains:

```text
name: string
images: string[]
trash: string[]
order: number
```

Direct galleries use documents inside the `catalogues` collection:

```text
catalogues/steering-covers
catalogues/floor-lamination
```

Each direct-gallery document contains the same `name`, `images`, and `trash`
fields. The `order` field is used by company-wise collections and determines
the company sequence shown in both admin and customer views.

## Firestore Security Rules

Public visitors can read catalogue data. Only authenticated Firebase users can
write:

```js
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /seat-covers/{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    match /roof-design/{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    match /catalogues/{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## Cloudinary

Images are uploaded once and their clean URLs are stored in Firestore.

Public pages generate transformed Cloudinary URLs that add a centered,
semi-transparent text watermark. Admin pages continue using the original URLs.
The watermark width is relative to each image, keeping its proportions
consistent across portrait and landscape designs.

Gallery grids request lazy-loaded `480 x 480` cropped thumbnails with automatic
format selection and economical quality compression. Fullscreen delivery uses
automatic format and quality settings and limits images to `1600 x 1600`.
Original uploads are not modified.

If Cloudinary Strict Transformations are enabled, allow the watermark
transformation used by the application.

### Recycle-bin deletion

Deleting a photo from a gallery first moves its original Cloudinary URL into
the Firestore recycle bin. This keeps the asset available for restoration.

When **Empty Bin** is confirmed:

1. The server verifies the current Firebase admin login.
2. The Cloudinary public ID is recovered from each stored image URL.
3. The original asset and its cached transformations are deleted from
   Cloudinary.
4. Only successfully deleted URLs are removed from the Firestore recycle bin.

This URL-based lookup means photos uploaded before permanent Cloudinary
deletion was introduced are supported without re-uploading or migrating them.
Any failed deletion remains in the recycle bin so it can be retried safely.

## Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=
NEXT_PUBLIC_CLOUDINARY_WATERMARK_TEXT=Varsha Cushions
NEXT_PUBLIC_CLOUDINARY_WATERMARK_WIDTH=0.48

NEXT_PUBLIC_WHATSAPP_NUMBER=919766222351

# Private server-only Cloudinary deletion credentials
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

`NEXT_PUBLIC_CLOUDINARY_WATERMARK_WIDTH` is a proportion of the image width.
For example, `0.48` means 48%.

The WhatsApp number must include the country code without `+`, spaces, or
dashes.

The deletion endpoint reuses `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, so a second
`CLOUDINARY_CLOUD_NAME` variable is not required. Add
`CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET` as private server variables in
both `.env.local` and the Vercel project, then redeploy.

Never prefix the Cloudinary API secret with `NEXT_PUBLIC_` and never commit it
to Git. If a secret is pasted into a message or otherwise exposed, rotate it in
Cloudinary before using the replacement value.

## Local Development

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

## Verification

```bash
npm run lint
npm run build
```

The current lint run completes with image-element optimization warnings only.
The production build passes successfully.

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Firebase Authentication
- Firebase Firestore
- Cloudinary
- Tailwind CSS 4
- dnd-kit
- Vercel

## Developer

Built by Sanika Gaikwad with AI guidance.
