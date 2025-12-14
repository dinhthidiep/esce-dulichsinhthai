import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import Button from './ui/Button'
import { Card, CardContent } from './ui/Card'
import { requestAgencyUpgrade } from '~/api/user/instances/RoleUpgradeApi'
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
    // Tạm thời không bắt buộc upload file
    // if (!form.licenseFile) {
    //   err.licenseFile = 'Vui lòng tải lên giấy phép kinh doanh'
    // }
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
      let fileBase64 = ''
      
      // Chỉ convert file nếu có upload
      if (form.licenseFile) {
        fileBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onloadend = () => {
            const base64String = reader.result as string
            resolve(base64String)
          }
          reader.onerror = reject
          reader.readAsDataURL(form.licenseFile!)
        })
      }

      const response = await requestAgencyUpgrade({
        companyName: form.companyName,
        licenseFile: fileBase64 || 'pending_upload',
        phone: form.phone,
        email: form.email,
        website: form.website || undefined
      }) as any

      // Chuyển tới trang thành công
      // Lưu ý: Agency cần thanh toán 1,000,000 VND - Admin sẽ xác nhận thanh toán
      navigate('/upgrade-payment-success', {
        state: {
          type: 'agency',
          amount: 1000000,
          companyName: form.companyName,
          certificateId: response?.agencyId || response?.id,
          paymentMethod: 'bank_transfer' // Chuyển khoản ngân hàng
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
    <div className="reg-agency-register-agency-page">
      <Header />
      <main className="reg-agency-register-agency-main">
        <div className="reg-agency-register-agency-container">
          {/* Header */}
          <div className="reg-agency-register-agency-header">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/upgrade-account')}
              className="reg-agency-back-button"
            >
              <ArrowLeftIcon className="reg-agency-back-icon" />
              Quay lại
            </Button>
            <div className="reg-agency-register-agency-title-section">
              <h1 className="reg-agency-register-agency-title">Đăng ký trở thành Agency</h1>
              <p className="reg-agency-register-agency-subtitle">
                Điền thông tin để nâng cấp tài khoản của bạn lên Agency
              </p>
            </div>
          </div>

          {/* Form */}
          <Card className="reg-agency-register-agency-form-card">
              <CardContent>
                <form onSubmit={handleSubmit} className="reg-agency-register-agency-form">
                  <div className="reg-agency-form-section">
                    <h2 className="reg-agency-section-title">Thông tin công ty</h2>
                    
                    <div className="reg-agency-form-group">
                      <label htmlFor="companyName" className="reg-agency-form-label">
                        Tên công ty <span className="reg-agency-required">*</span>
                      </label>
                      <input
                        type="text"
                        id="companyName"
                        name="companyName"
                        value={form.companyName}
                        onChange={handleChange}
                        className={`reg-agency-form-input ${errors.companyName ? 'reg-agency-error' : ''}`}
                        placeholder="Nhập tên công ty của bạn"
                        disabled={loading}
                      />
                      {errors.companyName && (
                        <div className="reg-agency-error-message">
                          <AlertCircleIcon className="reg-agency-error-icon" />
                          <span>{errors.companyName}</span>
                        </div>
                      )}
                    </div>

                    <div className="reg-agency-form-group">
                      <label htmlFor="phone" className="reg-agency-form-label">
                        Số điện thoại <span className="reg-agency-required">*</span>
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        className={`reg-agency-form-input ${errors.phone ? 'reg-agency-error' : ''}`}
                        placeholder="Nhập số điện thoại"
                        disabled={loading}
                      />
                      {errors.phone && (
                        <div className="reg-agency-error-message">
                          <AlertCircleIcon className="reg-agency-error-icon" />
                          <span>{errors.phone}</span>
                        </div>
                      )}
                    </div>

                    <div className="reg-agency-form-group">
                      <label htmlFor="email" className="reg-agency-form-label">
                        Email <span className="reg-agency-required">*</span>
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        className={`reg-agency-form-input ${errors.email ? 'reg-agency-error' : ''}`}
                        placeholder="Nhập email liên hệ"
                        disabled={loading}
                      />
                      {errors.email && (
                        <div className="reg-agency-error-message">
                          <AlertCircleIcon className="reg-agency-error-icon" />
                          <span>{errors.email}</span>
                        </div>
                      )}
                    </div>

                    <div className="reg-agency-form-group">
                      <label htmlFor="website" className="reg-agency-form-label">
                        Website (tùy chọn)
                      </label>
                      <input
                        type="url"
                        id="website"
                        name="website"
                        value={form.website}
                        onChange={handleChange}
                        className={`reg-agency-form-input ${errors.website ? 'reg-agency-error' : ''}`}
                        placeholder="https://example.com"
                        disabled={loading}
                      />
                      {errors.website && (
                        <div className="reg-agency-error-message">
                          <AlertCircleIcon className="reg-agency-error-icon" />
                          <span>{errors.website}</span>
                        </div>
                      )}
                    </div>

                    <div className="reg-agency-form-group">
                      <label htmlFor="licenseFile" className="reg-agency-form-label">
                        Giấy phép kinh doanh <span className="reg-agency-required">*</span>
                      </label>
                      <div className="reg-agency-file-upload-area">
                        <input
                          ref={fileInputRef}
                          type="file"
                          id="licenseFile"
                          name="licenseFile"
                          onChange={handleFileChange}
                          accept="image/jpeg,image/png,image/jpg,application/pdf"
                          className="reg-agency-file-input"
                          disabled={loading}
                        />
                        <div 
                          className={`reg-agency-file-upload-box ${errors.licenseFile ? 'reg-agency-error' : ''}`}
                          onClick={() => !loading && fileInputRef.current?.click()}
                        >
                          {licensePreview ? (
                            <div className="reg-agency-file-preview">
                              <img src={licensePreview} alt="Preview" />
                              <button
                                type="button"
                                className="reg-agency-remove-file"
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
                            <div className="reg-agency-file-upload-placeholder">
                              <UploadIcon className="reg-agency-upload-icon" />
                              <p>Tải lên giấy phép kinh doanh</p>
                              <span className="reg-agency-file-hint">JPG, PNG hoặc PDF (tối đa 5MB)</span>
                            </div>
                          )}
                        </div>
                        {errors.licenseFile && (
                          <div className="reg-agency-error-message">
                            <AlertCircleIcon className="reg-agency-error-icon" />
                            <span>{errors.licenseFile}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {errors.submit && (
                    <Card className="reg-agency-error-alert-card">
                      <CardContent>
                        <div className="reg-agency-error-alert">
                          <AlertCircleIcon className="reg-agency-error-alert-icon" />
                          <span>{errors.submit}</span>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <div className="reg-agency-form-actions">
                    <Button
                      type="submit"
                      disabled={loading}
                      variant="default"
                      size="lg"
                      className="reg-agency-submit-button"
                    >
                      {loading ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className="reg-agency-spinner-small"></span>
                          Đang xử lý...
                        </span>
                      ) : (
                        <>
                          Gửi yêu cầu nâng cấp
                          <ArrowRightIcon className="reg-agency-button-icon" />
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="reg-agency-form-note">
                    <FileTextIcon className="reg-agency-note-icon" />
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





