import { API_BASE_URL } from '~/config/api'

const backend_url = API_BASE_URL.replace('/api', '')

export const login = async (userEmail: string, password: string) => {
  try {
    const response = await fetch(`${backend_url}/api/Auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        UserEmail: userEmail,
        Password: password,
      }),
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

export const forgotPassword = async (email: string, phoneNumber?: string) => {
  try {
    const requestBody = {
      Email: email,
      PhoneNumber: phoneNumber || '',
    }

    const response = await fetch(
      `${backend_url}/api/Auth/RequestOtpForgetPassword`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    )

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`API error: ${response.status} - ${errText}`)
    }

    if (response.status === 204) {
      return { success: true }
    }

    const contentType = response.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      const data = await response.json()
      return data
    } else {
      const text = await response.text()
      return { success: true, message: text }
    }
  } catch (error) {
    console.error('Forgot password failed:', error)
    throw error
  }
}

export const verifyOtp = async (email: string, otp: string) => {
  try {
    const response = await fetch(
      `${backend_url}/api/Auth/VerifyOtpForgetPassword`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ Email: email, Otp: otp }),
      }
    )

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
      return data
    }
    const text = await response.text()
    return { success: true, message: text }
  } catch (error) {
    console.error('Verify OTP failed:', error)
    throw error
  }
}

export const resetPassword = async (email: string, otp: string, newPassword: string) => {
  try {
    const response = await fetch(`${backend_url}/api/Auth/ResetPassword`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        Email: email,
        Otp: otp,
        NewPassword: newPassword,
      }),
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
      return data
    }
    const text = await response.text()
    return { success: true, message: text }
  } catch (error) {
    console.error('Reset password failed:', error)
    throw error
  }
}

// Registration OTP functions
export const requestOtpForRegister = async (email: string, phoneNumber: string = '') => {
  try {
    const response = await fetch(`${backend_url}/api/Auth/RequestOtp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        Email: email,
        PhoneNumber: phoneNumber,
      }),
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

export const verifyOtpForRegister = async (email: string, otp: string) => {
  try {
    const response = await fetch(`${backend_url}/api/Auth/VerifyOtp`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ Email: email, Otp: otp }),
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

export const checkEmail = async (email: string): Promise<{ isExisting: boolean }> => {
  try {
    const response = await fetch(`${backend_url}/api/Auth/CheckEmail`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ Email: email }),
    })

    if (!response.ok) {
      // If API fails, assume email doesn't exist to allow user to proceed
      return { isExisting: false }
    }

    const contentType = response.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      const data = await response.json()
      return { isExisting: data.isExisting || data.IsExisting || false }
    }
    return { isExisting: false }
  } catch (error) {
    console.error('Check email failed:', error)
    // If check fails, allow user to proceed
    return { isExisting: false }
  }
}

export const register = async (userEmail: string, password: string, fullName: string, phone: string = '') => {
  try {
    const response = await fetch(`${backend_url}/api/Auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        UserEmail: userEmail,
        Password: password,
        FullName: fullName,
        Phone: phone,
      }),
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





