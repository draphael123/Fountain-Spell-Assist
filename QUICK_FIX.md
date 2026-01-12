# Quick Fix: Extension Not Working

## Immediate Steps

### 1. Verify Extension is Loaded
1. Go to `chrome://extensions/`
2. Find "Fountain Spell Assist"
3. Make sure it's **ENABLED** (toggle is blue/on)
4. Check for any red error messages

### 2. Reload the Extension
1. In `chrome://extensions/`, click the **reload icon** (circular arrow) on the extension
2. Refresh the Slack page (F5)

### 3. Check Console for FSA Messages
1. Open Slack in Chrome
2. Press `F12` to open DevTools
3. Go to **Console** tab
4. Look for messages starting with `FSA:`
5. You should see: `FSA: Content script initializing on slack.com`

**If you see NO FSA messages:**
- The content script isn't loading
- Check `chrome://extensions/` for errors
- Try reloading the extension

**If you see `FSA: Disabled for this site`:**
- Click the extension icon in toolbar
- Toggle it ON
- Make sure "Show Underlines" is enabled

### 4. Test on Simple Page First
Before testing on Slack, verify it works on a simple page:

1. Open new tab
2. Go to: `data:text/html,<textarea placeholder="Type misspelled words here"></textarea>`
3. Type: "recieve seperate"
4. You should see red underlines

### 5. For Slack Specifically
Slack uses complex React/Shadow DOM. After reloading:

1. **Click in the message input box** (this helps trigger detection)
2. Type a misspelled word
3. Wait 1-2 seconds for detection
4. Check console for `FSA: Attaching to field` messages

### 6. Check Extension Popup
1. Click the extension icon
2. Verify:
   - Main toggle is **ON** (green)
   - "Show Underlines" is **ON**
   - Site is not disabled

### 7. Common Issues

**Extension shows errors in chrome://extensions/**
- Rebuild: `npm run build:extension`
- Remove and re-add the extension

**No FSA messages in console**
- Extension might not be enabled
- Content script might have errors
- Check the "Errors" button in chrome://extensions/

**"FSA: Disabled for this site"**
- Enable it in the popup

**Fields detected but no underlines**
- Check "Show Underlines" is enabled
- Check console for errors during spell check

## Still Not Working?

Share:
1. What you see in `chrome://extensions/` (any errors?)
2. What appears in the Console (any FSA messages?)
3. What the extension popup shows (is toggle ON?)

