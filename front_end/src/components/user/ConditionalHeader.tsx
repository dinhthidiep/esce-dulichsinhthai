import React, { useMemo, useState, useEffect, useRef } from 'react'
import Header from './Header'
import HostHeader from './HostHeader'

/**
 * Component tự động chọn Header hoặc HostHeader dựa trên role của user
 * Nếu user là Host (roleId === 2), hiển thị HostHeader
 * Ngược lại, hiển thị Header chung
 * 
 * Tối ưu: Chỉ check role một lần khi mount và khi storage thay đổi
 * Sử dụng ref để tránh re-render không cần thiết
 */
const ConditionalHeader = () => {
  const [isHost, setIsHost] = useState(() => {
    // Initial state - check ngay khi mount
    try {
      const userInfoStr = localStorage.getItem('userInfo') || sessionStorage.getItem('userInfo')
      if (userInfoStr) {
        const userInfo = JSON.parse(userInfoStr)
        const roleId = userInfo.RoleId || userInfo.roleId
        return roleId === 2
      }
    } catch (e) {
      console.error('Error checking role:', e)
    }
    return false
  })

  const isHostRef = useRef(isHost)
  isHostRef.current = isHost

  // Chỉ update khi storage thay đổi (login/logout/role change)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'userInfo' || e.key === null) {
        try {
          const userInfoStr = localStorage.getItem('userInfo') || sessionStorage.getItem('userInfo')
          if (userInfoStr) {
            const userInfo = JSON.parse(userInfoStr)
            const roleId = userInfo.RoleId || userInfo.roleId
            const newIsHost = roleId === 2
            // Chỉ update nếu thay đổi
            if (newIsHost !== isHostRef.current) {
              setIsHost(newIsHost)
            }
          } else {
            if (isHostRef.current !== false) {
              setIsHost(false)
            }
          }
        } catch (e) {
          console.error('Error checking role:', e)
          if (isHostRef.current !== false) {
            setIsHost(false)
          }
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // Memoize với key để đảm bảo React xử lý đúng khi switch
  // Key giúp React biết đây là 2 component khác nhau và unmount/mount đúng cách
  return useMemo(() => {
    return isHost ? <HostHeader key="host-header" /> : <Header key="regular-header" />
  }, [isHost])
}

// Không wrap với React.memo vì chúng ta muốn nó re-render khi isHost thay đổi
export default ConditionalHeader






