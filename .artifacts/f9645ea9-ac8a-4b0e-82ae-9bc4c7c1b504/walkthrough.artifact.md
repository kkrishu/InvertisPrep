# Walkthrough - Admin Security & Protected PDF Viewer

I have implemented the requested security enhancements and the protected PDF viewer.

## Changes Summary

### 1. Admin Password Management
- **Enhanced `seedSuperAdmin.js`**: The script now supports updating an existing admin's password instead of deleting the user.
- **CLI Arguments**: You can now pass a custom password via `--password=YOUR_PASS`.
  - Example: `npm run seed -- --password=newSecurePassword123`

### 2. Protected PDF Viewer (Security First)
- **Authenticated Proxy**: Created a new server-side endpoint `/api/pdf/view/:id` that fetches the PDF from Cloudinary on behalf of the user.
- **Watermarking**: Integrated `pdf-lib` to dynamically add a per-user watermark (Name, Email, Timestamp) to every page of the PDF.
- **URL Redaction**: Modified PYQ and Syllabus API controllers to **exclude** `cloudinaryUrl` and `cloudinaryPublicId` from public responses. This prevents users from bypassing our viewer to download raw files.
- **Custom Client Viewer**:
  - Implemented a `PDFViewer` component using `react-pdf`.
  - Added protections against right-click and common keyboard shortcuts (Ctrl+P, Ctrl+S).
  - The viewer fetches the PDF as a Blob via the authenticated proxy, ensuring no direct links are exposed.

### 3. UI/UX Updates
- Updated all "View" and "Download" buttons across the app to redirect to the new protected viewer page (`/view/[id]`).
- The viewer includes navigation controls (Prev/Next), Zoom (In/Out), and a loading state while the watermark is being applied.

## Verification Done

### Backend
- Added `pdf-lib` dependency.
- Verified `seedSuperAdmin.js` logic for updating existing users.
- Created `pdfController.js` with robust error handling and watermark logic.
- Registered `/api/pdf` routes in `server.js`.

### Frontend
- Added `react-pdf` dependency.
- Created `PDFViewer.tsx` component with worker configuration.
- Created `/view/[id]/page.tsx` as the entry point for viewing any paper.
- Updated `api.ts` to include `pdfApi.view`.
- Updated multiple pages to use the new viewer route.

> [!TIP]
> To test the new password script, run:
> `cd server && npm run seed -- --password=yournewpassword`

> [!IMPORTANT]
> Since we redacted the `cloudinaryUrl` from the API, direct download links in legacy tabs (if any) will stop working once they refresh. Users MUST use the in-app viewer now.
