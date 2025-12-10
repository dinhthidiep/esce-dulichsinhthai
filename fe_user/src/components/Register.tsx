import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Register.css";
import googleAuthService from "~/services/googleAuth";
import { requestOtpForRegister } from "~/API/instances/Au";

// Giả lập các hàm bị thiếu (bạn cần thay bằng hàm thật trong dự án)
const checkEmail = async (email: string) => {
    // TODO: Gọi API kiểm tra email
    // Ví dụ: const res = await fetch(`/api/Auth/check-email?email=${email}`)
    // return { isExisting: false }
    return { isExisting: false };
};

const fetchWithFallback = async (url: string, options: RequestInit) => {
    try {
        const res = await fetch(url, options);
        return res;
    } catch (err) {
        throw new Error("Network error");
    }
};

const extractErrorMessage = async (res: Response, defaultMsg: string) => {
    try {
        const data = await res.json();
        return data.message || data.error || defaultMsg;
    } catch {
        return defaultMsg;
    }
};

interface FormData {
    name: string;
    email: string;
    password: string;
    confirm: string;
    phone: string;
    agree: boolean;
}

interface Errors {
    name?: string;
    email?: string;
    password?: string;
    confirm?: string;
    phone?: string;
    agree?: string;
    submit?: string;
}

declare global {
    interface Window {
        google?: {
            accounts: {
                id: {
                    initialize: (config: any) => void;
                    renderButton: (
                        element: HTMLElement | null,
                        config: any
                    ) => void;
                    prompt: () => void;
                };
            };
        };
    }
}
const Register = () => {
    const navigate = useNavigate();
    const googleBtnRef = useRef<HTMLDivElement>(null);

    const [form, setForm] = useState<FormData>({
        name: "",
        email: "",
        password: "",
        confirm: "",
        phone: "",
        agree: false,
    });

    // Sửa lỗi: phải khởi tạo errors là object rỗng hoặc undefined rõ ràng
    const [errors, setErrors] = useState<Errors>({});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [checkingEmail, setCheckingEmail] = useState(false);
    const [generalError, setGeneralError] = useState("");

    // Google Sign-In
    useEffect(() => {
        const initGoogle = () => {
            if (!window.google?.accounts?.id) return;

            window.google.accounts.id.initialize({
                client_id:
                    "772898465184-2lct3e00mcjggjn5tm33m95bquejphv2.apps.googleusercontent.com",
                callback: async (response: any) => {
                    try {
                        setGeneralError("");
                        const idToken = response.credential;

                        if (!idToken) {
                            setGeneralError(
                                "Không nhận được token từ Google. Vui lòng thử lại!"
                            );
                            return;
                        }

                        const res = await fetchWithFallback(
                            "/api/Auth/logingoogle",
                            {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    idToken,
                                    phoneNumber: form.phone || "",
                                }),
                            }
                        );

                        if (!res.ok) {
                            const errorMessage = await extractErrorMessage(
                                res,
                                "Không thể đăng ký/đăng nhập bằng Google. Vui lòng thử lại!"
                            );
                            setGeneralError(errorMessage);
                            return;
                        }

                        const data = await res.json();
                        const token = data?.token || data?.Token;

                        if (!token) {
                            setGeneralError("Không nhận được token từ server.");
                            return;
                        }

                        localStorage.setItem("token", token);
                        const userInfo = data.UserInfo || data.userInfo;
                        if (userInfo) {
                            localStorage.setItem(
                                "userInfo",
                                JSON.stringify(userInfo)
                            );
                        }

                        navigate("/");
                    } catch (err: any) {
                        console.error("Lỗi google", err);
                    }
                },
            });

            // Render button
            if (googleBtnRef.current) {
                googleBtnRef.current.innerHTML = "";
                window.google.accounts.id.renderButton(googleBtnRef.current, {
                    type: "standard",
                    theme: "outline",
                    size: "large",
                    text: "signup_with",
                    shape: "rectangular",
                });
            }
        };

        if (window.google?.accounts?.id) {
            initGoogle();
        } else {
            const interval = setInterval(() => {
                if (window.google?.accounts?.id) {
                    clearInterval(interval);
                    initGoogle();
                }
            }, 200);
            return () => clearInterval(interval);
        }
    }, [navigate, form.phone]);

    const handleChange = (
        e:
            | React.ChangeEvent<HTMLInputElement>
            | React.ChangeEvent<HTMLTextAreaElement>
    ) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        setForm((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
        setErrors((prev) => ({ ...prev, [name]: undefined }));
    };

    const handleEmailBlur = async () => {
        if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) return;

        setCheckingEmail(true);
        try {
            const result = await checkEmail(form.email);
            if (result.isExisting) {
                setErrors((prev) => ({
                    ...prev,
                    email: "Email này đã được sử dụng. Vui lòng chọn email khác hoặc đăng nhập.",
                }));
            } else {
                setErrors((prev) => {
                    const { email, ...rest } = prev;
                    return email?.includes("đã được sử dụng") ? rest : prev;
                });
            }
        } catch (err) {
            console.error("Check email failed:", err);
        } finally {
            setCheckingEmail(false);
        }
    };

    const validate = (): Errors => {
        const err: Errors = {};

        if (!form.email) err.email = "Email là bắt buộc";
        else if (!/\S+@\S+\.\S+/.test(form.email))
            err.email = "Email không hợp lệ";

        if (!form.password) err.password = "Mật khẩu là bắt buộc";
        else if (form.password.length < 6)
            err.password = "Mật khẩu ít nhất 6 ký tự";

        if (!form.confirm) err.confirm = "Vui lòng xác nhận mật khẩu";
        else if (form.confirm !== form.password)
            err.confirm = "Mật khẩu không khớp";

        if (!form.agree) err.agree = "Bạn cần đồng ý với điều khoản";

        return err;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const validationErrors = validate();

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setLoading(true);
        setErrors({});

        try {
            // Kiểm tra email trùng
            const emailCheck = await checkEmail(form.email);
            if (emailCheck.isExisting) {
                setErrors({ email: "Email này đã được sử dụng." });
                setLoading(false);
                return;
            }

            // Gửi OTP
            await requestOtpForRegister(form.email, form.phone || "");

            // Lưu tạm dữ liệu đăng ký
            localStorage.setItem(
                "pendingRegistration",
                JSON.stringify({
                    userEmail: form.email,
                    password: form.password,
                    fullName: form.name,
                    phone: form.phone || "",
                })
            );

            navigate(
                `/otp-verification?email=${encodeURIComponent(form.email)}&type=register`
            );
        } catch (error: any) {
            // Bỏ qua lỗi mạng khi dev
            if (
                error.message?.includes("fetch") ||
                error.message?.includes("network")
            ) {
                console.warn("Network error ignored → continue to OTP");
                navigate(
                    `/otp-verification?email=${encodeURIComponent(form.email)}&type=register`
                );
                return;
            }

            setErrors({
                submit:
                    error.message || "Không thể gửi mã OTP. Vui lòng thử lại.",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="public-component-container w-full">
            <div className="w-full flex justify-center py-8 ">
                <div className="reg-container w-full max-w-[1232px] grid grid-cols-1 lg:grid-cols-[500px_1fr]">
                    <div className="hidden lg:flex flex-col items-center justify-center bg-[#ede8df] p-12 w-full">
                        <img
                            src="/img/logo.png"
                            alt="Logo"
                            className="max-w-full h-auto"
                        />
                    </div>
                    <div className="reg-card flex flex-col justify-center px-6 lg:px-12 w-full">
                        <h3 className="text-3xl font-bold text-center mb-8">
                            Đăng ký tài khoản
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Các field như cũ, chỉ sửa một số class lỗi */}
                            <div className="form-group">
                                <label
                                    htmlFor="name"
                                    className="block font-medium"
                                >
                                    Họ và tên
                                </label>
                                <div className="input-wrapper mt-1">
                                    <input
                                        id="name"
                                        name="name"
                                        placeholder="Nhập họ và tên"
                                        value={form.name}
                                        onChange={handleChange}
                                        className={errors.name ? "error" : ""}
                                    />
                                </div>
                                {errors.name && (
                                    <span className="error-message">
                                        {errors.name}
                                    </span>
                                )}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="form-group">
                                    <label
                                        htmlFor="email"
                                        className="block font-medium"
                                    >
                                        Email{" "}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <div className="input-wrapper mt-1 relative">
                                        <input
                                            id="email"
                                            name="email"
                                            type="email"
                                            placeholder="nhập email"
                                            value={form.email}
                                            onChange={handleChange}
                                            onBlur={handleEmailBlur}
                                            disabled={checkingEmail}
                                            className={
                                                errors.email ? "error" : ""
                                            }
                                        />
                                        {checkingEmail && (
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                                                Đang kiểm tra...
                                            </span>
                                        )}
                                    </div>
                                    {errors.email && (
                                        <span className="error-message">
                                            {errors.email}
                                        </span>
                                    )}
                                </div>
                                <div className="form-group">
                                    <label
                                        htmlFor="phone"
                                        className="block font-medium"
                                    >
                                        Số điện thoại (tùy chọn)
                                    </label>
                                    <div className="input-wrapper mt-1">
                                        <input
                                            id="phone"
                                            name="phone"
                                            type="tel"
                                            placeholder="Nhập số điện thoại"
                                            value={form.phone}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                            </div>
                            {/* Password fields */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="form-group">
                                    <label
                                        htmlFor="password"
                                        className="block font-medium"
                                    >
                                        Mật khẩu{" "}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <div className="input-wrapper with-toggle mt-1">
                                        <input
                                            id="password"
                                            name="password"
                                            type={
                                                showPassword
                                                    ? "text"
                                                    : "password"
                                            }
                                            placeholder="Tạo mật khẩu mạnh"
                                            value={form.password}
                                            onChange={handleChange}
                                            className={
                                                errors.password ? "error" : ""
                                            }
                                        />
                                        <span
                                            className="toggle-icon"
                                            onClick={() =>
                                                setShowPassword(!showPassword)
                                            }
                                            role="button"
                                            tabIndex={0}
                                        >
                                            {showPassword ? "Hide" : "Show"}
                                        </span>
                                    </div>
                                    {errors.password && (
                                        <span className="error-message">
                                            {errors.password}
                                        </span>
                                    )}
                                </div>
                                <div className="form-group">
                                    <label
                                        htmlFor="confirm"
                                        className="block font-medium"
                                    >
                                        Xác nhận mật khẩu{" "}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <div className="input-wrapper with-toggle mt-1">
                                        <input
                                            id="confirm"
                                            name="confirm"
                                            type={
                                                showConfirm
                                                    ? "text"
                                                    : "password"
                                            }
                                            placeholder="Nhập lại mật khẩu"
                                            value={form.confirm}
                                            onChange={handleChange}
                                            className={
                                                errors.confirm ? "error" : ""
                                            }
                                        />
                                        <span
                                            className="toggle-icon"
                                            onClick={() =>
                                                setShowConfirm(!showConfirm)
                                            }
                                            role="button"
                                            tabIndex={0}
                                        >
                                            {showConfirm ? "Hide" : "Show"}
                                        </span>
                                    </div>
                                    {errors.confirm && (
                                        <span className="error-message">
                                            {errors.confirm}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    name="agree"
                                    id="agree"
                                    checked={form.agree}
                                    onChange={handleChange}
                                    className="h-4 w-4"
                                />
                                <label htmlFor="agree" className="ml-2 text-sm">
                                    Tôi đồng ý với{" "}
                                    <a href="#" className="text-blue-600">
                                        Điều khoản sử dụng
                                    </a>{" "}
                                    và{" "}
                                    <a href="#" className="text-blue-600">
                                        Chính sách bảo mật
                                    </a>
                                </label>
                            </div>
                            {errors.agree && (
                                <span className="error-message block">
                                    {errors.agree}
                                </span>
                            )}
                            {errors.submit && (
                                <div className="text-red-600 text-center font-medium">
                                    {errors.submit}
                                </div>
                            )}
                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full py-4 mt-6 rounded-lg text-white font-semibold transition ${
                                    loading
                                        ? "bg-gray-400"
                                        : "bg-blue-600 hover:bg-blue-700"
                                }`}
                            >
                                {loading ? "Đang gửi mã OTP..." : "Đăng ký"}
                            </button>
                        </form>
                        <div className="my-6 text-center text-gray-500">
                            HOẶC
                        </div>
                        {generalError && (
                            <div className="text-red-600 text-center mb-4">
                                {generalError}
                            </div>
                        )}
                        <div
                            ref={googleBtnRef}
                            className="flex justify-center"
                        ></div>
                        <p className="text-center mt-8 text-sm">
                            Đã có tài khoản?{" "}
                            <a
                                href="/login"
                                className="text-blue-600 font-medium"
                            >
                                Đăng nhập ngay
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
