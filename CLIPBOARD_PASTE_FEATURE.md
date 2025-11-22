# Clipboard Paste Feature for Product Images

## Overview
Added clipboard paste functionality (Ctrl+V / Cmd+V) for image uploads in the admin panel. Users can now paste images directly from their clipboard into upload fields instead of only using file picker or drag-and-drop.

## Implementation Details

### Files Modified

1. **Product Manager - Media Tab** (`src/components/admin/products/tabs/MediaTab.tsx`)
   - Added clipboard paste handlers for Main Image and Gallery Images
   - Visual feedback with border highlighting when a paste target is active
   - Auto-detects Mac vs Windows for keyboard hint (Cmd+V vs Ctrl+V)
   - Full file validation (size, type)
   - Uses existing image optimization pipeline (WebP conversion)

2. **Branding Settings** (`src/components/admin/settings/BrandingSettings.tsx`)
   - Added clipboard paste handlers for Logo and Favicon uploads
   - Same visual feedback and validation as product images
   - Platform-aware keyboard hints

3. **Translations**
   - `src/lib/translations/product-manager.ts` - Added paste-related strings (EN/RU)
   - `src/lib/translations/settings-center.ts` - Added paste-related strings (EN/RU)

### New Translation Keys

**Product Manager:**
- `form.messages.pasteHint` - "You can paste images from clipboard (Ctrl+V)"
- `form.messages.pasteHintMac` - "You can paste images from clipboard (Cmd+V)"
- `form.messages.imagePasted` - "Image pasted from clipboard"
- `form.messages.invalidImageType` - "Invalid file type. Only images are supported"
- `form.messages.imageTooLarge` - "Image size must be less than 5MB"

**Settings Center (Branding):**
- Same keys under `branding.*` namespace

### Features

#### User Experience
1. **Visual Feedback**
   - Upload containers highlight with primary color border when active
   - Background tint (primary/5 opacity) shows which field will receive the paste
   - Hover states on all paste-enabled containers
   - Clipboard icon with hint text

2. **Platform Detection**
   - Automatically detects Mac vs Windows/Linux
   - Shows appropriate keyboard shortcut (Cmd+V or Ctrl+V)

3. **File Handling**
   - Validates file type (must be image/*)
   - Validates file size (max 5MB)
   - Auto-generates unique filename: `pasted-{timestamp}-{uuid}.{extension}`
   - Preserves original image format (MIME type)
   - Converts to WebP when possible for optimization

4. **Validation & Error Handling**
   - Shows toast notification on successful paste
   - Shows error toast for invalid file type
   - Shows error toast for oversized files
   - Prevents multiple simultaneous uploads
   - Prevents paste when upload is in progress

#### Technical Implementation

1. **Paste Target Selection**
   - Click on upload container to set it as paste target
   - Focus on container also sets paste target
   - Only one target active at a time
   - Global paste event listener (window level)

2. **Clipboard API Usage**
   ```typescript
   const handlePaste = async (e: ClipboardEvent) => {
     const items = e.clipboardData?.items;
     if (!items || !pasteTarget) return;
     
     for (let i = 0; i < items.length; i++) {
       const item = items[i];
       if (item.kind === 'file' && item.type.startsWith('image/')) {
         const blob = item.getAsFile();
         const file = new File([blob], fileName, { type: blob.type });
         await handleFileUpload(file, pasteTarget);
       }
     }
   }
   ```

3. **Event Cleanup**
   - useEffect properly adds/removes event listeners
   - Cleanup on component unmount
   - Dependencies tracked correctly

## Where It Works

### Product Form Dialog
- **Main Image Upload** - Media tab, main image section
- **Gallery Images Upload** - Media tab, gallery section
- Works for both:
  - Creating new products
  - Editing existing products

### Settings Center
- **Logo Upload** - Branding settings, logo section
- **Favicon Upload** - Branding settings, favicon section
- Only accessible to super admins

## Testing Guide

### Basic Functionality
1. **Copy an image to clipboard**
   - Take a screenshot (Print Screen)
   - Copy from image viewer (Ctrl+C)
   - Copy from browser (right-click → Copy Image)
   - Copy from file explorer

2. **Navigate to product form**
   - Go to Admin → Products
   - Click "Add Product" or edit existing
   - Navigate to "Media" tab

3. **Test Main Image paste**
   - Click on the main image upload container (should highlight)
   - Press Ctrl+V (or Cmd+V on Mac)
   - Image should upload and display in preview
   - Toast notification should appear

4. **Test Gallery Images paste**
   - Click on the gallery upload container (should highlight)
   - Press Ctrl+V (or Cmd+V on Mac)
   - Image should upload and appear in gallery grid
   - Toast notification should appear

5. **Test Branding Settings**
   - Go to Admin → Settings → Branding
   - Click on logo upload area
   - Press Ctrl+V to paste logo
   - Click on favicon upload area
   - Press Ctrl+V to paste favicon

### Error Cases
1. **Invalid file type**
   - Copy a text file or PDF to clipboard
   - Try to paste → Should show error toast

2. **File too large**
   - Copy an image larger than 5MB
   - Try to paste → Should show error toast

3. **No image in clipboard**
   - Clear clipboard (copy some text)
   - Try to paste → Nothing should happen

4. **Upload in progress**
   - Start an upload via file picker
   - Try to paste while uploading → Should be ignored

### Browser Compatibility
Test in:
- ✅ Chrome/Chromium (full support)
- ✅ Firefox (full support)
- ✅ Safari (full support)
- ✅ Edge (full support)

### Platform Compatibility
- ✅ Windows (shows Ctrl+V hint)
- ✅ Mac (shows Cmd+V hint)
- ✅ Linux (shows Ctrl+V hint)

## UI/UX Improvements

1. **Visual Indicators**
   - Dashed border containers
   - Active state highlighting
   - Hover effects
   - Clipboard icon with hint text

2. **Accessibility**
   - Containers are keyboard accessible (tabIndex)
   - Focus handlers for paste target selection
   - Clear visual feedback

3. **Responsive Design**
   - Works on all screen sizes
   - Maintains consistent behavior

## Storage & Optimization

- Images uploaded to `product-images` bucket (products)
- Images uploaded to `branding-assets` bucket (logo/favicon)
- WebP conversion attempted for size optimization
- Falls back to original format if conversion fails
- Same storage policies as regular uploads

## Security

- All validations run client-side first
- Server-side validation through Supabase RLS
- File size limits enforced
- MIME type validation
- Unique filenames prevent collisions
- Same security model as existing uploads

## Performance

- No performance impact when not pasting
- Single global event listener per component
- Efficient cleanup on unmount
- Reuses existing upload infrastructure
- No additional dependencies

## Known Limitations

1. **Single image paste only**
   - Currently supports one image at a time
   - Multiple image paste not implemented (could be future enhancement)

2. **Image formats**
   - Only accepts image/* MIME types
   - Browser clipboard support varies slightly
   - Some exotic formats may not work

3. **Clipboard access**
   - Requires user interaction (can't read clipboard on page load)
   - Browser security restrictions apply
   - User must grant clipboard permission in some browsers

## Future Enhancements

Possible improvements:
- Support pasting multiple images at once (gallery)
- Show paste preview before upload
- Drag-and-drop from clipboard data
- Paste image from URL
- Auto-crop/resize options on paste
- Remember last paste target per session

## Code Maintenance

### Adding paste to new upload fields:
1. Import necessary hooks: `useState`, `useEffect`, `useRef`
2. Add `Clipboard` icon from lucide-react
3. Add paste target state: `const [pasteTarget, setPasteTarget] = useState<'type' | null>(null)`
4. Create `handlePaste` function (see MediaTab.tsx for reference)
5. Add useEffect with global paste listener
6. Wrap upload container with paste handlers
7. Add visual feedback classes
8. Add hint text with Clipboard icon
9. Add translations if needed

### Translation pattern:
```typescript
const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
const pasteHintKey = isMac ? 'path.pasteHintMac' : 'path.pasteHint';
```

## Deployment Notes

- No database migrations required
- No environment variables needed
- Works immediately after deployment
- No breaking changes
- Backward compatible (existing upload methods still work)

## Support

If paste doesn't work:
1. Check browser console for errors
2. Verify clipboard permissions
3. Try different image source (screenshot vs file)
4. Check file size and format
5. Clear browser cache and reload
