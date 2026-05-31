# Quick Fixes - Image Upload & UI

## Changes Made

### 1. ✅ Text "Drag gambar" Hitam (Lebih Keliatan)

**Before:**
```typescript
// Biru - kurang keliatan
<div className="bg-blue-50 border border-blue-200">
  <Move className="text-blue-600" />
  <span className="text-blue-700">Drag gambar...</span>
</div>
```

**After:**
```typescript
// Hitam - jelas keliatan
<div className="bg-gray-100 border border-gray-300">
  <Move className="text-gray-900" />
  <span className="text-gray-900 font-bold">Drag gambar...</span>
</div>
```

**Result:** Text sekarang **HITAM** dan **BOLD** - sangat keliatan!

### 2. ✅ Better Image Upload Debugging

**Added console logging:**
```typescript
// Upload process
console.log('Uploading file:', file.name, file.type, file.size);
console.log('Upload successful! URL:', json.url);
console.log('Full URL:', window.location.origin + json.url);

// Image load error
onError={(e) => {
  console.error('Image failed to load:', image);
  console.error('Current URL:', window.location.origin);
  console.error('Full image URL:', new URL(image, window.location.origin).href);
  setImgError(true);
}}
```

**Benefits:**
- ✅ See exact upload progress in console
- ✅ See full image URL
- ✅ Debug why image fails to load
- ✅ Better error tracking

## How to Debug Image Upload Issues

### Open Browser Console (F12):

**When uploading:**
```
Uploading file: photo.jpg image/jpeg 245678
Sending upload request to /api/upload/image
Upload successful! URL: /images/photo-abc123.jpg
Full URL: http://76.13.17.91/images/photo-abc123.jpg
```

**If image fails to load:**
```
Image failed to load: /images/photo-abc123.jpg
Current URL: http://76.13.17.91
Full image URL: http://76.13.17.91/images/photo-abc123.jpg
```

**Then test manually:**
1. Copy the "Full image URL"
2. Paste in browser address bar
3. If 404 → Backend not serving images
4. If 200 → Frontend issue (CORS, cache, etc)

## Files Modified

1. **`artifacts/andaralab/src/pages/AdminPage.tsx`**
   - Changed drag instruction text: blue → black
   - Made text bold for visibility
   - Added console logging for upload
   - Added console logging for image errors
   - Better debugging info

## Deployment

```cmd
python vps_deploy_fixed.py
```

## Testing

### Test Text Visibility:
1. Add image to blog post
2. Check toolbar
3. Should see **BLACK BOLD** text: "Drag gambar di bawah untuk posisikan freely"
4. Much more visible than before!

### Test Image Upload Debug:
1. Open browser console (F12)
2. Upload an image
3. Watch console logs:
   - Upload progress
   - URL returned
   - Full URL
4. If image fails, check error logs
5. Copy full URL and test in browser

## Summary

**Fixed:**
- ✅ Text "Drag gambar" sekarang **HITAM** dan **BOLD**
- ✅ Added extensive console logging
- ✅ Better debugging for image issues

**Benefits:**
- ✅ UI lebih jelas (text hitam)
- ✅ Easy debugging (console logs)
- ✅ Can identify exact issue (URL, CORS, 404, etc)
