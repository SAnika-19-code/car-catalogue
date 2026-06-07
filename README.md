# Varsha Cushions — Car Accessories Catalogue Platform

A modern premium catalogue platform built for a real automobile accessories business using **Next.js, Firebase, Cloudinary, and Vercel**.

---

# Features

## Customer Features

* Premium responsive gallery UI
* Masonry-style photo layout
* Fullscreen image viewer
* Keyboard navigation
* Mobile optimized experience
* Company-wise catalogue browsing
* Smooth image transitions

---

## Admin Features

### Company Management
- Create new companies
- Rename companies without losing gallery data
- Manage company image collections
- Delete companies safely

### Image Management
- Upload multiple images
- Reorder images via drag-and-drop
- Bulk select and delete images
- Restore deleted images from recycle bin
- Permanently empty recycle bin

---

# Tech Stack

* Next.js
* React
* TypeScript
* Firebase Firestore
* Cloudinary CDN
* Tailwind CSS
* Vercel Deployment

---

# Cloudinary Optimization

Images are optimized using Cloudinary transformations:

* Automatic compression
* Responsive resizing
* Modern image formats
* Faster mobile loading

---

# Responsive Design

The platform is fully responsive and optimized for:

* Mobile devices
* Tablets
* Desktop screens

---

# Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=
NEXT_PUBLIC_WHATSAPP_NUMBER=
```

Set `NEXT_PUBLIC_WHATSAPP_NUMBER` to the business WhatsApp number with the
country code and without `+`, spaces, or dashes. Example: `919876543210`.

---

# Local Development

Install dependencies:

```bash
npm install
```

Run development server:

```bash
npm run dev
```

---

# Deployment

Deployed using Vercel.


---

# Future Improvements

* Advanced authentication
* Customer inquiry system
* AI image tagging
* Search & filters
* Analytics dashboard
* Custom domain integration

---

# Developer

Built by Sanika Gaikwad with AI guidance

---
---
<br>

# Sreenshots

<br>

## Home Page
  <p align='center'>
    <img alt="Homepage will direct to catalogue" src="https://github.com/user-attachments/assets/ab9c66c7-6486-4e5a-895f-8aaf8c2838da" width='70%' />
  </p>
  
<br>

## Customer View 
  <p align='center'>
    <img alt="Main Page" src="https://github.com/user-attachments/assets/cfd22925-168d-4c85-aca5-f5d3a30f0f38" width='70%' />
    <br><br>
    <img alt="Company vise categorization" src="https://github.com/user-attachments/assets/ac8a963c-9139-493b-be29-8fdf92c898aa" width='70%' />
    <br><br>
    <img alt="Photo gallery of that company car" src="https://github.com/user-attachments/assets/c9747ba9-b673-47df-9108-3cd17d8cb3f2" width='70%' />
  </p>
  
<br>

## Admin View
  <p align='center'>
    <img alt="Admin Panel and Dashboard" src="https://github.com/user-attachments/assets/a782183a-1717-4dce-8cc7-5488051aa2af" width='70%' />
    <br><br>
    <img alt="Catalogue login" src="https://github.com/user-attachments/assets/3a47fbcc-7cb1-4b44-991d-3987e9cf490f" width='70%' />
    <br><br>
    <img alt="Companies edditing panel" src="https://github.com/user-attachments/assets/bb8f74f9-dc63-4c60-97e4-04071d55dd4e" width='70%' />
    <br><br>
    <img alt="Double verification before deleting a company" src="https://github.com/user-attachments/assets/f0bb4443-5daf-414f-8203-69f555008843" width='70%' />
    <br><br>
    <img alt="Images for realighnment/deletion/addition" src="https://github.com/user-attachments/assets/9810c3d0-1de8-431d-ab57-ad483d7a353b" width='70%' />
    <br><br>
    <img alt="Recycle Bin" src="https://github.com/user-attachments/assets/f326c413-2d18-476b-ad6f-d552d41f7f34" width='70%' />
  </p>


