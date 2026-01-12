# Deployment Guide

## GitHub Repository

The code has been pushed to: https://github.com/draphael123/Fountain-Spell-Assist.git

## Creating a Release

1. **Build the extension:**
   ```bash
   npm run build:extension
   npm run zip
   ```

2. **Create a GitHub Release:**
   - Go to https://github.com/draphael123/Fountain-Spell-Assist/releases/new
   - Create a new tag (e.g., `v1.0.0`)
   - Upload `dist/fountain-spell-assist.zip` as an asset
   - Publish the release

   OR use the GitHub Actions workflow:
   - Push a tag: `git tag v1.0.0 && git push origin v1.0.0`
   - The workflow will automatically build and create a release

## Vercel Deployment

### Option 1: Vercel CLI

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy:**
   ```bash
   vercel
   ```

3. **Follow the prompts:**
   - Link to your project
   - Use default settings
   - Deploy!

### Option 2: Vercel Dashboard

1. Go to https://vercel.com
2. Sign in with GitHub
3. Click "New Project"
4. Import `draphael123/Fountain-Spell-Assist`
5. Configure:
   - **Framework Preset:** Other
   - **Build Command:** `npm run build:extension` (or leave empty)
   - **Output Directory:** `public`
   - **Install Command:** `npm install`
6. Click "Deploy"

### Environment Variables

No environment variables needed for this project.

### Custom Domain

After deployment, you can add a custom domain in Vercel settings.

## Download Link

The landing page includes a direct download link that points to:
```
https://github.com/draphael123/Fountain-Spell-Assist/releases/latest/download/fountain-spell-assist.zip
```

This will automatically download the latest release from GitHub.

## Notes

- The landing page is in `public/index.html` and `public/styles.css`
- Vercel will serve the `public` directory as static files
- The download link requires a GitHub release to be created first
- The extension zip file is created by `scripts/create-zip.cjs`

