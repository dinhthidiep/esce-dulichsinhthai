# Hướng dẫn restart dev server

## Nếu gặp lỗi import react-chartjs-2:

1. **Dừng dev server**: Nhấn `Ctrl+C` trong terminal đang chạy `npm run dev`

2. **Xóa cache và restart**:
   ```bash
   # Xóa cache Vite
   Remove-Item -Recurse -Force node_modules/.vite -ErrorAction SilentlyContinue
   
   # Hoặc xóa toàn bộ node_modules và cài lại (nếu cần)
   # Remove-Item -Recurse -Force node_modules
   # npm install
   
   # Restart dev server
   npm run dev
   ```

3. **Nếu vẫn lỗi**, thử:
   - Hard refresh browser: `Ctrl+Shift+R`
   - Clear browser cache
   - Kiểm tra console để xem lỗi cụ thể

