import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import Button from './ui/Button'
import { Card, CardContent } from './ui/Card'
import { requestHostUpgrade } from '~/api/user/instances/RoleUpgradeApi'
import { 
  ArrowLeftIcon,
  ArrowRightIcon,
  UploadIcon, 
  FileTextIcon,
  AlertCircleIcon,
  CheckCircleIcon
} from './icons/index'
import './RegisterHost.css'

interface FormData {
  businessName: string
  phone: string
  email: string
  businessLicenseFile: File | null
}

interface Errors {
  businessName?: string
  phone?: string
  email?: string
  businessLicenseFile?: string
  submit?: string
}

const RegisterHost = () => {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState<FormData>({
    businessName: '',
    phone: '',
    email: '',
    businessLicenseFile: null
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
          businessLicenseFile: 'Chỉ chấp nhận file JPG, PNG hoặc PDF'
        }))
        return
      }

      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          businessLicenseFile: 'File không được vượt quá 5MB'
        }))
        return
      }

      setForm((prev) => ({ ...prev, businessLicenseFile: file }))
      setErrors((prev) => ({ ...prev, businessLicenseFile: '' }))

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
    if (!form.businessName.trim()) {
      err.businessName = 'Tên doanh nghiệp là bắt buộc'
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
    // Tạm thời không bắt buộc upload ảnh
    // if (!form.businessLicenseFile) {
    //   err.businessLicenseFile = 'Vui lòng tải lên giấy phép kinh doanh'
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
      if (form.businessLicenseFile) {
        fileBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onloadend = () => {
            const base64String = reader.result as string
            resolve(base64String)
          }
          reader.onerror = reject
          reader.readAsDataURL(form.businessLicenseFile!)
        })
      }

      const response = await requestHostUpgrade({
        businessName: form.businessName,
        businessLicenseFile: fileBase64 || 'pending_upload', // Placeholder nếu chưa có file
        phone: form.phone,
        email: form.email
      })

      // Host không cần thanh toán trực tiếp - chuyển thẳng tới trang thành công
      navigate('/upgrade-payment-success', {
        state: {
          type: 'host',
          amount: 0,
          businessName: form.businessName,
          certificateId: (response as any)?.certificateId || (response as any)?.id,
          paymentMethod: 'free'
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
    <div className="reg-host-register-host-page">
      <Header />
      <main className="reg-host-register-host-main">
        <div className="reg-host-register-host-container">
          {/* Header */}
          <div className="reg-host-register-host-header">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/upgrade-account')}
              className="reg-host-back-button"
            >
              <ArrowLeftIcon className="reg-host-back-icon" />
              Quay lại
            </Button>
            <div className="reg-host-register-host-title-section">
              <h1 className="reg-host-register-host-title">Đăng ký trở thành Host</h1>
              <p className="reg-host-register-host-subtitle">
                Điền thông tin để nâng cấp tài khoản của bạn lên Host
              </p>
            </div>
          </div>

          {/* Form */}
          <Card className="reg-host-register-host-form-card">
              <CardContent>
                <form onSubmit={handleSubmit} className="reg-host-register-host-form">
                  <div className="reg-host-form-section">
                    <h2 className="reg-host-section-title">Thông tin doanh nghiệp</h2>
                    
                    <div className="reg-host-form-group">
                      <label htmlFor="businessName" className="reg-host-form-label">
                        Tên doanh nghiệp <span className="reg-host-required">*</span>
                      </label>
                      <input
                        type="text"
                        id="businessName"
                        name="businessName"
                        value={form.businessName}
                        onChange={handleChange}
                        className={`reg-host-form-input ${errors.businessName ? 'reg-host-error' : ''}`}
                        placeholder="Nhập tên doanh nghiệp của bạn"
                        disabled={loading}
                      />
                      {errors.businessName && (
                        <div className="reg-host-error-message">
                          <AlertCircleIcon className="reg-host-error-icon" />
                          <span>{errors.businessName}</span>
                        </div>
                      )}
                    </div>

                    <div className="reg-host-form-group">
                      <label htmlFor="phone" className="reg-host-form-label">
                        Số điện thoại <span className="reg-host-required">*</span>
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        className={`reg-host-form-input ${errors.phone ? 'reg-host-error' : ''}`}
                        placeholder="Nhập số điện thoại"
                        disabled={loading}
                      />
                      {errors.phone && (
                        <div className="reg-host-error-message">
                          <AlertCircleIcon className="reg-host-error-icon" />
                          <span>{errors.phone}</span>
                        </div>
                      )}
                    </div>

                    <div className="reg-host-form-group">
                      <label htmlFor="email" className="reg-host-form-label">
                        Email <span className="reg-host-required">*</span>
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        className={`reg-host-form-input ${errors.email ? 'reg-host-error' : ''}`}
                        placeholder="Nhập email liên hệ"
                        disabled={loading}
                      />
                      {errors.email && (
                        <div className="reg-host-error-message">
                          <AlertCircleIcon className="reg-host-error-icon" />
                          <span>{errors.email}</span>
                        </div>
                      )}
                    </div>

                    <div className="reg-host-form-group">
                      <label htmlFor="businessLicenseFile" className="reg-host-form-label">
                        Giấy phép kinh doanh <span className="reg-host-required">*</span>
                      </label>
                      <div className="reg-host-file-upload-area">
                        <input
                          ref={fileInputRef}
                          type="file"
                          id="businessLicenseFile"
                          name="businessLicenseFile"
                          onChange={handleFileChange}
                          accept="image/jpeg,image/png,image/jpg,application/pdf"
                          className="reg-host-file-input"
                          disabled={loading}
                        />
                        <div 
                          className={`reg-host-file-upload-box ${errors.businessLicenseFile ? 'reg-host-error' : ''}`}
                          onClick={() => !loading && fileInputRef.current?.click()}
                        >
                          {licensePreview ? (
                            <div className="reg-host-file-preview">
                              <img src={licensePreview} alt="Preview" />
                              <button
                                type="button"
                                className="reg-host-remove-file"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setForm((prev) => ({ ...prev, businessLicenseFile: null }))
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
                            <div className="reg-host-file-upload-placeholder">
                              <UploadIcon className="reg-host-upload-icon" />
                              <p>Tải lên giấy phép kinh doanh</p>
                              <span className="reg-host-file-hint">JPG, PNG hoặc PDF (tối đa 5MB)</span>
                            </div>
                          )}
                        </div>
                        {errors.businessLicenseFile && (
                          <div className="reg-host-error-message">
                            <AlertCircleIcon className="reg-host-error-icon" />
                            <span>{errors.businessLicenseFile}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {errors.submit && (
                    <Card className="reg-host-error-alert-card">
                      <CardContent>
                        <div className="reg-host-error-alert">
                          <AlertCircleIcon className="reg-host-error-alert-icon" />
                          <span>{errors.submit}</span>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <div className="reg-host-form-actions">
                    <Button
                      type="submit"
                      disabled={loading}
                      variant="default"
                      size="lg"
                      className="reg-host-submit-button"
                    >
                      {loading ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className="reg-host-spinner-small"></span>
                          Đang xử lý...
                        </span>
                      ) : (
                        <>
                          Gửi yêu cầu nâng cấp
                          <ArrowRightIcon className="reg-host-button-icon" />
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="reg-host-form-note">
                    <FileTextIcon className="reg-host-note-icon" />
                    <div>
                      <strong>Lưu ý:</strong> Nâng cấp tài khoản Host là miễn phí. Tuy nhiên, khi bạn bán dịch vụ, sẽ có một khoản phí 10% của giá trị đơn dịch vụ được trả cho admin của hệ thống. 
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

export default RegisterHost



