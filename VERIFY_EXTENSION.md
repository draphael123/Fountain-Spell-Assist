# Verify Extension is Working

## Step 1: Reload the Extension
**CRITICAL:** After the fix, you MUST reload the extension:

1. Go to `chrome://extensions/`
2. Find "Fountain Spell Assist"
3. Click the **reload icon** (circular arrow) on the extension
4. **Refresh your test page** (F5)

## Step 2: Check Extension Status
In `chrome://extensions/`:
- ✅ Extension should be **ENABLED** (toggle is blue/on)
- ✅ No red error messages
- ✅ Click "Errors" or "Details" - should show no errors

## Step 3: Check Console
1. Open the page where you want spell checking
2. Press `F12` to open DevTools
3. Go to **Console** tab
4. **Filter by "FSA"** (type "FSA" in the filter box)
5. You should see:
   - `FSA: Content script file loaded`
   - `FSA: Content script initializing on [hostname]`
   - `FSA: Settings loaded`
   - `FSA: Content script initialized`

## Step 4: If Still No FSA Messages

### Check if Extension is Actually Loaded
1. In `chrome://extensions/`, click **"Details"** on the extension
2. Scroll down to **"Content scripts"**
3. Verify it shows the content script configuration

### Check for JavaScript Errors
1. In Console, look for **red error messages**
2. Check if any errors mention `content.js`
3. Share any errors you see

### Verify Files Exist
The extension should have these files in the `dist` folder:
- ✅ `content.js` (should exist)
- ✅ `content.css` (should exist)
- ✅ `manifest.json` (should reference content.js)

### Try Removing and Re-adding
1. Remove the extension from `chrome://extensions/`
2. Rebuild: `npm run build:extension`
3. Load unpacked again from the `dist` folder
4. Refresh your test page

## Step 5: Test on Simple Page
1. Open new tab
2. Go to: `data:text/html,<textarea placeholder="Type here"></textarea>`
3. Type: "recieve seperate"
4. Check console for FSA messages
5. You should see red underlines

## What to Report
1. Do you see ANY `FSA:` messages? (even just one)
2. Are there any red errors in the console?
3. Does the extension popup open when you click the icon?
4. What page are you testing on? (Slack, simple page, etc.)

