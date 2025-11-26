# Clipboard Paste Feature for Product Images

## Overview
Added clipboard paste functionality (Ctrl+V / Cmd+V) for all image upload fields in the admin panel.

## Implementation

### Components Updated

#### 1. Product Manager - MediaTab
**File:** `src/components/admin/products/tabs/MediaTab.tsx`

**Features:**
- Paste images from clipboard into Main Image upload area
- Paste images from clipboard into Gallery Images upload area
- Works for both new products and editing existing products
- Automatic file naming: `product-{uuid}-{timestamp}.{ext}`
- Size validation: Max 5MB
- Format validation: Only image/* MIME types
- Automatic WebP conversion (same as file picker)
- Loading states during upload
- Success/error toast notifications

**Usage:**
1. Open product form (add or edit)
2. Navigate to "Media" tab
3. Copy/screenshot an image to clipboard
4. Click in the Main Image or Gallery Images area
5. Press Ctrl+V (or Cmd+V on Mac)
6. Image will be uploaded and displayed immediately

#### 2. Settings - BrandingSettings
**File:** `src/components/admin/settings/BrandingSettings.tsx`

**Features:**
- Paste images from clipboard into Logo upload area
- Paste images from clipboard into Favicon upload area
- Automatic file naming: `branding-{uuid}-{timestamp}.{ext}`
- Size validation: Max 5MB
- Format validation: Only image/* MIME types
- Loading states during upload
- Success/error toast notifications

**Usage:**
1. Navigate to Admin > Settings > Branding tab
2. Copy/screenshot an image to clipboard
3. Click in the Logo or Favicon upload area
4. Press Ctrl+V (or Cmd+V on Mac)
5. Image will be uploaded and displayed immediately

### Technical Details

#### File Conversion
Images from clipboard are converted from Blob to File objects with proper naming:
```typescript
const blobToFile = (blob: Blob, mimeType: string): File => {
  const extension = getFileExtensionFromMimeType(mimeType);
  const fileName = `product-${crypto.randomUUID()}-${Date.now()}.${extension}`;
  return new File([blob], fileName, { type: mimeType });
};
```

#### Supported Formats
- image/jpeg → .jpg
- image/png → .png
- image/webp → .webp
- image/gif → .gif
- image/bmp → .bmp
- image/svg+xml → .svg
- image/x-icon → .ico (for favicons)

#### Event Handling
Paste events are captured on container elements using refs:
```typescript
const handlePasteEvent = async (e: ClipboardEvent, isGallery: boolean = false) => {
  const items = e.clipboardData?.items;
  // Extract image blobs, validate, convert to File, upload
};
```

#### Validation
- File size: Must be < 5MB
- File type: Must start with 'image/'
- Error handling with user-friendly messages

### Translations

#### Product Manager
Added to `src/lib/translations/product-manager.ts`:
- `form.messages.pasteHint`: Hint text shown below upload buttons
- `form.messages.imagePasted`: Success message when image is pasted
- `form.messages.invalidImageFormat`: Error for non-image formats
- `form.messages.pasteImageTooLarge`: Error for files > 5MB

Available in both English and Russian.

#### Settings Center
Added to `src/lib/translations/settings-center.ts`:
- `branding.pasteHint`: Hint text shown below upload buttons
- `branding.imagePasted`: Success message when image is pasted

Available in both English and Russian.

### UI/UX Enhancements

1. **Visual Hints:** Paste hint text displayed below upload buttons
   - English: "You can also paste an image from clipboard (Ctrl+V)"
   - Russian: "Можно вставить изображение из буфера памяти (Ctrl+V)"

2. **Focus Management:** Upload areas have `tabIndex={-1}` to receive focus for paste events

3. **Loading States:** Upload buttons show loading spinner during paste uploads

4. **Toast Notifications:**
   - Success: "Image pasted from clipboard"
   - Error: File size or format validation messages

### Testing

#### Manual Testing Checklist
- [ ] Copy screenshot to clipboard (Print Screen → Ctrl+C)
- [ ] Paste into Main Image field (Product form)
- [ ] Verify image uploads and displays correctly
- [ ] Paste into Gallery Images field
- [ ] Verify multiple images can be pasted to gallery
- [ ] Test with editing existing product
- [ ] Test with creating new product
- [ ] Test in Branding Settings (Logo)
- [ ] Test in Branding Settings (Favicon)
- [ ] Verify 5MB size limit works
- [ ] Verify non-image paste is rejected
- [ ] Test in Chrome, Firefox, Safari

#### Common Test Scenarios

**1. Screenshot Paste:**
```
1. Press Print Screen (or Cmd+Shift+4 on Mac)
2. Open product form → Media tab
3. Click in Main Image area
4. Press Ctrl+V (Cmd+V on Mac)
5. Should upload and display screenshot
```

**2. Copy Image from Browser:**
```
1. Right-click image on webpage
2. Select "Copy Image"
3. Open product form → Media tab
4. Click in Gallery Images area
5. Press Ctrl+V
6. Should upload copied image
```

**3. Gallery Batch Paste:**
```
1. Copy image to clipboard
2. Paste into Gallery (Ctrl+V)
3. Copy another image
4. Paste into Gallery again
5. Both images should appear in gallery
```

### Browser Compatibility

| Browser | Windows | macOS | Linux |
|---------|---------|-------|-------|
| Chrome  | ✅ | ✅ | ✅ |
| Firefox | ✅ | ✅ | ✅ |
| Safari  | N/A | ✅ | N/A |
| Edge    | ✅ | ✅ | N/A |

### Future Enhancements

Possible improvements for future versions:
- Drag & drop from clipboard
- Paste multiple images at once to gallery
- Preview before upload
- Crop/resize before upload
- Support for other admin areas (user avatars, etc.)

### Troubleshooting

**Issue:** Paste doesn't work
- **Solution:** Click in the upload area first to ensure it has focus

**Issue:** "Invalid image format" error
- **Solution:** Ensure you're pasting an actual image, not text or other content

**Issue:** "File too large" error
- **Solution:** Image must be < 5MB. Try resizing or using a different image

**Issue:** Nothing happens when pasting
- **Solution:** Check browser console for errors. Ensure clipboard permissions are granted.

## Deployment Notes

- No database migrations required
- No environment variables added
- No breaking changes to existing functionality
- Fully backward compatible with existing upload methods
- Works alongside file picker and drag-drop (when implemented)

## Related Files

- `src/components/admin/products/tabs/MediaTab.tsx`
- `src/components/admin/settings/BrandingSettings.tsx`
- `src/lib/translations/product-manager.ts`
- `src/lib/translations/settings-center.ts`
