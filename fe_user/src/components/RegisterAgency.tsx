import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import Button from './ui/Button'
import { Card, CardContent } from './ui/Card'
import { requestAgencyUpgrade } from '../API/instances/RoleUpgradeApi'
import { 
  ArrowLeftIcon,
  ArrowRightIcon,
  UploadIcon, 
  FileTextIcon,
  AlertCircleIcon,
  CheckCircleIcon
} from './icons/index'
import './RegisterAgency.css'

interface FormData {
  companyName: string
  phone: string
  email: string
  website: string
  licenseFile: File | null
}

interface Errors {
  companyName?: string
  phone?: string
  email?: string
  website?: string
  licenseFile?: string
  submit?: string
}

const RegisterAgency = () => {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState<FormData>({
    companyName: '',
    phone: '',
    email: '',
    website: '',
    licenseFile: null
  })
  const [errors, setErrors] = useState<Errors>({})
  const [loading, setLoading] = useState(false)
  const [licensePreview, setLicensePreview] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
      if (!validTypes.includes(file.type)) {
        setErrors((prev) => ({
          ...prev,
          licenseFile: 'Chỉ chấp nhận file JPG, PNG hoặc PDF'
        }))
        return
      }

      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          licenseFile: 'File không được vượt quá 5MB'
        }))
        return
      }

      setForm((prev) => ({ ...prev, licenseFile: file }))
      setErrors((prev) => ({ ...prev, licenseFile: '' }))

      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onloadend = () => {
          setLicensePreview(reader.result as string)
        }
        reader.readAsDataURL(file)
      } else {
        setLicensePreview(null)
      }
    }
  }

  const validate = (): Errors => {
    const err: Errors = {}
    if (!form.companyName.trim()) {
      err.companyName = 'Tên công ty là bắt buộc'
    }
    if (!form.phone.trim()) {
      err.phone = 'Số điện thoại là bắt buộc'
    } else if (!/^[0-9]{10,11}$/.test(form.phone.replace(/\s/g, ''))) {
      err.phone = 'Số điện thoại không hợp lệ'
    }
    if (!form.email.trim()) {
      err.email = 'Email là bắt buộc'
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      err.email = 'Email không hợp lệ'
    }
    if (form.website && !/^https?:\/\/.+/.test(form.website)) {
      err.website = 'Website phải bắt đầu bằng http:// hoặc https://'
    }
    if (!form.licenseFile) {
      err.licenseFile = 'Vui lòng tải lên giấy phép kinh doanh'
    }
    return err
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const err = validate()
    if (Object.keys(err).length) {
      setErrors(err)
      return
    }

    setLoading(true)
    setErrors({})

    try {
      const fileBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          const base64String = reader.result as string
          resolve(base64String)
        }
        reader.onerror = reject
        reader.readAsDataURL(form.licenseFile!)
      })

      const response = await requestAgencyUpgrade({
        companyName: form.companyName,
        licenseFile: fileBase64,
        phone: form.phone,
        email: form.email,
        website: form.website || undefined
      })

      // Chuyển tới trang thanh toán
      navigate('/upgrade-payment', {
        state: {
          type: 'agency',
          amount: 1000000,
          companyName: form.companyName,
          certificateId: (response as any)?.agencyId || (response as any)?.id
        }
      })
    } catch (error: any) {
      setErrors({
        submit: error.message || 'Có lỗi xảy ra. Vui lòng thử lại.'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="register-agency-page">
      <Header />
      <main className="register-agency-main">
        <div className="register-agency-container">
          {/* Header */}
          <div className="register-agency-header">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/upgrade-account')}
              className="back-button"
            >
              <ArrowLeftIcon className="back-icon" />
              Quay lại
            </Button>
            <div className="register-agency-title-section">
              <h1 className="register-agency-title">Đăng ký trở thành Agency</h1>
              <p className="register-agency-subtitle">
                Điền thông tin để nâng cấp tài khoản của bạn lên Agency
              </p>
            </div>
          </div>

          {/* Form */}
          <Card className="register-agency-form-card">
              <CardContent>
                <form onSubmit={handleSubmit} className="register-agency-form">
                  <div className="form-section">
                    <h2 className="section-title">Thông tin công ty</h2>
                    
                    <div className="form-group">
                      <label htmlFor="companyName" className="form-label">
                        Tên công ty <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        id="companyName"
                        name="companyName"
                        value={form.companyName}
                        onChange={handleChange}
                        className={`form-input ${errors.companyName ? 'error' : ''}`}
                        placeholder="Nhập tên công ty của bạn"
                        disabled={loading}
                      />
                      {errors.companyName && (
                        <div className="error-message">
                          <AlertCircleIcon className="error-icon" />
                          <span>{errors.companyName}</span>
                        </div>
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor="phone" className="form-label">
                        Số điện thoại <span className="required">*</span>
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        className={`form-input ${errors.phone ? 'error' : ''}`}
                        placeholder="Nhập số điện thoại"
                        disabled={loading}
                      />
                      {errors.phone && (
                        <div className="error-message">
                          <AlertCircleIcon className="error-icon" />
                          <span>{errors.phone}</span>
                        </div>
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor="email" className="form-label">
                        Email <span className="required">*</span>
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        className={`form-input ${errors.email ? 'error' : ''}`}
                        placeholder="Nhập email liên hệ"
                        disabled={loading}
                      />
                      {errors.email && (
                        <div className="error-message">
                          <AlertCircleIcon className="error-icon" />
                          <span>{errors.email}</span>
                        </div>
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor="website" className="form-label">
                        Website (tùy chọn)
                      </label>
                      <input
                        type="url"
                        id="website"
                        name="website"
                        value={form.website}
                        onChange={handleChange}
                        className={`form-input ${errors.website ? 'error' : ''}`}
                        placeholder="https://example.com"
                        disabled={loading}
                      />
                      {errors.website && (
                        <div className="error-message">
                          <AlertCircleIcon className="error-icon" />
                          <span>{errors.website}</span>
                        </div>
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor="licenseFile" className="form-label">
                        Giấy phép kinh doanh <span className="required">*</span>
                      </label>
                      <div className="file-upload-area">
                        <input
                          ref={fileInputRef}
                          type="file"
                          id="licenseFile"
                          name="licenseFile"
                          onChange={handleFileChange}
                          accept="image/jpeg,image/png,image/jpg,application/pdf"
                          className="file-input"
                          disabled={loading}
                        />
                        <div 
                          className={`file-upload-box ${errors.licenseFile ? 'error' : ''}`}
                          onClick={() => !loading && fileInputRef.current?.click()}
                        >
                          {licensePreview ? (
                            <div className="file-preview">
                              <img src={licensePreview} alt="Preview" />
                              <button
                                type="button"
                                className="remove-file"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setForm((prev) => ({ ...prev, licenseFile: null }))
                                  setLicensePreview(null)
                                  if (fileInputRef.current) {
                                    fileInputRef.current.value = ''
                                  }
                                }}
                                disabled={loading}
                              >
                                ×
                              </button>
                            </div>
                          ) : (
                            <div className="file-upload-placeholder">
                              <UploadIcon className="upload-icon" />
                              <p>Tải lên giấy phép kinh doanh</p>
                              <span className="file-hint">JPG, PNG hoặc PDF (tối đa 5MB)</span>
                            </div>
                          )}
                        </div>
                        {errors.licenseFile && (
                          <div className="error-message">
                            <AlertCircleIcon className="error-icon" />
                            <span>{errors.licenseFile}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {errors.submit && (
                    <Card className="error-alert-card">
                      <CardContent>
                        <div className="error-alert">
                          <AlertCircleIcon className="error-alert-icon" />
                          <span>{errors.submit}</span>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <div className="form-actions">
                    <Button
                      type="submit"
                      disabled={loading}
                      variant="default"
                      size="lg"
                      className="submit-button"
                    >
                      {loading ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className="spinner-small"></span>
                          Đang xử lý...
                        </span>
                      ) : (
                        <>
                          Gửi yêu cầu nâng cấp
                          <ArrowRightIcon className="button-icon" />
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="form-note">
                    <FileTextIcon className="note-icon" />
                    <div>
                      <strong>Lưu ý:</strong> Sau khi gửi yêu cầu, bạn sẽ cần thanh toán phí nâng cấp 1,000,000 VNĐ. 
                      Yêu cầu của bạn sẽ được Admin xét duyệt trong vòng 1-3 ngày làm việc.
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default RegisterAgency
