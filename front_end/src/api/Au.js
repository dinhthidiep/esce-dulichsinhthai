// Dùng HTTPS đúng với cấu hình back_end (xem launchSettings.json: https://localhost:7267)
export const backend_url = 'https://localhost:7267'

export const login = async (userEmail, password) => {
  try {
    const response = await fetch(`${backend_url}/api/Auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        UserEmail: userEmail,
        Password: password
      })
    })

    const contentType = response.headers.get('content-type') || ''

    if (!response.ok) {
      let errorMessage = 'Đăng nhập thất bại. Vui lòng thử lại.'

      if (contentType.includes('application/json')) {
        const errorData = await response.json()
        errorMessage = errorData.message || errorMessage
      } else {
        const errorText = await response.text()
        try {
          const errorJson = JSON.parse(errorText)
          errorMessage = errorJson.message || errorMessage
        } catch {
          errorMessage = errorText || errorMessage
        }
      }

      throw new Error(errorMessage)
    }

    if (contentType.includes('application/json')) {
      const data = await response.json()
      return data
    }

    const text = await response.text()
    throw new Error('Response không hợp lệ từ server.')
  } catch (error) {
    console.error('Login failed:', error)
    throw error
  }
}

export const forgotPassword = async (email, phoneNumber) => {
  console.log('🌐 [API] forgotPassword được gọi với:', { email, phoneNumber })
  console.log('🌐 [API] URL:', `${backend_url}/api/Auth/RequestOtpForgetPassword`)

  try {
    const requestBody = {
      Email: email,
      PhoneNumber: phoneNumber || ''
    }
    console.log('🌐 [API] Request body:', requestBody)

    const response = await fetch(`${backend_url}/api/Auth/RequestOtpForgetPassword`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })

    console.log('🌐 [API] Response status:', response.status)
    console.log('🌐 [API] Response ok:', response.ok)

    if (!response.ok) {
      const errText = await response.text()
      console.error('❌ [API] Response error:', errText)
      console.error('❌ [API] Response status:', response.status)
      throw new Error(`API error: ${response.status} - ${errText}`)
    }

    // Some backends return 204 No Content or non-JSON bodies even on success
    if (response.status === 204) {
      console.log('✅ [API] Response 204 - Success')
      return { success: true }
    }

    const contentType = response.headers.get('content-type') || ''
    console.log('🌐 [API] Content-Type:', contentType)

    if (contentType.includes('application/json')) {
      const data = await response.json()
      console.log('✅ [API] Forgot password response (JSON):', data)
      return data
    } else {
      const text = await response.text()
      console.log('✅ [API] Forgot password response (text):', text)
      return { success: true, message: text }
    }
  } catch (error) {
    console.error('❌ [API] Forgot password failed:', error)
    console.error('❌ [API] Error type:', error?.constructor?.name)
    console.error('❌ [API] Error message:', error?.message)
    console.error('❌ [API] Error stack:', error?.stack)
    throw error
  }
}

export const verifyOtp = async (email, otp) => {
  try {
    const response = await fetch(`${backend_url}/api/Auth/VerifyOtpForgetPassword`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ Email: email, Otp: otp })
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('Verify OTP error:', errText)
      throw new Error(`API error: ${response.status}`)
    }

    if (response.status === 204) {
      return { success: true }
    }

    const contentType = response.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      const data = await response.json()
      console.log('Verify OTP response:', data)
      return data
    }
    const text = await response.text()
    console.log('Verify OTP response (text):', text)
    return { success: true, message: text }
  } catch (error) {
    console.error('Verify OTP failed:', error)
    throw error
  }
}

export const resetPassword = async (email, otp, newPassword) => {
  try {
    const response = await fetch(`${backend_url}/api/Auth/ResetPassword`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ Email: email, Otp: otp, NewPassword: newPassword })
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('Reset password error:', errText)
      throw new Error(`API error: ${response.status}`)
    }

    if (response.status === 204) {
      return { success: true }
    }

    const contentType = response.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      const data = await response.json()
      console.log('Reset password response:', data)
      return data
    }
    const text = await response.text()
    console.log('Reset password response (text):', text)
    return { success: true, message: text }
  } catch (error) {
    console.error('Reset password failed:', error)
    throw error
  }
}

// Registration OTP functions
export const requestOtpForRegister = async (email, phoneNumber = '') => {
  try {
    const response = await fetch(`${backend_url}/api/Auth/RequestOtp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        Email: email,
        PhoneNumber: phoneNumber
      })
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('Request OTP for register error:', errText)
      throw new Error(`API error: ${response.status} - ${errText}`)
    }

    if (response.status === 204) {
      return { success: true }
    }

    const contentType = response.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      const data = await response.json()
      return data
    }
    const text = await response.text()
    return { success: true, message: text }
  } catch (error) {
    console.error('Request OTP for register failed:', error)
    throw error
  }
}

export const verifyOtpForRegister = async (email, otp) => {
  try {
    const response = await fetch(`${backend_url}/api/Auth/VerifyOtp`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ Email: email, Otp: otp })
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('Verify OTP for register error:', errText)
      throw new Error(`API error: ${response.status} - ${errText}`)
    }

    if (response.status === 204) {
      return { success: true }
    }

    const contentType = response.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      const data = await response.json()
      return data
    }
    const text = await response.text()
    return { success: true, message: text }
  } catch (error) {
    console.error('Verify OTP for register failed:', error)
    throw error
  }
}

export const register = async (userEmail, password, fullName, phone = '') => {
  try {
    const response = await fetch(`${backend_url}/api/Auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userEmail,
        password,
        fullName,
        phone
      })
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('Register error:', errText)
      let errorMessage = errText
      try {
        const errorJson = JSON.parse(errText)
        errorMessage = errorJson.message || errText
      } catch {
        // Keep the text error message
      }
      throw new Error(errorMessage)
    }

    const contentType = response.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      const data = await response.json()
      return data
    }
    const text = await response.text()
    return { success: true, message: text }
  } catch (error) {
    console.error('Register failed:', error)
    throw error
  }
}
