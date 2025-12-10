// firebaseClient.ts
// Cấu hình Firebase phía frontend để upload ảnh (Firebase Storage)
// ❗ Lazy load Firebase để không block initial render

// TODO: Điền config Firebase của bạn tại đây
// Vào Firebase Console -> Project settings -> Your apps (Web) -> Config
const firebaseConfig = {
  apiKey: 'AIzaSyCwqxHIkEvzo7PttHbFCiLrYr9J2FRgQcY',
  authDomain: 'esce-b3ed8.firebaseapp.com',
  projectId: 'esce-b3ed8',
  storageBucket: 'esce-b3ed8.firebasestorage.app',
  messagingSenderId: '420740233560',
  appId: '1:420740233560:web:8aea62627309928b5e8d2d'
}

// Lazy load Firebase - chỉ load khi cần upload ảnh
let storageInstance: any = null
let appInstance: any = null

const getFirebaseStorage = async () => {
  if (storageInstance) {
    return storageInstance
  }

  // Dynamic import Firebase để không load ngay từ đầu
  const { initializeApp, getApps, getApp } = await import('firebase/app')
  const { getStorage } = await import('firebase/storage')

  // Khởi tạo app chỉ một lần
  appInstance = !getApps().length ? initializeApp(firebaseConfig) : getApp()
  storageInstance = getStorage(appInstance)
  
  return storageInstance
}

/**
 * Compress và resize ảnh trước khi upload
 * @param file File ảnh gốc
 * @param maxWidth Chiều rộng tối đa (mặc định 1920px)
 * @param maxHeight Chiều cao tối đa (mặc định 1920px)
 * @param quality Chất lượng nén (0-1, mặc định 0.8)
 * @returns Promise<File> File ảnh đã được compress
 */
const compressImage = async (
  file: File,
  maxWidth: number = 1920,
  maxHeight: number = 1920,
  quality: number = 0.8
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        // Tính toán kích thước mới giữ nguyên tỷ lệ
        let width = img.width
        let height = img.height

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          width = width * ratio
          height = height * ratio
        }

        // Tạo canvas để resize và compress
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Không thể tạo canvas context'))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)

        // Convert sang Blob với quality
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Không thể compress ảnh'))
              return
            }
            // Tạo File mới từ Blob
            const compressedFile = new File([blob], file.name, {
              type: file.type || 'image/jpeg',
              lastModified: Date.now()
            })
            resolve(compressedFile)
          },
          file.type || 'image/jpeg',
          quality
        )
      }
      img.onerror = () => reject(new Error('Không thể load ảnh'))
      img.src = e.target?.result as string
    }
    reader.onerror = () => reject(new Error('Không thể đọc file'))
    reader.readAsDataURL(file)
  })
}

/**
 * Upload 1 file ảnh lên Firebase Storage và trả về downloadURL
 * @param file File ảnh người dùng chọn
 * @param folder thư mục con trong bucket để lưu (ví dụ: 'posts', 'avatars', ...)
 * @param compress Có compress ảnh trước khi upload không (mặc định true)
 */
export const uploadImageToFirebase = async (
  file: File,
  folder: string = 'posts',
  compress: boolean = true
): Promise<string> => {
  let fileToUpload = file

  // Compress ảnh nếu file lớn hơn 500KB và compress = true
  if (compress && file.size > 500 * 1024) {
    try {
      console.log('[Firebase] Compressing image before upload...', {
        originalSize: (file.size / 1024).toFixed(2) + ' KB'
      })
      fileToUpload = await compressImage(file, 1920, 1920, 0.8)
      console.log('[Firebase] Image compressed:', {
        originalSize: (file.size / 1024).toFixed(2) + ' KB',
        compressedSize: (fileToUpload.size / 1024).toFixed(2) + ' KB',
        reduction: ((1 - fileToUpload.size / file.size) * 100).toFixed(1) + '%'
      })
    } catch (error) {
      console.warn('[Firebase] Failed to compress image, uploading original:', error)
      // Nếu compress fail, upload file gốc
      fileToUpload = file
    }
  }

  // Tạo path: posts/{timestamp}-{random}-{originalName}
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 10)
  const safeName = file.name.replace(/[^a-zA-Z0-9.]/g, '_')
  const filePath = `${folder}/${timestamp}-${random}-${safeName}`

  // Lazy load Firebase storage
  const storage = await getFirebaseStorage()
  const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage')
  
  const fileRef = ref(storage, filePath)

  // Upload bytes với timeout
  const uploadPromise = uploadBytes(fileRef, fileToUpload)
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Upload timeout sau 30 giây')), 30000)
  )

  const snapshot = await Promise.race([uploadPromise, timeoutPromise])

  // Lấy URL public để lưu vào DB
  const downloadURL = await getDownloadURL(snapshot.ref)
  return downloadURL
}




