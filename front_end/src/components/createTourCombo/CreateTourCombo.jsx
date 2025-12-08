import React, { useState, useCallback, useRef } from 'react'
import './CreateTourCombo.css'

const CreateTourCombo = () => {
  // State management
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    description: '',
    price: '',
    availableSlots: '',
    image: null,
    status: 'open',
    cancellationPolicy: ''
  })

  const [tourComboEntries, setTourComboEntries] = useState([])

  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [sidebarActive, setSidebarActive] = useState(false)
  const [selectedTours, setSelectedTours] = useState(new Set())
  const [filteredTours, setFilteredTours] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const [priceFilter, setPriceFilter] = useState('')

  // Sample tour data (in real app, this would come from API)
  const availableTours = [
    {
      id: 1,
      name: 'Ha Long Bay Cruise',
      location: 'Ha Long',
      duration: '2 days',
      price: 120,
      category: 'nature'
    },
    {
      id: 2,
      name: 'Hanoi City Tour',
      location: 'Hanoi',
      duration: '1 day',
      price: 45,
      category: 'cultural'
    },
    {
      id: 3,
      name: 'Sapa Trekking',
      location: 'Sapa',
      duration: '3 days',
      price: 180,
      category: 'adventure'
    },
    {
      id: 4,
      name: 'Hue Imperial City',
      location: 'Hue',
      duration: '1 day',
      price: 35,
      category: 'cultural'
    },
    {
      id: 5,
      name: 'Ho Chi Minh City',
      location: 'Ho Chi Minh',
      duration: '2 days',
      price: 80,
      category: 'city'
    },
    {
      id: 6,
      name: 'Mekong Delta',
      location: 'Mekong',
      duration: '1 day',
      price: 55,
      category: 'nature'
    },
    {
      id: 7,
      name: 'Da Nang Beach',
      location: 'Da Nang',
      duration: '2 days',
      price: 90,
      category: 'relax'
    },
    {
      id: 8,
      name: 'Nha Trang Diving',
      location: 'Nha Trang',
      duration: '3 days',
      price: 150,
      category: 'adventure'
    },
    {
      id: 9,
      name: 'Da Lat Flower Garden',
      location: 'Da Lat',
      duration: '1 day',
      price: 40,
      category: 'family'
    },
    {
      id: 10,
      name: 'Phong Nha Cave',
      location: 'Phong Nha',
      duration: '2 days',
      price: 110,
      category: 'nature'
    }
  ]

  const fileInputRef = useRef(null)

  // Initialize filtered tours
  React.useEffect(() => {
    setFilteredTours(availableTours)
  }, [])

  // Filter tours based on search and filters
  const filterTours = useCallback(() => {
    const filtered = availableTours.filter((tour) => {
      const matchesSearch =
        tour.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tour.location.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesLocation =
        !locationFilter || tour.location.toLowerCase().includes(locationFilter.toLowerCase())
      const matchesPrice = !priceFilter || checkPriceRange(tour.price, priceFilter)

      return matchesSearch && matchesLocation && matchesPrice
    })
    setFilteredTours(filtered)
  }, [searchTerm, locationFilter, priceFilter])

  React.useEffect(() => {
    filterTours()
  }, [filterTours])

  // Check if tour price is in selected range
  const checkPriceRange = (price, range) => {
    switch (range) {
      case '0-50':
        return price >= 0 && price <= 50
      case '50-100':
        return price > 50 && price <= 100
      case '100-200':
        return price > 100 && price <= 200
      case '200+':
        return price > 200
      default:
        return true
    }
  }

  // Validation function
  const validateField = useCallback((name, value) => {
    switch (name) {
      case 'comboName':
        if (!value || value.trim() === '') {
          return 'Tên dịch vụ không được để trống'
        }
        if (value.trim().length < 3) {
          return 'Tên dịch vụ phải có ít nhất 3 ký tự'
        }
        return ''

      default:
        return ''
    }
  }, [])

  // Event handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  // Add dịch vụ entry
  const addTourComboEntry = () => {
    const newEntry = {
      id: Date.now(),
      name: '',
      image: null,
      imagePreview: null
    }
    setTourComboEntries((prev) => [...prev, newEntry])
  }

  // Remove dịch vụ entry
  const removeTourComboEntry = (id) => {
    setTourComboEntries((prev) => prev.filter((entry) => entry.id !== id))
  }

  // Update dịch vụ entry
  const updateTourComboEntry = (id, field, value) => {
    setTourComboEntries((prev) =>
      prev.map((entry) => (entry.id === id ? { ...entry, [field]: value } : entry))
    )
  }

  // Handle dịch vụ image upload
  const handleTourComboImageUpload = (id, file) => {
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        alert('Kích thước file phải nhỏ hơn 5MB')
        return
      }

      const reader = new FileReader()
      reader.onload = (event) => {
        updateTourComboEntry(id, 'image', file)
        updateTourComboEntry(id, 'imagePreview', event.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  // Image upload handling
  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        alert('File size must be less than 5MB')
        return
      }

      setFormData((prev) => ({
        ...prev,
        coverImage: file
      }))

      const reader = new FileReader()
      reader.onload = (event) => {
        setImagePreview(event.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  // Drag and drop for image upload
  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const files = e.dataTransfer.files
    if (files.length > 0) {
      fileInputRef.current.files = files
      handleImageUpload({ target: { files: files } })
    }
  }

  // Tour selection handlers
  const toggleTourSelection = (tourId) => {
    setSelectedTours((prev) => {
      const newSelected = new Set(prev)
      if (newSelected.has(tourId)) {
        newSelected.delete(tourId)
      } else {
        newSelected.add(tourId)
      }
      return newSelected
    })
  }

  const addTour = (tourId) => {
    setSelectedTours((prev) => new Set([...prev, tourId]))
  }

  const removeTour = (tourId) => {
    setSelectedTours((prev) => {
      const newSelected = new Set(prev)
      newSelected.delete(tourId)
      return newSelected
    })
  }

  const handleSelectAll = () => {
    const allVisibleTourIds = filteredTours.map((tour) => tour.id)
    const allSelected = allVisibleTourIds.every((id) => selectedTours.has(id))

    if (allSelected) {
      // Deselect all visible tours
      setSelectedTours((prev) => {
        const newSelected = new Set(prev)
        allVisibleTourIds.forEach((id) => newSelected.delete(id))
        return newSelected
      })
    } else {
      // Select all visible tours
      setSelectedTours((prev) => new Set([...prev, ...allVisibleTourIds]))
    }
  }

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate form
    const newErrors = {}
    const requiredFields = ['name', 'address', 'price', 'availableSlots']

    requiredFields.forEach((field) => {
      const error = validateField(field, formData[field])
      if (error) {
        newErrors[field] = error
      }
    })

    // Check if at least one tour is selected
    if (selectedTours.size === 0) {
      newErrors.tours = 'Phải chọn ít nhất một tour'
    }

    setErrors(newErrors)

    // If there are errors, don't submit
    if (Object.keys(newErrors).length > 0) {
      // Focus first error field
      const firstErrorField = document.querySelector('.error:not(:empty)')?.previousElementSibling
      if (firstErrorField) {
        firstErrorField.focus()
      }
      return
    }

    // Show loading state
    setIsLoading(true)

    try {
      // Prepare the combo data for API
      const comboData = {
        name: formData.name,
        address: formData.address,
        description: formData.description,
        price: parseFloat(formData.price),
        availableSlots: parseInt(formData.availableSlots),
        image: formData.image ? formData.image.name : null,
        status: formData.status,
        cancellationPolicy: formData.cancellationPolicy,
        tourDetails: Array.from(selectedTours).map((tourId) => ({
          serviceId: tourId,
          quantity: 1
        }))
      }

      console.log('Creating tour combo:', comboData)

      // Make API call to create tour combo
      const response = await fetch('http://localhost:7267/api/tour/create-tour-combo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
          // Add authorization header if needed
          // 'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(comboData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to create tour combo')
      }

      const result = await response.json()

      // Show success message
      alert(`Combo "${formData.name}" đã được tạo thành công!`)

      // Reset form
      setFormData({
        name: '',
        address: '',
        description: '',
        price: '',
        availableSlots: '',
        image: null,
        status: 'open',
        cancellationPolicy: ''
      })
      setTourComboEntries([])
      setSelectedTours(new Set())
      setErrors({})
    } catch (error) {
      console.error('Error creating tour combo:', error)
      alert(`Có lỗi xảy ra khi tạo combo: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    if (confirm('Bạn có chắc chắn muốn đặt lại form? Tất cả dữ liệu sẽ bị xóa.')) {
      setFormData({
        name: '',
        address: '',
        description: '',
        price: '',
        availableSlots: '',
        image: null,
        status: 'open',
        cancellationPolicy: ''
      })
      setTourComboEntries([])
      setSelectedTours(new Set())
      setErrors({})
      setSearchTerm('')
      setLocationFilter('')
      setPriceFilter('')
    }
  }

  const toggleSidebar = () => {
    setSidebarActive(!sidebarActive)
  }

  // Check if select all should be checked
  const isSelectAllChecked = () => {
    if (filteredTours.length === 0) return false
    return filteredTours.every((tour) => selectedTours.has(tour.id))
  }

  const isSelectAllIndeterminate = () => {
    const selectedVisibleTours = filteredTours.filter((tour) => selectedTours.has(tour.id))
    return selectedVisibleTours.length > 0 && selectedVisibleTours.length < filteredTours.length
  }

  return (
    <div className="create-tour-container">
      {/* Sidebar Navigation */}
      <aside
        className={`sidebar ${sidebarActive ? 'active' : ''}`}
        role="navigation"
        aria-label="Menu chính"
      >
        <nav>
          <ul>
            <li>
              <a href="#" className="sidebar-select" aria-label="Thông tin cá nhân">
                Thông tin cá nhân
              </a>
            </li>
            <li>
              <a href="#" className="sidebar-select" aria-label="Cài đặt">
                Cài đặt
              </a>
            </li>
            <li>
              <a href="#" className="sidebar-select" aria-label="Trợ lý ảo">
                Trợ lý ảo
              </a>
            </li>
            <li>
              <a href="#" className="sidebar-select" aria-label="Chatbot">
                Chatbot
              </a>
            </li>
            <li>
              <a href="#" className="sidebar-select" aria-label="Đăng xuất">
                Đăng xuất
              </a>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Header */}
      <header className="header" role="banner">
        <button
          className="menu-button"
          onClick={toggleSidebar}
          aria-label="Mở/đóng menu"
          aria-expanded={sidebarActive}
        >
          <span aria-hidden="true">☰</span>
        </button>
        <div className="header-logo">
          <img src="../img/logo.png" alt="Logo ESMS" width="100" height="auto" loading="lazy" />
          <h1>ESMS</h1>
        </div>
        <nav className="header-menu" role="navigation" aria-label="Menu điều hướng chính">
          <a href="#" className="header-menu-select">
            Trang chủ
          </a>
          <a href="#" className="header-menu-select">
            Giới thiệu
          </a>
          <a href="#" className="header-menu-select">
            Tour phổ biến
          </a>
          <a href="#" className="header-menu-select">
            Liên lạc
          </a>
        </nav>
        <div className="header-menu-user">
          <img src="#" alt="Ảnh đại diện User" width="32" height="32" loading="lazy" />
          <p>Welcome, NamHLP1!</p>
        </div>
      </header>

      {/* Page Title */}
      <section className={`content-title-display-box ${sidebarActive ? 'shift' : ''}`}>
        <div className="content-title-display-name">
          <h2>Tạo dịch vụ</h2>
        </div>
      </section>

      {/* Breadcrumb */}
      <nav className="breadcrumb">
        <a href="#">Bảng điều khiển</a> <a href="#">Tours</a> <span>Tạo Combo</span>
      </nav>

      {/* Page Header */}
      <div className="page-header">
        <h2 className="page-title">Tạo dịch vụ</h2>
      </div>

      {/* Main Content */}
      <main className={`content ${sidebarActive ? 'shift' : ''}`} role="main">
        <div className="form-content">
          <div className="disclaimer-text">
            (<span className="required-indicator">*</span>) bắt buộc
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Chi tiết Combo</h3>
              </div>
              <div className="card-content">
                {/* Combo Name */}
                <div className="field">
                  <label htmlFor="name">
                    Tên Combo
                    <span className="required-indicator">*</span>
                  </label>

                  {/* Address */}
                  <div className="field">
                    <label htmlFor="address">
                      Địa chỉ
                      <span className="required-indicator">*</span>
                    </label>
                    <input
                      id="address"
                      name="address"
                      type="text"
                      required
                      placeholder="Ví dụ: Hà Nội, Việt Nam"
                      value={formData.address}
                      onChange={handleInputChange}
                      className={errors.address ? 'error' : ''}
                    />
                    <div className="error" role="alert">
                      {errors.address}
                    </div>
                  </div>

                  {/* Description */}
                  <div className="field">
                    <label htmlFor="description">Mô tả</label>
                    <textarea
                      id="description"
                      name="description"
                      placeholder="Mô tả chi tiết về combo..."
                      value={formData.description}
                      onChange={handleInputChange}
                      rows="3"
                    />
                  </div>

                  {/* Price */}
                  <div className="field">
                    <label htmlFor="price">
                      Giá (VNĐ)
                      <span className="required-indicator">*</span>
                    </label>
                    <input
                      id="price"
                      name="price"
                      type="number"
                      step="1000"
                      min="0"
                      required
                      placeholder="0"
                      value={formData.price}
                      onChange={handleInputChange}
                      className={errors.price ? 'error' : ''}
                    />
                    <div className="error" role="alert">
                      {errors.price}
                    </div>
                  </div>

                  {/* Available Slots */}
                  <div className="field">
                    <label htmlFor="availableSlots">
                      Số chỗ trống
                      <span className="required-indicator">*</span>
                    </label>
                    <input
                      id="availableSlots"
                      name="availableSlots"
                      type="number"
                      min="1"
                      required
                      placeholder="10"
                      value={formData.availableSlots}
                      onChange={handleInputChange}
                      className={errors.availableSlots ? 'error' : ''}
                    />
                    <div className="error" role="alert">
                      {errors.availableSlots}
                    </div>
                  </div>

                  {/* Cancellation Policy */}
                  <div className="field">
                    <label htmlFor="cancellationPolicy">Chính sách hủy</label>
                    <textarea
                      id="cancellationPolicy"
                      name="cancellationPolicy"
                      placeholder="Chính sách hủy tour..."
                      value={formData.cancellationPolicy}
                      onChange={handleInputChange}
                      rows="2"
                    />
                  </div>

                  {/* Image Upload */}
                  <div className="field">
                    <label htmlFor="image">Ảnh đại diện</label>
                    <input
                      id="image"
                      name="image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                    {formData.image && (
                      <div className="image-preview">
                        <img
                          src={URL.createObjectURL(formData.image)}
                          alt="Preview"
                          style={{ maxWidth: '200px' }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Combo Name */}
                  <div className="field">
                    <label htmlFor="name">
                      Tên Combo
                      <span className="required-indicator">*</span>
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      placeholder="Ví dụ: Combo Khám Phá Việt Nam"
                      aria-describedby="err-name name-hint"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={errors.name ? 'error' : ''}
                    />
                    <div id="name-hint" className="hint">
                      Tên combo tour sẽ hiển thị cho khách hàng
                    </div>
                    <div id="err-name" className="error" aria-live="polite" role="alert">
                      {errors.name}
                    </div>
                  </div>

                  {/* Add dịch vụ Button */}
                  <div className="field">
                    <button
                      type="button"
                      className="add-description-btn"
                      onClick={addTourComboEntry}
                    >
                      ➕ Thêm dịch vụ
                    </button>
                    <div className="descriptions-list">
                      {tourComboEntries.map((entry) => (
                        <div key={entry.id} className="description-entry">
                          <div className="field">
                            <label>Tên dịch vụ</label>
                            <input
                              type="text"
                              value={entry.name}
                              onChange={(e) =>
                                updateTourComboEntry(entry.id, 'name', e.target.value)
                              }
                              placeholder="Nhập tên dịch vụ..."
                            />
                          </div>
                          <div className="field">
                            <label>Hình Ảnh</label>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) =>
                                handleTourComboImageUpload(entry.id, e.target.files[0])
                              }
                            />
                            {entry.imagePreview && (
                              <img
                                src={entry.imagePreview}
                                className="description-image-preview"
                                alt="Preview"
                              />
                            )}
                          </div>
                          <button
                            type="button"
                            className="remove-description-btn"
                            onClick={() => removeTourComboEntry(entry.id)}
                            title="Xóa"
                          >
                            🗑️
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Add Tours to Combo Section */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Tours Bao Gồm</h3>
              </div>
              <div className="card-content">
                {/* Search and Filter */}
                <div className="tour-search-bar">
                  <input
                    type="text"
                    placeholder="Tìm kiếm tour theo tên, địa điểm..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    autoComplete="off"
                  />
                  <select
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                  >
                    <option value="">Tất cả địa điểm</option>
                    <option value="hanoi">Hà Nội</option>
                    <option value="hochiminh">TP.HCM</option>
                    <option value="halong">Hạ Long</option>
                    <option value="danang">Đà Nẵng</option>
                    <option value="hue">Huế</option>
                    <option value="nhatrang">Nha Trang</option>
                    <option value="dalat">Đà Lạt</option>
                  </select>
                  <select value={priceFilter} onChange={(e) => setPriceFilter(e.target.value)}>
                    <option value="">Tất cả giá</option>
                    <option value="0-50">$0 - $50</option>
                    <option value="50-100">$50 - $100</option>
                    <option value="100-200">$100 - $200</option>
                    <option value="200+">$200+</option>
                  </select>
                </div>

                {/* Available Tours Table */}
                <div style={{ overflowX: 'auto' }}>
                  <table className="tour-table">
                    <thead>
                      <tr>
                        <th style={{ width: '50px' }}>
                          <input
                            type="checkbox"
                            checked={isSelectAllChecked()}
                            ref={(input) => {
                              if (input) input.indeterminate = isSelectAllIndeterminate()
                            }}
                            onChange={handleSelectAll}
                          />
                        </th>
                        <th>Tên Tour</th>
                        <th>Địa Điểm</th>
                        <th>Thời Gian</th>
                        <th>Giá</th>
                        <th style={{ width: '80px' }}>Hành Động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTours.map((tour) => (
                        <tr key={tour.id}>
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedTours.has(tour.id)}
                              onChange={() => toggleTourSelection(tour.id)}
                            />
                          </td>
                          <td>{tour.name}</td>
                          <td>{tour.location}</td>
                          <td>{tour.duration}</td>
                          <td>${tour.price}</td>
                          <td>
                            <button
                              type="button"
                              className="add-tour-btn"
                              disabled={selectedTours.has(tour.id)}
                              onClick={() => addTour(tour.id)}
                            >
                              {selectedTours.has(tour.id) ? 'Added' : '➕'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Selected Tours */}
                {selectedTours.size > 0 && (
                  <div className="selected-tours">
                    <h4>Tours Đã Chọn ({selectedTours.size})</h4>
                    <div>
                      {Array.from(selectedTours).map((tourId) => {
                        const tour = availableTours.find((t) => t.id === tourId)
                        return tour ? (
                          <div key={tourId} className="selected-tour-item">
                            <span>
                              {tour.name} - {tour.location} ({tour.duration}) - ${tour.price}
                            </span>
                            <button
                              type="button"
                              className="remove-tour-btn"
                              onClick={() => removeTour(tourId)}
                            >
                              Xóa
                            </button>
                          </div>
                        ) : null
                      })}
                    </div>
                  </div>
                )}

                {/* Tours selection error */}
                {errors.tours && (
                  <div className="error" style={{ marginTop: '1rem' }}>
                    {errors.tours}
                  </div>
                )}
              </div>
            </div>
          </form>

          {/* Form Actions */}
          <div className="form-action">
            <button type="button" className="secondary" onClick={handleReset}>
              Hủy / Quay Lại
            </button>
            <button type="button" className="primary" onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? 'Đang lưu...' : 'Lưu Combo'}
            </button>
          </div>
        </div>
      </main>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="loading-overlay" aria-hidden="false">
          <div className="loading-spinner" role="status">
            <span className="sr-only">Đang xử lý...</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default CreateTourCombo
