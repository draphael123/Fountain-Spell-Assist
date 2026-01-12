# Diagnostic Steps for Extension Not Working

## The Problem
You're seeing NO `FSA:` messages in the console, which means the content script isn't running at all.

## Step-by-Step Diagnosis

### 1. Verify Extension is Loaded
1. Go to `chrome://extensions/`
2. Find "Fountain Spell Assist"
3. **Check if it's ENABLED** (toggle should be blue/on)
4. **Look for red error messages** - click "Errors" or "Details" if you see any

### 2. Check Extension Files
In `chrome://extensions/`, click "Details" on the extension and verify:
- ✅ Background service worker is running
- ✅ Content scripts are listed
- ✅ No errors shown

### 3. Reload Extension
1. In `chrome://extensions/`, click the **reload icon** (circular arrow) on the extension
2. **Refresh the page** you're testing on (F5)

### 4. Check Console Again
After reloading, you should IMMEDIATELY see:
```
FSA: Content script file loaded
```

If you DON'T see this message:
- The content script isn't being injected
- Check for errors in `chrome://extensions/`
- The extension might need to be removed and re-added

### 5. Check for JavaScript Errors
In the Console tab:
1. Look for **red error messages**
2. Check if any errors mention `content.js` or `FSA`
3. Share any errors you see

### 6. Test Extension Popup
1. Click the extension icon in your toolbar
2. Does the popup open?
3. If popup doesn't open, the extension has a critical error

### 7. Check Background Service Worker
1. In `chrome://extensions/`, click "Service worker" link (if available)
2. Check for errors in the service worker console

### 8. Reinstall Extension
If nothing works:
1. Remove the extension from `chrome://extensions/`
2. Rebuild: `npm run build:extension`
3. Load unpacked again from the `dist` folder
4. Refresh your test page

## What to Share
1. Screenshot of `chrome://extensions/` showing the extension
2. Any error messages from `chrome://extensions/`
3. Console output (especially any red errors)
4. Whether the popup opens when you click the icon

## Expected Console Output
After reloading, you should see:
```
FSA: Content script file loaded
FSA: DOM already ready, initializing immediately
FSA: Content script initializing on slack.com
FSA: Settings loaded {globalEnabled: true, siteEnabled: true, ...}
FSA: Content script initialized - found X editable field(s)
```

If you see NONE of these, the script isn't loading at all.

