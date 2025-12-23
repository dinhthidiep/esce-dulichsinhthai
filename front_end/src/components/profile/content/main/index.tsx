import { useState, useEffect } from 'react'
import ViewProfile from './viewProfile'
import EditProfile from './editProfile'

export default function MainProfileContent() {
  const [isEditMode, setIsEditMode] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0) // Key để force reload ViewProfile

  const handleEdit = () => {
    setIsEditMode(true)
  }

  const handleCancel = () => {
    setIsEditMode(false)
  }

  const handleSave = () => {
    setIsEditMode(false)
    // Force reload ViewProfile bằng cách thay đổi key
    setRefreshKey((prev) => prev + 1)
  }

  // Listen for profile update events to refresh view
  useEffect(() => {
    const handleProfileUpdate = () => {
      if (!isEditMode) {
        // Nếu đang ở view mode, reload lại
        setRefreshKey((prev) => prev + 1)
      }
    }
    window.addEventListener('userProfileUpdated', handleProfileUpdate)
    return () => {
      window.removeEventListener('userProfileUpdated', handleProfileUpdate)
    }
  }, [isEditMode])

  if (isEditMode) {
    return <EditProfile onCancel={handleCancel} onSave={handleSave} />
  }

  return <ViewProfile key={refreshKey} onEdit={handleEdit} />
}

