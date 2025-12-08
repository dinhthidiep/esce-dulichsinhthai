import { useState } from 'react'
import ViewProfile from './viewProfile'
import EditProfile from './editProfile'

export default function MainProfileContent() {
  const [isEditMode, setIsEditMode] = useState(false)

  const handleEdit = () => {
    setIsEditMode(true)
  }

  const handleCancel = () => {
    setIsEditMode(false)
  }

  const handleSave = () => {
    setIsEditMode(false)
  }

  if (isEditMode) {
    return <EditProfile onCancel={handleCancel} onSave={handleSave} />
  }

  return <ViewProfile onEdit={handleEdit} />
}

