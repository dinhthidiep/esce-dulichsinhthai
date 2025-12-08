import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';
import Header from './Header';
import Button from './ui/Button';
import Badge from './ui/Badge';
import LoadingSpinner from './LoadingSpinner';
import { 
  UserIcon, 
  CalendarIcon, 
  BellIcon, 
  SettingsIcon,
  EditIcon,
  SaveIcon,
  XIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  StarIcon,
  ArrowRightIcon,
  GridIcon,
  ChevronDownIcon,
  CommentIcon
} from './icons/index';
import HostSidebar from './HostSidebar';

// Additional Icons for Review Management
const MoreVerticalIcon = ({ className = '', ...props }) => (
  <svg 
    className={className} 
    width="20" 
    height="20" 
    viewBox="0 0 24 24" 
    fill="none"
    stroke="currentColor" 
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <circle cx="12" cy="12" r="1"/>
    <circle cx="12" cy="5" r="1"/>
    <circle cx="12" cy="19" r="1"/>
  </svg>
);

const TrashIcon = ({ className = '', ...props }) => (
  <svg 
    className={className} 
    width="16" 
    height="16" 
    viewBox="0 0 24 24" 
    fill="none"
    stroke="currentColor" 
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
  </svg>
);
import { formatPrice, getImageUrl } from '../lib/utils';
import { API_ENDPOINTS } from '../config/api';
import ServicesManagement from './service/ServicesManagement';
import type { ServicesManagementRef } from './service/ServicesManagement';
import CouponManagement from './coupon/CouponManagement';
import type { CouponManagementRef } from './coupon/CouponManagement';
import ServiceComboManagement from './service-combo/ServiceComboManagement';
import type { ServiceComboManagementRef } from './service-combo/ServiceComboManagement';
import PrivilegeManagement from './privilege/PrivilegeManagement';
import type { PrivilegeManagementRef } from './privilege/PrivilegeManagement';
import BookingManagement from './booking/BookingManagement';
import ReviewManagement from './review/ReviewManagement';
import RevenueManagement from './revenue/RevenueManagement';
import './HostDashboard.css';
