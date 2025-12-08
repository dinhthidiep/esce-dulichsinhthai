// Mock Auth Service để thay thế fetch calls trong Au.ts
import { mockUsers, delay } from './index'

const SIMULATE_DELAY = true
const MIN_DELAY = 100
const MAX_DELAY = 500

const randomDelay = () => {
  if (!SIMULATE_DELAY) return Promise.resolve()
  const delayMs = Math.floor(Math.random() * (MAX_DELAY - MIN_DELAY + 1)) + MIN_DELAY
  return delay(delayMs)
}

// Mock OTP storage (in-memory)
const mockOtpStore: Record<string, { otp: string; expiresAt: number }> = {}

// Generate mock OTP
const generateOtp = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Mock Auth Service
export const mockAuthService = {
  login: async (userEmail: string, password: string) => {
    await randomDelay()
    console.log('[MOCK AUTH] Login:', { userEmail, password })

    // Tìm user theo email
    let user = mockUsers.find((u) => u.Email === userEmail)

    // Nếu không tìm thấy user, tự động tạo user mới với role tourist (4) và level 0
    if (!user) {
      user = {
        Id: mockUsers.length + 1,
        Email: userEmail,
        Name: userEmail.split('@')[0],
        Phone: '',
        Gender: '',
        Dob: null,
        Address: '',
        Avatar: '/img/logo_esce.png',
        Role: 4, // tourist
        RoleName: 'tourist',
        MembershipTier: 'none', // Level 0 - chưa có gói thành viên
        CreatedAt: new Date().toISOString(),
        UpdatedAt: new Date().toISOString(),
      }
      mockUsers.push(user)
      console.log(`[MOCK AUTH] Tự động tạo user mới: ${userEmail} với role tourist và level 0`)
    }

    // Mock token
    const token = `mock_token_${user.Id}_${Date.now()}`
    const userInfo = {
      Id: user.Id,
      id: user.Id, // Cả hai format
      Email: user.Email,
      email: user.Email,
      Name: user.Name,
      name: user.Name,
      Phone: user.Phone,
      phone: user.Phone,
      Avatar: user.Avatar,
      avatar: user.Avatar,
      Role: user.Role,
      role: user.Role,
      RoleName: user.RoleName || (user.Role === 1 ? 'admin' : user.Role === 2 ? 'host' : user.Role === 3 ? 'agency' : 'tourist'),
      roleName: user.RoleName || (user.Role === 1 ? 'admin' : user.Role === 2 ? 'host' : user.Role === 3 ? 'agency' : 'tourist'),
      Gender: user.Gender,
      gender: user.Gender,
      Dob: user.Dob,
      dob: user.Dob,
      Address: user.Address,
      address: user.Address,
      CreatedAt: user.CreatedAt,
      createdAt: user.CreatedAt,
      UpdatedAt: user.UpdatedAt,
      updatedAt: user.UpdatedAt,
      // Thêm MembershipTier nếu có trong user
      MembershipTier: (user as any).MembershipTier || (user as any).membershipTier || undefined,
      membershipTier: (user as any).MembershipTier || (user as any).membershipTier || undefined,
      tier: (user as any).MembershipTier || (user as any).membershipTier || undefined,
    }

    console.log(`[MOCK AUTH] Đăng nhập thành công: ${userEmail} - Role: ${userInfo.RoleName} (${userInfo.Role})`)

    // Trả về format giống backend: Token và UserInfo (PascalCase)
    return {
      Token: token, // PascalCase để match với backend
      token: token, // Cũng có camelCase để tương thích
      UserInfo: userInfo, // PascalCase để match với backend
      userInfo: userInfo, // Cũng có camelCase để tương thích
      user: userInfo, // Format cũ để tương thích
      message: 'Đăng nhập thành công',
    }
  },

  forgotPassword: async (email: string, phoneNumber?: string) => {
    await randomDelay()
    console.log('[MOCK AUTH] Forgot password:', { email, phoneNumber })

    const otp = generateOtp()
    mockOtpStore[email] = {
      otp,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    }

    console.log(`[MOCK AUTH] OTP for ${email}: ${otp}`)

    return { success: true, message: 'OTP đã được gửi đến email của bạn' }
  },

  verifyOtp: async (email: string, otp: string) => {
    await randomDelay()
    console.log('[MOCK AUTH] Verify OTP:', { email, otp })

    const stored = mockOtpStore[email]
    if (!stored || stored.expiresAt < Date.now()) {
      throw new Error('OTP không hợp lệ hoặc đã hết hạn')
    }

    if (stored.otp !== otp) {
      throw new Error('OTP không đúng')
    }

    // Mark OTP as used
    delete mockOtpStore[email]

    return { success: true, message: 'OTP hợp lệ' }
  },

  resetPassword: async (email: string, otp: string, newPassword: string) => {
    await randomDelay()
    console.log('[MOCK AUTH] Reset password:', { email })

    // Verify OTP first
    const stored = mockOtpStore[email]
    if (!stored || stored.expiresAt < Date.now()) {
      throw new Error('OTP không hợp lệ hoặc đã hết hạn')
    }

    if (stored.otp !== otp) {
      throw new Error('OTP không đúng')
    }

    // Update user password (mock - just log)
    const user = mockUsers.find((u) => u.Email === email)
    if (user) {
      user.UpdatedAt = new Date().toISOString()
    }

    delete mockOtpStore[email]

    return { success: true, message: 'Đặt lại mật khẩu thành công' }
  },

  requestOtpForRegister: async (email: string, phoneNumber: string = '') => {
    await randomDelay()
    console.log('[MOCK AUTH] Request OTP for register:', { email, phoneNumber })

    // Check if email already exists
    const existingUser = mockUsers.find((u) => u.Email === email)
    if (existingUser) {
      throw new Error('Email đã được sử dụng')
    }

    const otp = generateOtp()
    mockOtpStore[email] = {
      otp,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    }

    console.log(`[MOCK AUTH] OTP for register ${email}: ${otp}`)

    return { success: true, message: 'OTP đã được gửi đến email của bạn' }
  },

  verifyOtpForRegister: async (email: string, otp: string) => {
    await randomDelay()
    console.log('[MOCK AUTH] Verify OTP for register:', { email, otp })

    const stored = mockOtpStore[email]
    if (!stored || stored.expiresAt < Date.now()) {
      throw new Error('OTP không hợp lệ hoặc đã hết hạn')
    }

    if (stored.otp !== otp) {
      throw new Error('OTP không đúng')
    }

    // Mark email as verified (don't delete OTP yet, need it for register)
    return { success: true, message: 'OTP hợp lệ' }
  },

  register: async (userEmail: string, password: string, fullName: string, phone: string = '') => {
    await randomDelay()
    console.log('[MOCK AUTH] Register:', { userEmail, fullName, phone })

    // Check if email already exists
    const existingUser = mockUsers.find((u) => u.Email === userEmail)
    if (existingUser) {
      throw new Error('Email đã được sử dụng')
    }

    // Create new user với role tourist (4) mặc định và level 0
    const newUser = {
      Id: mockUsers.length + 1,
      Email: userEmail,
      Name: fullName,
      Phone: phone,
      Gender: '',
      Dob: null,
      Address: '',
      Avatar: '/img/logo_esce.png',
      Role: 4, // tourist (mặc định)
      RoleName: 'tourist',
      MembershipTier: 'none', // Level 0 - chưa có gói thành viên
      CreatedAt: new Date().toISOString(),
      UpdatedAt: new Date().toISOString(),
    }

    mockUsers.push(newUser)

    // Clean up OTP
    delete mockOtpStore[userEmail]

    // Auto login after register
    const token = `mock_token_${newUser.Id}_${Date.now()}`
    const userInfo = {
      Id: newUser.Id,
      id: newUser.Id,
      Email: newUser.Email,
      email: newUser.Email,
      Name: newUser.Name,
      name: newUser.Name,
      Phone: newUser.Phone,
      phone: newUser.Phone,
      Avatar: newUser.Avatar,
      avatar: newUser.Avatar,
      Role: newUser.Role,
      role: newUser.Role,
      RoleName: newUser.RoleName,
      roleName: newUser.RoleName,
      Gender: newUser.Gender,
      gender: newUser.Gender,
      Dob: newUser.Dob,
      dob: newUser.Dob,
      Address: newUser.Address,
      address: newUser.Address,
      CreatedAt: newUser.CreatedAt,
      createdAt: newUser.CreatedAt,
      UpdatedAt: newUser.UpdatedAt,
      updatedAt: newUser.UpdatedAt,
      // Thêm MembershipTier
      MembershipTier: newUser.MembershipTier,
      membershipTier: newUser.MembershipTier,
      tier: newUser.MembershipTier,
    }

    console.log(`[MOCK AUTH] Đăng ký thành công: ${userEmail} - Role: ${userInfo.RoleName} (${userInfo.Role})`)

    // Trả về format giống backend: Token và UserInfo (PascalCase)
    return {
      Token: token,
      token: token,
      UserInfo: userInfo,
      userInfo: userInfo,
      user: userInfo,
      message: 'Đăng ký thành công',
    }
  },
}

