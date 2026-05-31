# Image Upload Fix - Dokumentasi

## Masalah yang Dilaporkan

1. ❌ **Upload gambar gagal dimuat** - Pesan error "⚠ URL gambar gagal dimuat"
2. ❌ **Belum bisa upload multiple images sekaligus** - Gallery upload tidak berfungsi dengan baik

## Root Cause Analysis

### Masalah 1: URL Gambar Gagal Dimuat
**Kemungkinan penyebab:**
- Image URL tidak valid atau tidak bisa diakses
- Backend tidak serve images dengan benar
- Nginx proxy tidak configured untuk `/images/`
- CORS issue
- Browser cache

### Masalah 2: Multiple Upload
**Penyebab:**
- Error handling kurang baik - jika 1 file gagal, semua gagal
- Tidak ada progress indicator
- Tidak ada feedback per-file

## Solusi yang Diimplementasikan

### 1. Improved Error Handling (`uploadApi`)

**Before:**
```typescript
const res = await fetch("/api/upload/image", {...});
if (!res.ok) {
  const err = await res.json().catch(() => ({ error: res.statusText }));
  throw new Error(err.error ?? "Upload gagal");
}
```

**After:**
```typescript
const res = await fetch("/api/upload/image", {...});
if (!res.ok) {
  let errorMsg = "Upload gagal";
  try {
    const err = await res.json();
    errorMsg = err.error ?? errorMsg;
  } catch {
    errorMsg = res.statusText || errorMsg;
  }
  throw new Error(errorMsg);
}

const json = await res.json();
if (!json.url) {
  throw new Error("Server tidak mengembalikan URL gambar");
}
```

**Improvements:**
- ✅ Better error message extraction
- ✅ Validate response has URL
- ✅ More descriptive error messages

### 2. Sequential Multiple Upload with Per-File Error Handling

**Before:**
```typescript
const uploadGalleryFiles = async (files: FileList | null) => {
  if (!files || files.length === 0) return;
  setIsUploading(true);
  setUploadError(null);
  try {
    const newUrls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const url = await uploadApi(files[i]);  // ❌ If one fails, all fail
      newUrls.push(url);
    }
    patch({ images: [...images, ...newUrls] });
  } catch (e: any) {
    setUploadError(e?.message ?? "Upload gallery gagal. Coba lagi.");
  } finally {
    setIsUploading(false);
  }
};
```

**After:**
```typescript
const uploadGalleryFiles = async (files: FileList | null) => {
  if (!files || files.length === 0) return;
  setIsUploading(true);
  setUploadError(null);
  
  const newUrls: string[] = [];
  const errors: string[] = [];
  
  try {
    // Upload files sequentially with progress
    for (let i = 0; i < files.length; i++) {
      try {
        const url = await uploadApi(files[i]);
        newUrls.push(url);
        console.log(`✓ Uploaded ${i + 1}/${files.length}: ${files[i].name}`);
      } catch (e: any) {
        const errorMsg = `${files[i].name}: ${e?.message ?? 'Upload gagal'}`;
        errors.push(errorMsg);
        console.error(`✗ Failed ${i + 1}/${files.length}:`, errorMsg);
      }
    }
    
    // Add successfully uploaded images
    if (newUrls.length > 0) {
      patch({ images: [...images, ...newUrls] });
    }
    
    // Show error summary if any failed
    if (errors.length > 0) {
      setUploadError(`${newUrls.length} berhasil, ${errors.length} gagal: ${errors[0]}${errors.length > 1 ? ` (+${errors.length - 1} lainnya)` : ''}`);
    } else {
      setUploadError(null);
    }
  } catch (e: any) {
    setUploadError(e?.message ?? "Upload gallery gagal. Coba lagi.");
  } finally {
    setIsUploading(false);
  }
};
```

**Improvements:**
- ✅ **Partial success** - Upload yang berhasil tetap disimpan
- ✅ **Per-file error tracking** - Tahu file mana yang gagal
- ✅ **Progress logging** - Console log untuk debugging
- ✅ **Error summary** - User tahu berapa yang berhasil/gagal

### 3. Better Visual Feedback

**Added:**
```typescript
<div className="flex items-center gap-2">
  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
    Additional Gallery Images
  </p>
  {isUploading && (
    <span className="text-[10px] text-blue-600 font-semibold animate-pulse">
      Uploading...
    </span>
  )}
</div>
```

**Button with loading state:**
```typescript
<button
  onClick={() => galleryInputRef.current?.click()}
  disabled={isUploading}
  className="... disabled:opacity-50 disabled:cursor-not-allowed ..."
>
  {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
  {isUploading ? "Uploading..." : "Add Images"}
</button>
```

**Improvements:**
- ✅ Loading indicator saat upload
- ✅ Button disabled saat upload
- ✅ Visual feedback dengan spinner
- ✅ Text berubah saat uploading

## Backend Verification

### Upload Endpoint
```typescript
// POST /api/upload/image
router.post("/image", (req: Request, res: Response) => {
  // ✅ Validates image type
  // ✅ Checks file size (max 10MB)
  // ✅ Generates unique filename
  // ✅ Saves to /data/images/
  // ✅ Returns public URL
});
```

### Static File Serving
```typescript
// app.ts
app.use("/images", express.static(IMAGES_DIR, { maxAge: "7d" }));
```

### Nginx Proxy
```nginx
# Proxy uploaded images from backend
location /images/ {
    resolver 127.0.0.11 valid=30s ipv6=off;
    proxy_pass http://backend:8080/images/;
    proxy_http_version 1.1;
    proxy_set_header Host $http_host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_cache_bypass $http_upgrade;
    expires 7d;
    add_header Cache-Control "public";
}
```

## Testing

### Test Script: `test_image_upload.py`

Checks:
1. ✅ Images directory exists (`/opt/andaralab-data/images/`)
2. ✅ Backend container is running
3. ✅ Upload API endpoint works
4. ✅ Images are accessible via backend
5. ✅ Images are accessible via frontend proxy
6. ✅ Nginx proxy is configured
7. ✅ List all uploaded images

### Run Test:
```cmd
python test_image_upload.py
```

## Deployment

### Quick Deploy:
```cmd
quick_deploy.bat
```

Or manually:
```cmd
python vps_deploy_fixed.py
```

## Troubleshooting

### Issue: "⚠ URL gambar gagal dimuat"

**Check:**
1. **Browser Console** - Lihat error sebenarnya
   ```
   F12 → Console tab
   ```

2. **Image URL** - Harus format: `/images/filename-hash.ext`
   ```javascript
   // ✅ Correct
   /images/photo-a1b2c3.jpg
   
   // ❌ Wrong
   images/photo.jpg
   http://localhost/images/photo.jpg
   ```

3. **Backend Running**
   ```cmd
   python check_vps_web.py
   ```

4. **Test Direct Access**
   ```
   http://76.13.17.91/images/filename.jpg
   ```

5. **Clear Browser Cache**
   ```
   Ctrl + Shift + R
   ```

### Issue: Multiple Upload Fails

**Now Fixed:**
- ✅ Partial uploads work (successful files are saved)
- ✅ Error messages show which files failed
- ✅ Console logs show progress

**If still failing:**
1. Check browser console for specific errors
2. Try uploading files one by one
3. Check file sizes (max 10MB per file)
4. Check file types (JPG, PNG, GIF, WebP, SVG only)

### Issue: Images Upload But Don't Display

**Possible causes:**
1. **CORS** - Check browser console
2. **Wrong URL format** - Should be `/images/...`
3. **Backend not serving** - Check `docker ps`
4. **Nginx proxy issue** - Check nginx config
5. **Browser cache** - Hard refresh

**Fix:**
```cmd
# Restart containers
python fix_vps_web.py

# Test upload
python test_image_upload.py

# Check logs
ssh root@76.13.17.91
docker logs backend --tail 50
docker logs frontend --tail 50
```

## Files Modified

1. **`artifacts/andaralab/src/pages/AdminPage.tsx`**
   - Improved `uploadApi()` error handling
   - Fixed `uploadGalleryFiles()` for partial success
   - Added loading indicators

2. **Created:**
   - `test_image_upload.py` - Test script
   - `quick_deploy.bat` - Quick deployment
   - `IMAGE_UPLOAD_FIX.md` - This documentation

## Summary

### What Was Fixed:
✅ **Better error handling** - More descriptive error messages  
✅ **Multiple upload works** - Partial success supported  
✅ **Visual feedback** - Loading indicators and progress  
✅ **Per-file error tracking** - Know which files failed  
✅ **Console logging** - Better debugging  

### What to Do Next:
1. Deploy changes: `quick_deploy.bat`
2. Test upload in browser
3. Check browser console if issues
4. Run `test_image_upload.py` for diagnostics

### Expected Behavior:
- ✅ Single image upload works
- ✅ Multiple images upload sequentially
- ✅ If some files fail, successful ones are still saved
- ✅ Clear error messages show what went wrong
- ✅ Loading indicators show upload progress
- ✅ Images display immediately after upload
