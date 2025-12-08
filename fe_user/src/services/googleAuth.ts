// Google OAuth Service
class GoogleAuthService {
  private clientId: string
  private isLoaded: boolean = false

  constructor() {
    this.clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'your-google-client-id'
  }

  // Load Google API
  loadGoogleAPI(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isLoaded) {
        resolve()
        return
      }

      if (window.gapi) {
        this.isLoaded = true
        resolve()
        return
      }

      const script = document.createElement('script')
      script.src = 'https://apis.google.com/js/api.js'
      script.onload = () => {
        window.gapi.load('auth2', () => {
          window.gapi.auth2
            .init({
              client_id: this.clientId,
            })
            .then(() => {
              this.isLoaded = true
              resolve()
            })
            .catch(reject)
        })
      }
      script.onerror = reject
      document.head.appendChild(script)
    })
  }

  // Google Sign In
  async signIn() {
    try {
      await this.loadGoogleAPI()

      const authInstance = window.gapi.auth2.getAuthInstance()
      const user = await authInstance.signIn()

      const profile = user.getBasicProfile()
      const authResponse = user.getAuthResponse()

      return {
        success: true,
        user: {
          id: profile.getId(),
          name: profile.getName(),
          email: profile.getEmail(),
          image: profile.getImageUrl(),
          accessToken: authResponse.access_token,
          idToken: authResponse.id_token,
        },
      }
    } catch (error) {
      console.error('Google Sign In Error:', error)
      return {
        success: false,
        error: (error as Error).message || 'Đăng nhập Google thất bại',
      }
    }
  }

  // Google Sign Out
  async signOut() {
    try {
      if (this.isLoaded && window.gapi) {
        const authInstance = window.gapi.auth2.getAuthInstance()
        await authInstance.signOut()
      }
      return { success: true }
    } catch (error) {
      console.error('Google Sign Out Error:', error)
      return { success: false, error: (error as Error).message }
    }
  }

  // Check if user is signed in
  isSignedIn(): boolean {
    if (!this.isLoaded || !window.gapi) return false

    const authInstance = window.gapi.auth2.getAuthInstance()
    return authInstance.isSignedIn.get()
  }

  // Get current user
  getCurrentUser() {
    if (!this.isSignedIn()) return null

    const authInstance = window.gapi.auth2.getAuthInstance()
    const user = authInstance.currentUser.get()
    const profile = user.getBasicProfile()

    return {
      id: profile.getId(),
      name: profile.getName(),
      email: profile.getEmail(),
      image: profile.getImageUrl(),
    }
  }
}

// Create singleton instance
const googleAuthService = new GoogleAuthService()

export default googleAuthService

// Type definitions for Google API
declare global {
  interface Window {
    gapi?: {
      load: (api: string, callback: () => void) => void
      auth2: {
        init: (config: { client_id: string }) => Promise<unknown>
        getAuthInstance: () => {
          signIn: () => Promise<{
            getBasicProfile: () => {
              getId: () => string
              getName: () => string
              getEmail: () => string
              getImageUrl: () => string
            }
            getAuthResponse: () => {
              access_token: string
              id_token: string
            }
          }>
          signOut: () => Promise<unknown>
          isSignedIn: {
            get: () => boolean
          }
          currentUser: {
            get: () => {
              getBasicProfile: () => {
                getId: () => string
                getName: () => string
                getEmail: () => string
                getImageUrl: () => string
              }
            }
          }
        }
      }
    }
  }
}






















