// import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import * as signalR from '@microsoft/signalr'
import { createContext, useContext, useEffect, useRef, useState } from 'react'

interface NotificationItem {
  Id?: number | string
  id?: number | string
  CreatedAt?: string
  createdAt?: string
  IsRead?: boolean
  isRead?: boolean
  [key: string]: any
}

interface NotificationContextType {
  notifications: NotificationItem[]
  isConnected: boolean
  addNotification: (n: NotificationItem) => void
  removeNotification: (id: string | number) => void
  markAsRead: (id: string | number) => void
  setNotifications: React.Dispatch<React.SetStateAction<NotificationItem[]>>
}

const NotificationContext = createContext<NotificationContextType | null>(null)

export const useNotification = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider')
  }
  return context
}

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState<any>([])
  const [_, setConnection] = useState<signalR.HubConnection | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const connectionRef = useRef<signalR.HubConnection | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      return
    }

    // Create SignalR connection
    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl('http://localhost:5002/hubs/notification', {
        accessTokenFactory: () => token,
        skipNegotiation: false,
        transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling
      })
      .withAutomaticReconnect()
      .build()

    // Set up event handlers
    newConnection.on('ReceiveNotification', (notification) => {
      setNotifications((prev) => {
        // Check if notification already exists to avoid duplicates
        const exists = prev.some((n) => (n.Id || n.id) === (notification.Id || notification.id))
        if (exists) return prev
        // Add new notification at the beginning and sort by date
        const updated = [notification, ...prev]
        return updated.sort((a, b) => {
          const dateA = new Date(a.CreatedAt || a.createdAt || 0).getTime()
          const dateB = new Date(b.CreatedAt || b.createdAt || 0).getTime()
          return dateB - dateA
        })
      })
    })

    newConnection.on('LoadOldNotifications', (oldNotifications) => {
      // Sort by CreatedAt descending (newest first)
      const sorted = (oldNotifications || []).sort((a, b) => {
        const dateA = new Date(a.CreatedAt || a.createdAt || 0).getTime()
        const dateB = new Date(b.CreatedAt || b.createdAt || 0).getTime()
        return dateB - dateA
      })
      setNotifications(sorted)
    })

    // Handle connection events
    newConnection.onclose(() => {
      setIsConnected(false)
    })

    newConnection.onreconnecting(() => {
      setIsConnected(false)
    })

    newConnection.onreconnected(() => {
      setIsConnected(true)
    })

    // Start connection
    newConnection
      .start()
      .then(() => {
        setIsConnected(true)
        setConnection(newConnection)
        connectionRef.current = newConnection
      })
      .catch((err) => {
        console.error('Error starting SignalR connection:', err)
        setIsConnected(false)
      })

    // Cleanup on unmount
    return () => {
      if (connectionRef.current) {
        connectionRef.current.stop()
      }
    }
  }, [])

  const addNotification = (notification) => {
    setNotifications((prev) => {
      const exists = prev.some((n) => n.Id === notification.Id || n.id === notification.id)
      if (exists) return prev
      return [notification, ...prev]
    })
  }

  const removeNotification = (notificationId) => {
    setNotifications((prev) => prev.filter((n) => (n.Id || n.id) !== notificationId))
  }

  const markAsRead = (notificationId) => {
    setNotifications((prev) =>
      prev.map((n) => {
        if ((n.Id || n.id) === notificationId) {
          return { ...n, IsRead: true, isRead: true }
        }
        return n
      })
    )
  }

  const value = {
    notifications,
    isConnected,
    addNotification,
    removeNotification,
    markAsRead,
    setNotifications
  }

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}
