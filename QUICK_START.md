# Quick Start - Deployment

## ✅ GitHub Repository
**Status:** ✅ Deployed to https://github.com/draphael123/Fountain-Spell-Assist.git

## 📦 Create First Release

1. Go to: https://github.com/draphael123/Fountain-Spell-Assist/releases/new

2. Create a new release:
   - **Tag:** `v1.0.0`
   - **Title:** `v1.0.0 - Initial Release`
   - **Description:** 
     ```
     Initial release of Fountain Spell Assist
     
     Features:
     - On-device spell checking
     - Custom dictionary support
     - Per-site controls
     - Privacy-first design
     ```

3. Upload the zip file:
   - The zip file is already created at `dist/fountain-spell-assist.zip`
   - Or download it from the repo and upload it manually
   - Drag and drop `fountain-spell-assist.zip` into the release

4. Click **"Publish release"**

## 🚀 Deploy to Vercel

### Method 1: Vercel Dashboard (Easiest)

1. Go to https://vercel.com
2. Sign in with your GitHub account
3. Click **"New Project"**
4. Import repository: `draphael123/Fountain-Spell-Assist`
5. Configure:
   - **Framework Preset:** Other
   - **Root Directory:** `./` (default)
   - **Build Command:** Leave empty (or `npm run build:extension` if you want to build)
   - **Output Directory:** `public`
   - **Install Command:** `npm install`
6. Click **"Deploy"**

### Method 2: Vercel CLI

```bash
npm i -g vercel
cd "C:\Users\danie\OneDrive\Desktop\Cursor Projects\Fountain Spell Assist"
vercel
```

Follow the prompts to link and deploy.

## 🔗 Download Link

After creating the GitHub release, the landing page download link will automatically work:
```
https://github.com/draphael123/Fountain-Spell-Assist/releases/latest/download/fountain-spell-assist.zip
```

The landing page at `public/index.html` already includes this link.

## 📝 Notes

- The landing page is ready at `public/index.html`
- The download button points to GitHub releases
- Vercel will serve the `public` directory
- No environment variables needed

## 🎯 Next Steps

1. ✅ Code is on GitHub
2. ⏳ Create first release (upload zip file)
3. ⏳ Deploy to Vercel
4. ✅ Landing page ready with download link

