# Troubleshooting Guide

## Extension Not Working - No Misspellings Detected

If the extension isn't detecting misspellings, follow these steps:

### 1. Check Extension is Loaded
- Open Chrome and go to `chrome://extensions/`
- Make sure "Developer mode" is enabled (top-right toggle)
- Verify "Fountain Spell Assist" is listed and **enabled** (toggle should be ON)
- Check for any error messages (red text)

### 2. Check Console for Errors
- Open the page where you want spell checking
- Press `F12` to open Developer Tools
- Go to the **Console** tab
- Look for messages starting with `FSA:`
- You should see:
  - `FSA: Content script initializing`
  - `FSA: Settings loaded`
  - `FSA: Content script initialized - found X editable field(s)`

### 3. Check Extension is Enabled
- Click the extension icon in your toolbar
- Make sure the toggle is **ON** (green)
- If it's off, click it to enable
- Check "Show Underlines" is also enabled

### 4. Verify Settings
- Click the extension icon → **Options**
- Check:
  - ✅ "Enable Spell Checking" is ON
  - ✅ "Show Underlines" is ON
  - The current site is not in "Disabled Sites" list

### 5. Test on a Simple Page
Try typing in a basic textarea on a simple page:
- Go to `data:text/html,<textarea></textarea>`
- Type some misspelled words like "recieve" or "seperate"
- You should see red underlines

### 6. Reload the Extension
- Go to `chrome://extensions/`
- Find "Fountain Spell Assist"
- Click the **reload** icon (circular arrow)
- Refresh the page you're testing on

### 7. Check Field Detection
- Open Console (F12)
- Type: `document.querySelectorAll('textarea, input[type="text"], [contenteditable]')`
- This shows editable fields on the page
- The extension should detect these automatically

### 8. Common Issues

**Issue: Extension shows as disabled**
- Solution: Enable it in `chrome://extensions/`

**Issue: "FSA: Disabled for this site" in console**
- Solution: Open popup and enable for current site

**Issue: No fields detected**
- Solution: Some sites use complex editors. Try clicking in the text field first, or refresh the page

**Issue: Underlines not showing**
- Solution: Check "Show Underlines" is enabled in Options

**Issue: Extension icon not visible**
- Solution: Click the puzzle piece icon in toolbar, pin the extension

### 9. Debug Mode
To see detailed logging:
1. Open Console (F12)
2. Look for `FSA:` messages
3. Check what fields are being detected
4. Verify settings are loaded correctly

### 10. Reinstall Extension
If nothing works:
1. Go to `chrome://extensions/`
2. Remove the extension
3. Reload the unpacked extension from the `dist` folder
4. Refresh your test page

## Still Not Working?

Check the browser console for specific error messages and share them for further troubleshooting.

