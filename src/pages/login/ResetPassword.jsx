import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

export default function ResetPassword() {
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: ""
  });
  const [showPassword, setShowPassword] = useState({
    newPassword: false,
    confirmPassword: false
  });
  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPassword(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const validatePassword = (password) => {
    const minLength = 6;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return {
      isValid: password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers,
      errors: {
        length: password.length < minLength ? `Mật khẩu phải có ít nhất ${minLength} ký tự` : null,
        uppercase: !hasUpperCase ? "Mật khẩu phải có ít nhất 1 chữ hoa" : null,
        lowercase: !hasLowerCase ? "Mật khẩu phải có ít nhất 1 chữ thường" : null,
        numbers: !hasNumbers ? "Mật khẩu phải có ít nhất 1 số" : null,
      }
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    // Validate password
    const passwordValidation = validatePassword(formData.newPassword);
    if (!passwordValidation.isValid) {
      setMessage({
        type: "error",
        text: "Mật khẩu không đáp ứng yêu cầu bảo mật!",
      });
      setIsLoading(false);
      return;
    }

    // Check if passwords match
    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({
        type: "error",
        text: "Mật khẩu xác nhận không khớp!",
      });
      setIsLoading(false);
      return;
    }

    // Giả lập API call (thay thế bằng API call thực tế)
    setTimeout(() => {
      setMessage({
        type: "success",
        text: "Đặt lại mật khẩu thành công! Bạn có thể đăng nhập với mật khẩu mới.",
      });
      
      // Chuyển về trang login sau 2 giây
      setTimeout(() => {
        navigate("/login-student");
      }, 2000);
      
      setIsLoading(false);
    }, 1500);
  };

  const handleBackToLogin = () => {
    navigate("/login-student");
  };

  const passwordValidation = validatePassword(formData.newPassword);

  return (
    <div className="kids-space">
      <div
        className="page-wrapper"
        id="main-wrapper"
        data-layout="vertical"
        data-navbarbg="skin6"
        data-sidebartype="full"
        data-sidebar-position="fixed"
        data-header-position="fixed">
        <div className="position-relative overflow-hidden min-vh-100 d-flex align-items-center justify-content-center">
          <div className="d-flex align-items-center justify-content-center w-100">
            <div className="row justify-content-center w-100">
              <div className="col-md-8 col-lg-6 col-xxl-3">
                <div className="card mb-0 kids-card">
                  <div className="card-body">
                    <h5 className="text-center kids-heading mb-1">
                      Đặt lại mật khẩu
                    </h5>
                    <p className="text-center kids-subtitle mb-4">
                      Nhập mật khẩu mới của bạn
                    </p>
                    <form onSubmit={handleSubmit}>
                      <div className="mb-3">
                        <label htmlFor="newPassword" className="form-label">
                          Mật khẩu mới
                        </label>
                        <div className="input-group">
                          <span className="input-group-text">
                            <svg
                              className="ti ti-lock"
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round">
                              <rect
                                x="3"
                                y="11"
                                width="18"
                                height="11"
                                rx="2"
                                ry="2"></rect>
                              <circle cx="12" cy="16" r="1"></circle>
                              <path d="m7 11V7a5 5 0 0 1 10 0v4"></path>
                            </svg>
                          </span>
                          <input
                            type={showPassword.newPassword ? "text" : "password"}
                            className="form-control"
                            id="newPassword"
                            placeholder="Nhập mật khẩu mới..."
                            value={formData.newPassword}
                            onChange={(e) => handleInputChange("newPassword", e.target.value)}
                            required
                          />
                          <button
                            type="button"
                            className="input-group-text"
                            onClick={() => togglePasswordVisibility("newPassword")}
                            style={{ cursor: "pointer", borderLeft: "0" }}>
                            <svg
                              className="ti"
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round">
                              {showPassword.newPassword ? (
                                <>
                                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                                  <line x1="1" y1="1" x2="23" y2="23"/>
                                </>
                              ) : (
                                <>
                                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                  <circle cx="12" cy="12" r="3"/>
                                </>
                              )}
                            </svg>
                          </button>
                        </div>
                        
                        {/* Password requirements */}
                        {formData.newPassword && (
                          <div className="mt-2" style={{ fontSize: "0.8rem" }}>
                            <div className={`mb-1 ${passwordValidation.errors.length ? "text-danger" : "text-success"}`}>
                              • {passwordValidation.errors.length || "✓ Độ dài tối thiểu 6 ký tự"}
                            </div>
                            <div className={`mb-1 ${passwordValidation.errors.uppercase ? "text-danger" : "text-success"}`}>
                              • {passwordValidation.errors.uppercase || "✓ Có ít nhất 1 chữ hoa"}
                            </div>
                            <div className={`mb-1 ${passwordValidation.errors.lowercase ? "text-danger" : "text-success"}`}>
                              • {passwordValidation.errors.lowercase || "✓ Có ít nhất 1 chữ thường"}
                            </div>
                            <div className={`mb-1 ${passwordValidation.errors.numbers ? "text-danger" : "text-success"}`}>
                              • {passwordValidation.errors.numbers || "✓ Có ít nhất 1 số"}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="mb-4">
                        <label htmlFor="confirmPassword" className="form-label">
                          Xác nhận mật khẩu
                        </label>
                        <div className="input-group">
                          <span className="input-group-text">
                            <svg
                              className="ti ti-lock-check"
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round">
                              <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                              <path d="m7 11V7a5 5 0 0 1 9.9-1"/>
                              <path d="m8 15 2 2 4-4"/>
                            </svg>
                          </span>
                          <input
                            type={showPassword.confirmPassword ? "text" : "password"}
                            className="form-control"
                            id="confirmPassword"
                            placeholder="Nhập lại mật khẩu mới..."
                            value={formData.confirmPassword}
                            onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                            required
                          />
                          <button
                            type="button"
                            className="input-group-text"
                            onClick={() => togglePasswordVisibility("confirmPassword")}
                            style={{ cursor: "pointer", borderLeft: "0" }}>
                            <svg
                              className="ti"
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round">
                              {showPassword.confirmPassword ? (
                                <>
                                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                                  <line x1="1" y1="1" x2="23" y2="23"/>
                                </>
                              ) : (
                                <>
                                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                  <circle cx="12" cy="12" r="3"/>
                                </>
                              )}
                            </svg>
                          </button>
                        </div>
                        
                        {/* Password match indicator */}
                        {formData.confirmPassword && (
                          <div className="mt-2" style={{ fontSize: "0.8rem" }}>
                            <div className={`mb-1 ${formData.newPassword === formData.confirmPassword ? "text-success" : "text-danger"}`}>
                              • {formData.newPassword === formData.confirmPassword ? "✓ Mật khẩu khớp" : "✗ Mật khẩu không khớp"}
                            </div>
                          </div>
                        )}
                      </div>

                      {message && (
                        <div
                          className={`mb-4 p-3 rounded-3 ${
                            message.type === "success" 
                              ? "alert-success" 
                              : "alert-danger"
                          }`}
                          style={{
                            backgroundColor: message.type === "success" ? "#dcfce7" : "#fee2e2",
                            color: message.type === "success" ? "#166534" : "#991b1b",
                            border: "none"
                          }}>
                          {message.text}
                        </div>
                      )}

                      <div className="text-center mb-4">
                        <button
                          type="submit"
                          className="btn btn-space w-90 mb-3 rounded-3"
                          style={{ color: "white" }}
                          disabled={isLoading || !passwordValidation.isValid || formData.newPassword !== formData.confirmPassword}>
                          {isLoading ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
                        </button>
                      </div>

                      <div className="text-center">
                        <a
                          className="fw-bold forgot-password"
                          onClick={handleBackToLogin}
                          style={{ cursor: "pointer" }}>
                          Quay lại đăng nhập
                        </a>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Background elements from Login */}
          <img className="rocket-bg" src="img/astro.png" alt="rocket" />

          <svg
            className="planet"
            viewBox="0 0 120 120"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true">
            <defs>
              <linearGradient id="pGrad" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stopColor="#ff7ad9" />
                <stop offset="100%" stopColor="#ffd36e" />
              </linearGradient>
            </defs>
            <circle cx="60" cy="60" r="34" fill="url(#pGrad)" />
            <ellipse
              cx="60"
              cy="70"
              rx="54"
              ry="14"
              fill="none"
              stroke="#ffe8a3"
              strokeWidth="6"
            />
            <ellipse
              cx="60"
              cy="70"
              rx="54"
              ry="14"
              fill="none"
              stroke="#ffb3e6"
              strokeWidth="3"
            />
          </svg>

          <div className="twinkle" aria-hidden="true">
            <span className="star star-1"></span>
            <span className="star star-2"></span>
            <span className="star star-3"></span>
            <span className="star star-4"></span>
            <span className="star star-5"></span>
            <span className="star star-6"></span>
            <span className="star star-7"></span>
            <span className="star star-8"></span>
            <span className="star star-9"></span>
            <span className="star star-10"></span>
            <span className="star star-11"></span>
            <span className="star star-12"></span>
            <span className="star star-13"></span>
            <span className="star star-14"></span>
            <span className="star star-15"></span>
            <span className="star star-16"></span>
            <span className="star star-17"></span>
            <span className="star star-18"></span>
          </div>

          <svg
            className="moon"
            viewBox="0 0 100 100"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true">
            <defs>
              <linearGradient id="mGrad" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stopColor="#d9e6ff" />
                <stop offset="100%" stopColor="#ffffff" />
              </linearGradient>
            </defs>
            <circle
              cx="50"
              cy="50"
              r="30"
              fill="url(#mGrad)"
              stroke="#e5e8ff"
            />
            <circle cx="62" cy="40" r="5" fill="#ccd6ff" />
            <circle cx="42" cy="58" r="6" fill="#ccd6ff" />
            <circle cx="56" cy="64" r="3" fill="#ccd6ff" />
          </svg>
        </div>
      </div>
    </div>
  );
}
