import React, { useState, useEffect, type ChangeEvent, type FormEvent } from 'react'
import Header from '~/components/user/Header'
import Button from '~/components/user/ui/Button'
import { Card, CardContent } from '~/components/user/ui/Card'
import './create-tour.css'

interface FormErrors {
  name?: string
  address?: string
  description?: string
  price?: string
  START_DATE?: string
  END_DATE?: string
  capacity?: string
  'available-slot'?: string
  IMAGE?: string
}

const CreateTour = () => {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    description: '',
    price: '',
    capacity: '',
    'available-slot': '',
    START_DATE: '',
    END_DATE: '',
    IMAGE: null as File | null,
  })
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitting, setSubmitting] = useState(false)

  // Set min date to today
  useEffect(() => {
    const today = new Date()
    const y = today.getFullYear()
    const m = String(today.getMonth() + 1).padStart(2, '0')
    const d = String(today.getDate()).padStart(2, '0')
    const todayStr = `${y}-${m}-${d}`

    // Set min date for date inputs
    const startInput = document.getElementById('START_DATE') as HTMLInputElement
    const endInput = document.getElementById('END_DATE') as HTMLInputElement
    if (startInput) startInput.min = todayStr
    if (endInput) endInput.min = todayStr
  }, [])

  const setError = (id: keyof FormErrors, message: string) => {
    setErrors((prev) => ({
      ...prev,
      [id]: message || undefined,
    }))
  }

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setError(name as keyof FormErrors, '')
    }
  }

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {
      setImagePreview(null)
      setFormData((prev) => ({ ...prev, IMAGE: null }))
      return
    }

    if (!file.type.startsWith('image/')) {
      setImagePreview(null)
      setFormData((prev) => ({ ...prev, IMAGE: null }))
      setError('IMAGE', 'File phải là ảnh')
      return
    }

    const reader = new FileReader()
    reader.onload = (ev) => {
      if (ev.target?.result) {
        setImagePreview(ev.target.result as string)
      }
    }
    reader.readAsDataURL(file)
    setFormData((prev) => ({ ...prev, IMAGE: file }))
    setError('IMAGE', '')
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Clear all errors first
    ;['name', 'address', 'description', 'price', 'START_DATE', 'END_DATE', 'capacity', 'available-slot', 'IMAGE'].forEach(
      (id) => setError(id as keyof FormErrors, '')
    )

    let ok = true

    // Validate name
    if (!formData.name.trim()) {
      setError('name', 'Tên tour không được để trống')
      ok = false
    }

    // Validate address
    if (!formData.address.trim()) {
      setError('address', 'Địa chỉ không được để trống')
      ok = false
    }

    // Validate price
    const price = parseFloat(formData.price)
    if (isNaN(price) || price < 0) {
      setError('price', 'Giá phải là số >= 0')
      ok = false
    }

    // Validate capacity
    const capacity = parseInt(formData.capacity, 10)
    if (isNaN(capacity) || capacity < 1) {
      setError('capacity', 'Sức chứa phải là số nguyên >= 1')
      ok = false
    }

    // Validate available slots
    const available = parseInt(formData['available-slot'], 10)
    if (isNaN(available) || available < 0) {
      setError('available-slot', 'Số chỗ còn phải là số nguyên lớn hơn 0')
      ok = false
    }

    // Validate dates
    if (!formData.START_DATE) {
      setError('START_DATE', 'Chọn ngày bắt đầu')
      ok = false
    }

    if (!formData.END_DATE) {
      setError('END_DATE', 'Chọn ngày kết thúc')
      ok = false
    }

    // Validate capacity vs available slots
    if (!isNaN(capacity) && !isNaN(available) && available > capacity) {
      setError('available-slot', 'Số chỗ còn không thể lớn hơn sức chứa')
      ok = false
    }

    // Validate date range
    if (formData.START_DATE && formData.END_DATE) {
      const start = new Date(formData.START_DATE)
      const end = new Date(formData.END_DATE)
      if (start > end) {
        setError('END_DATE', 'Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.')
        ok = false
      }
    }

    return ok
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    setSubmitting(true)

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('name', formData.name)
      formDataToSend.append('address', formData.address)
      formDataToSend.append('description', formData.description)
      formDataToSend.append('price', formData.price)
      formDataToSend.append('capacity', formData.capacity)
      formDataToSend.append('available-slot', formData['available-slot'])
      formDataToSend.append('START_DATE', formData.START_DATE)
      formDataToSend.append('END_DATE', formData.END_DATE)
      if (formData.IMAGE) {
        formDataToSend.append('IMAGE', formData.IMAGE)
      }

      const response = await fetch('/create-tour', {
        method: 'POST',
        body: formDataToSend,
      })

      if (response.ok) {
        // Success - redirect or show success message
        alert('Tạo tour thành công!')
        handleReset()
      } else {
        const errorData = await response.json().catch(() => ({}))
        alert(errorData.message || 'Có lỗi xảy ra khi tạo tour')
      }
    } catch (error) {
      console.error('Error creating tour:', error)
      alert('Có lỗi xảy ra khi tạo tour. Vui lòng thử lại.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReset = () => {
    setFormData({
      name: '',
      address: '',
      description: '',
      price: '',
      capacity: '',
      'available-slot': '',
      START_DATE: '',
      END_DATE: '',
      IMAGE: null,
    })
    setImagePreview(null)
    setErrors({})
    ;['name', 'address', 'description', 'price', 'START_DATE', 'END_DATE', 'capacity', 'available-slot', 'IMAGE'].forEach(
      (id) => setError(id as keyof FormErrors, '')
    )
  }

  return (
    <div className="create-tour-page">
      <Header />

      <div className="content-title-display-box">
        <div className="content-title-display-name">
          <p>Tạo tour mới</p>
        </div>
      </div>

      <div className="content">
        <div className="form-content">
          <div className="disclaimer-text" style={{ marginLeft: 'auto', fontSize: '13px', color: '#666' }}>
            (<span style={{ color: '#b00020' }}>*</span>) bắt buộc
          </div>
          <br />

          <form id="createTourForm" onSubmit={handleSubmit} encType="multipart/form-data" noValidate>
            <div className="field">
              <label htmlFor="name">
                Nhập tên tour (Tour Name)&nbsp;&nbsp;<span style={{ color: '#b00020' }}>*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                maxLength={255}
                required
                placeholder="Tên tour..."
                style={{ width: '50%' }}
                value={formData.name}
                onChange={handleInputChange}
              />
              {errors.name && <div id="err-name" className="error" aria-live="polite">{errors.name}</div>}
            </div>

            <div className="field">
              <label htmlFor="address">
                Nhập địa chỉ (Address)&nbsp;&nbsp;<span style={{ color: '#b00020' }}>*</span>
              </label>
              <input
                id="address"
                name="address"
                type="text"
                maxLength={255}
                required
                placeholder="Ví dụ: Hà Nội, Việt Nam"
                style={{ width: '50%' }}
                value={formData.address}
                onChange={handleInputChange}
              />
              {errors.address && <div id="err-address" className="error">{errors.address}</div>}
            </div>

            <div className="field">
              <label htmlFor="description">Mô tả về tour (Tour Description)</label>
              <textarea
                id="description"
                name="description"
                maxLength={5000}
                placeholder="Mô tả ngắn về tour (tối đa 5000 ký tự)"
                value={formData.description}
                onChange={handleInputChange}
              />
              {errors.description && <div id="err-description" className="error">{errors.description}</div>}
            </div>

            <div className="field">
              <label htmlFor="price">
                Giá (Price) <span style={{ color: '#b00020' }}>*</span>
              </label>
              <input
                id="price"
                name="price"
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="0.00"
                style={{ width: '17.5%' }}
                value={formData.price}
                onChange={handleInputChange}
              />
              {errors.price && <div id="err-price" className="error">{errors.price}</div>}
            </div>

            <div className="small-field">
              <div>
                <label htmlFor="capacity">
                  Sức chứa (Capacity)&nbsp;&nbsp;<span style={{ color: '#b00020' }}>*</span>
                </label>
                <input
                  id="capacity"
                  name="capacity"
                  type="number"
                  min="1"
                  step="1"
                  required
                  placeholder="Ví dụ: 20"
                  style={{ width: '35%' }}
                  value={formData.capacity}
                  onChange={handleInputChange}
                />
                {errors.capacity && <div id="err-capacity" className="error">{errors.capacity}</div>}
              </div>

              <div>
                <label htmlFor="available-slot">
                  Số chỗ còn (Available slots)&nbsp;&nbsp;<span style={{ color: '#b00020' }}>*</span>
                </label>
                <input
                  id="available-slot"
                  name="available-slot"
                  type="number"
                  min="0"
                  step="1"
                  required
                  placeholder="Ví dụ: 15"
                  style={{ width: '35%' }}
                  value={formData['available-slot']}
                  onChange={handleInputChange}
                />
                {errors['available-slot'] && (
                  <div id="err-available-slot" className="error">{errors['available-slot']}</div>
                )}
              </div>

              <div>
                <label htmlFor="START_DATE">
                  Ngày bắt đầu (Start date)&nbsp;&nbsp;<span style={{ color: '#b00020' }}>*</span>
                </label>
                <input
                  id="START_DATE"
                  name="START_DATE"
                  type="date"
                  required
                  style={{ width: '35%' }}
                  value={formData.START_DATE}
                  onChange={handleInputChange}
                />
                {errors.START_DATE && <div id="err-START_DATE" className="error">{errors.START_DATE}</div>}
              </div>

              <div>
                <label htmlFor="END_DATE">
                  Ngày kết thúc (End date)&nbsp;&nbsp;<span style={{ color: '#b00020' }}>*</span>
                </label>
                <input
                  id="END_DATE"
                  name="END_DATE"
                  type="date"
                  required
                  style={{ width: '35%' }}
                  value={formData.END_DATE}
                  onChange={handleInputChange}
                />
                {errors.END_DATE && <div id="err-END_DATE" className="error">{errors.END_DATE}</div>}
              </div>

              <div className="field">
                <label htmlFor="IMAGE">Ảnh đại diện (IMAGE)</label>
                <input
                  id="IMAGE"
                  name="IMAGE"
                  type="file"
                  accept="image/*"
                  style={{ width: '50%' }}
                  onChange={handleImageChange}
                />
                {imagePreview && (
                  <img
                    id="imgPreview"
                    className="img-preview"
                    src={imagePreview}
                    alt="Xem trước ảnh"
                    style={{ display: 'block' }}
                  />
                )}
                {errors.IMAGE && <div id="err-IMAGE" className="error">{errors.IMAGE}</div>}
              </div>
            </div>

            <div className="form-action">
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Đang tạo...' : 'Tạo tour'}
              </Button>
              <Button type="button" variant="outline" onClick={handleReset}>
                Đặt lại
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default CreateTour



























