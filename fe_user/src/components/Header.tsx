import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
    BellIcon,
    UserIcon,
    ChevronDownIcon,
    StarIcon,
    CrownIcon,
    LogOutIcon,
} from "~/components/icons";
import NotificationDropdown from "~/components/NotificationDropdown";
import { getNotifications } from "~/API/NotificationApi";
import type { NotificationDto } from "~/API/NotificationApi";
import "./Header.css";

const Header = React.memo(() => {
    const location = useLocation();
    const navigate = useNavigate();

    // Memoize location.pathname để tránh re-render không cần thiết
    const currentPath = useMemo(() => location.pathname, [location.pathname]);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
        const token =
            localStorage.getItem("token") || sessionStorage.getItem("token");
        return !!token;
    });
    const [userInfo, setUserInfo] = useState<any>(() => {
        try {
            const userInfoStr =
                localStorage.getItem("userInfo") ||
                sessionStorage.getItem("userInfo");
            return userInfoStr ? JSON.parse(userInfoStr) : null;
        } catch {
            return null;
        }
    });

    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === "token" || e.key === "userInfo" || e.key === null) {
                // Đọc lại đồng bộ và update state
                const token =
                    localStorage.getItem("token") ||
                    sessionStorage.getItem("token");
                const userInfoStr =
                    localStorage.getItem("userInfo") ||
                    sessionStorage.getItem("userInfo");

                setIsLoggedIn(!!token);

                if (userInfoStr) {
                    try {
                        setUserInfo(JSON.parse(userInfoStr));
                    } catch {
                        setUserInfo(null);
                    }
                } else {
                    setUserInfo(null);
                }
            }
        };

        window.addEventListener("storage", handleStorageChange);
        return () => window.removeEventListener("storage", handleStorageChange);
    }, []); // chỉ chạy 1 lần

    // Load unread notifications count
    useEffect(() => {
        if (isLoggedIn) {
            const loadUnreadCount = async () => {
                try {
                    const notifications = await getNotifications();
                    const unread = notifications.filter(
                        (n) => !(n.IsRead || n.isRead)
                    );
                    setUnreadCount(unread.length);
                } catch (error) {
                    console.error("Error loading notifications:", error);
                }
            };
            loadUnreadCount();
            // Refresh every 30 seconds
            const interval = setInterval(loadUnreadCount, 30000);
            return () => clearInterval(interval);
        }
    }, [isLoggedIn]);

    // Xử lý scroll
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Đóng menu khi click bên ngoài
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (
                !target.closest(".header-user-menu-container") &&
                !target.closest(".notification-bell-container")
            ) {
                setIsUserMenuOpen(false);
                setIsNotificationOpen(false);
            }
        };

        if (isUserMenuOpen || isNotificationOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            return () =>
                document.removeEventListener("mousedown", handleClickOutside);
        }
    }, [isUserMenuOpen, isNotificationOpen]);

    // Xử lý đăng xuất
    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("userInfo");
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("userInfo");
        setIsLoggedIn(false);
        setUserInfo(null);
        setIsUserMenuOpen(false);
        navigate("/");
        window.location.reload();
    };

    // Lấy tên role
    const getRoleName = (): string => {
        if (!userInfo) return "User";

        if (userInfo.Role?.Name || userInfo.role?.name) {
            const roleName = userInfo.Role?.Name || userInfo.role?.name;
            if (roleName === "User") return "Tourist";
            return roleName;
        }
        if (userInfo.RoleName || userInfo.roleName) {
            const roleName = userInfo.RoleName || userInfo.roleName;
            if (roleName === "User") return "Tourist";
            return roleName;
        }

        const roleId = userInfo.RoleId || userInfo.roleId;
        if (roleId === 1) return "Admin";
        if (roleId === 2) return "Host";
        if (roleId === 3) return "Agency";
        if (roleId === 4) return "Tourist";
        return "User";
    };

    // Memoize getUserAvatar để tránh tính toán lại
    const getUserAvatar = useCallback(() => {
        const avatar = userInfo?.Avatar || userInfo?.avatar;
        if (avatar) return avatar;

        const name = userInfo?.Name || userInfo?.name || "U";
        const initials = name
            .split(" ")
            .map((n: string) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
        return initials;
    }, [userInfo]);

    // Memoize isActive function để tránh tính toán lại không cần thiết
    const isActive = useCallback(
        (path: string) => {
            if (path === "/") {
                return currentPath === "/";
            }
            return currentPath.startsWith(path);
        },
        [currentPath]
    );

    const GuestActions = () => {
        return (
            <>
                <Link to="/login" className="header-btn-login">
                    Đăng nhập
                </Link>
                <Link to="/register" className="header-btn-register">
                    Đăng ký
                </Link>
            </>
        );
    };

    const UserActions = () => {
        return (
            <>
                {/* Notification Bell */}
                <div
                    className="notification-bell-container"
                    style={{ position: "relative" }}
                >
                    <button
                        className="header-notification-bell"
                        onClick={() => {
                            setIsNotificationOpen(!isNotificationOpen);
                            setIsUserMenuOpen(false);
                        }}
                        aria-label="Thông báo"
                    >
                        <BellIcon className="header-bell-icon" />
                        {unreadCount > 0 && (
                            <span className="header-notification-badge">
                                {unreadCount}
                            </span>
                        )}
                    </button>
                    {isNotificationOpen && (
                        <NotificationDropdown
                            isOpen={isNotificationOpen}
                            onClose={() => setIsNotificationOpen(false)}
                        />
                    )}
                </div>

                {/* User Menu */}
                <div
                    className="header-user-menu-container"
                    style={{ position: "relative" }}
                >
                    <button
                        className="header-user-menu-trigger"
                        onClick={() => {
                            setIsUserMenuOpen(!isUserMenuOpen);
                            setIsNotificationOpen(false);
                        }}
                        aria-label="Menu người dùng"
                    >
                        <div className="header-user-avatar">
                            {(() => {
                                const avatar = getUserAvatar();
                                return typeof avatar === "string" &&
                                    avatar.startsWith("http") ? (
                                    <img
                                        src={avatar}
                                        alt="Avatar"
                                        className="header-user-avatar-img"
                                    />
                                ) : (
                                    <span className="header-user-avatar-initials">
                                        {avatar}
                                    </span>
                                );
                            })()}
                        </div>
                        <div className="header-user-info-inline">
                            <span className="header-user-name-inline">
                                {userInfo?.Name ||
                                    userInfo?.name ||
                                    "Người dùng"}
                            </span>
                            <span className="header-user-role-inline">
                                {getRoleName()}
                            </span>
                        </div>
                        <ChevronDownIcon
                            className={`header-user-menu-chevron ${isUserMenuOpen ? "header-open" : ""}`}
                        />
                    </button>

                    {isUserMenuOpen && (
                        <div className="header-user-menu-dropdown">
                            <Link
                                to="/profile"
                                className="header-user-menu-item"
                                onClick={() => setIsUserMenuOpen(false)}
                            >
                                <UserIcon
                                    style={{
                                        width: "18px",
                                        height: "18px",
                                    }}
                                />
                                <span>Hồ sơ của tôi</span>
                            </Link>
                            <div className="header-user-menu-divider" />
                            <Link
                                to="/subscription-packages"
                                className="header-user-menu-item"
                                onClick={() => setIsUserMenuOpen(false)}
                            >
                                <StarIcon
                                    style={{
                                        width: "18px",
                                        height: "18px",
                                    }}
                                />
                                <span>Cấp độ của bạn</span>
                            </Link>
                            <Link
                                to="/upgrade"
                                className="header-user-menu-item header-user-menu-item-upgrade"
                                onClick={() => setIsUserMenuOpen(false)}
                            >
                                <CrownIcon
                                    style={{
                                        width: "18px",
                                        height: "18px",
                                    }}
                                />
                                <span>Nâng cấp tài khoản</span>
                            </Link>
                            <div className="header-user-menu-divider" />
                            <button
                                className="header-user-menu-item header-user-menu-item-logout"
                                onClick={handleLogout}
                            >
                                <LogOutIcon
                                    style={{
                                        width: "18px",
                                        height: "18px",
                                    }}
                                />
                                <span>Đăng xuất</span>
                            </button>
                        </div>
                    )}
                </div>
            </>
        );
    };

    return (
        <header
            className={`header-header ${isScrolled ? "header-scrolled" : ""}`}
        >
            <div className="header-header-container">
                {/* Logo */}
                <Link to="/" className="header-logo-section">
                    <img
                        src="/img/logo_esce.png"
                        alt="ESCE Logo"
                        className="header-logo"
                    />
                    <div className="header-logo-text">
                        <div className="header-logo-text-main">
                            Du Lịch Sinh thái
                        </div>
                        <div className="header-logo-text-sub">Đà Nẵng</div>
                    </div>
                </Link>

                {/* Navigation */}
                <nav className="header-header-nav">
                    <Link
                        to="/"
                        className={`header-nav-link ${isActive("/") && currentPath !== "/services" && currentPath !== "/forum" && currentPath !== "/news" && currentPath !== "/policy" ? "header-active" : ""}`}
                    >
                        Trang chủ
                    </Link>
                    <Link
                        to="/services"
                        className={`header-nav-link ${isActive("/services") ? "header-active" : ""}`}
                    >
                        Dịch vụ
                    </Link>
                    <Link
                        to="/forum"
                        className={`header-nav-link ${isActive("/forum") ? "header-active" : ""}`}
                    >
                        Diễn đàn
                    </Link>
                    <Link
                        to="/news"
                        className={`header-nav-link ${isActive("/news") ? "header-active" : ""}`}
                    >
                        Tin tức
                    </Link>
                    <Link
                        to="/policy"
                        className={`header-nav-link ${isActive("/policy") ? "header-active" : ""}`}
                    >
                        Chính sách
                    </Link>
                </nav>

                {/* Actions */}
                <div className="header-header-actions">
                    {isLoggedIn ? <UserActions /> : <GuestActions />}
                </div>
            </div>
        </header>
    );
});

Header.displayName = "Header";

export default Header;
