import React, { useRef, useState } from 'react';
import { toast } from 'react-toastify';
import ThemedHeader from '../../component/ThemedHeader';
import './Profile.css';

export default function Profile() {
  // Password visibility state
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const lastNameRef = useRef();
  const firstNameRef = useRef();
  const emailRef = useRef();
  const birthDateRef = useRef();
  const newPasswordRef = useRef();
  const confirmPasswordRef = useRef();

  function validateName(name) {
    // Only letters (including Vietnamese), spaces, at least 2 chars
    return /^[A-Za-zÀ-ỹà-ỹ\s]{2,}$/u.test(name);
  }

  function validateEmail(email) {
    // Simple email regex
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function isFutureDate(dateStr) {
    if (!dateStr) return false;
    const today = new Date();
    today.setHours(0,0,0,0);
    const inputDate = new Date(dateStr);
    return inputDate > today;
  }

  const handleUpdate = (e) => {
    e.preventDefault();
    const lastName = lastNameRef.current.value.trim();
    const firstName = firstNameRef.current.value.trim();
    const email = emailRef.current.value.trim();
    const birthDate = birthDateRef.current.value;

    if (!lastName || !firstName || !email || !birthDate) {
      toast.error('Fields cannot be empty!');
      return;
    }
    if (!validateName(lastName)) {
      toast.error('Last name must be at least 2 letters, no numbers or special characters!');
      return;
    }
    if (!validateName(firstName)) {
      toast.error('First name must be at least 2 letters, no numbers or special characters!');
      return;
    }
    if (!validateEmail(email)) {
      toast.error('Invalid email format!');
      return;
    }
    if (isFutureDate(birthDate)) {
      toast.error('Date of birth cannot be in the future!');
      return;
    }
    toast.success('Profile updated successfully!');
    // ...submit logic here
  };

  // Password change handler
  const handleChangePassword = (e) => {
    e.preventDefault();
    const newPassword = newPasswordRef.current.value;
    const confirmPassword = confirmPasswordRef.current.value;
    if (!newPassword || !confirmPassword) {
      toast.error('Password fields cannot be empty!');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New Password and Confirm New Password do not match!');
      return;
    }
    toast.success('Password changed successfully!');
    // ...submit logic here
  };

  return (
    <div className="profile-container">
      <ThemedHeader />
      <div className="main-layout">
       
        <div className="content-area">
          <div className="profile-content">
            <div className="profile-cards">
                  {/* Personal Information Card */}
                  <div className="profile-card personal-info-card">
                    <div className="card-header">
                      <h3
                        style={{
                          fontWeight: 700,
                          fontSize: '1.5rem',
                          letterSpacing: '0.5px',
                          margin: 0,
                          background: 'linear-gradient(90deg, #5e17eb 0%, #4dd0ff 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text',
                          textFillColor: 'transparent'
                        }}
                      >
                        Personal Information
                      </h3>
                      <i className="ti ti-user"></i>
                    </div>
                    <div className="card-content">
                      <div className="profile-info-layout">
                        {/* Left side - Profile Picture and Name */}
                        <div className="profile-left">
                          <div className="profile-picture-container">
                            <div className="profile-picture-placeholder">
                              <img src="/img/avatar_1.png" alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                            </div>
                          </div>
                          <div className="profile-name-section">
                            <h4 className="profile-full-name">Nguyen Duc Anh</h4>
                            <p className="profile-role">Student</p>
                            <p className="profile-class" style={{ fontSize: '1rem', color: '#4dd0ff', fontWeight: 600, margin: 0 }}>Class: Rising Star 1</p>
                          
                          </div>
                        </div>
                        {/* Right side - Form Fields */}
                        <div className="profile-right">
                          <div className="form-group">
                            <label htmlFor="lastName">Last Name</label>
                            <input 
                              type="text" 
                              id="lastName" 
                              className="form-input" 
                              defaultValue="Nguyen Duc"
                              ref={lastNameRef}
                            />
                          </div>
                          <div className="form-group">
                            <label htmlFor="firstName">First Name</label>
                            <input 
                              type="text" 
                              id="firstName" 
                              className="form-input" 
                              defaultValue="Anh"
                              ref={firstNameRef}
                            />
                          </div>
                          <div className="form-group">
                            <label htmlFor="email">Email</label>
                            <input 
                              type="email" 
                              id="email" 
                              className="form-input" 
                              defaultValue="email"
                              ref={emailRef}
                            />
                          </div>
                          <div className="form-group">
                            <label>Gender</label>
                            <div className="radio-group">
                              <label className="radio-label">
                                <input type="radio" name="gender" value="male" defaultChecked />
                                <span className="radio-custom"></span>
                                Male
                              </label>
                              <label className="radio-label">
                                <input type="radio" name="gender" value="female" />
                                <span className="radio-custom"></span>
                                Female
                              </label>
                            </div>
                          </div>
                          <div className="form-group">
                            <label htmlFor="birthDate">Date of Birth</label>
                            <div className="date-input-container">
                              <input 
                                type="date" 
                                id="birthDate" 
                                className="form-input" 
                                defaultValue="2003-05-16"
                                ref={birthDateRef}
                              />
                              <i className="ti ti-calendar date-icon"></i>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="form-actions">
                        <button className="btn btn-secondary">Back</button>
                        <button className="btn btn-primary" onClick={handleUpdate}>Update</button>
                      </div>
                    </div>
                  </div>
                  {/* Change Password Card */}
                  <div className="profile-card password-card">
                    <div className="card-header">
                      <h3
                        style={{
                          fontWeight: 700,
                          fontSize: '1.5rem',
                          letterSpacing: '0.5px',
                          margin: 0,
                          background: 'linear-gradient(90deg, #5e17eb 0%, #4dd0ff 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text',
                          textFillColor: 'transparent'
                        }}
                      >
                        Change Password
                      </h3>
                      <i className="ti ti-lock"></i>
                    </div>
                    <div className="card-content">
                      <div className="password-form">
                        <div className="form-group">
                          <label htmlFor="currentPassword">Current Password</label>
                          <div className="password-input-container">
                            <input 
                              type={showCurrentPassword ? "text" : "password"}
                              id="currentPassword" 
                              className="form-input" 
                              placeholder="Enter current password"
                            />
                            <span 
                              className="password-toggle"
                              onClick={() => setShowCurrentPassword(v => !v)}
                              style={{ cursor: 'pointer', position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)' }}
                              aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
                            >
                              {showCurrentPassword ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.06 10.06 0 0 1 12 20c-5 0-9.27-3.11-11-8 1.09-2.86 3.05-5.13 5.66-6.44"/><path d="M1 1l22 22"/><path d="M9.53 9.53A3.5 3.5 0 0 0 12 15.5c1.93 0 3.5-1.57 3.5-3.5a3.5 3.5 0 0 0-5.97-2.47"/></svg>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="12" rx="10" ry="7"/><circle cx="12" cy="12" r="3"/></svg>
                              )}
                            </span>
                          </div>
                        </div>
                        <div className="form-group">
                          <label htmlFor="newPassword">New Password</label>
                          <div className="password-input-container">
                            <input 
                              type={showNewPassword ? "text" : "password"}
                              id="newPassword" 
                              className="form-input" 
                              placeholder="Enter new password"
                              ref={newPasswordRef}
                            />
                            <span 
                              className="password-toggle"
                              onClick={() => setShowNewPassword(v => !v)}
                              style={{ cursor: 'pointer', position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)' }}
                              aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                            >
                              {showNewPassword ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.06 10.06 0 0 1 12 20c-5 0-9.27-3.11-11-8 1.09-2.86 3.05-5.13 5.66-6.44"/><path d="M1 1l22 22"/><path d="M9.53 9.53A3.5 3.5 0 0 0 12 15.5c1.93 0 3.5-1.57 3.5-3.5a3.5 3.5 0 0 0-5.97-2.47"/></svg>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="12" rx="10" ry="7"/><circle cx="12" cy="12" r="3"/></svg>
                              )}
                            </span>
                          </div>
                          {/* <div className="password-strength">
                            <div className="password-strength-bar"></div>
                          </div> */}
                        </div>
                        <div className="form-group">
                          <label htmlFor="confirmPassword">Confirm New Password</label>
                          <div className="password-input-container">
                            <input 
                              type={showConfirmPassword ? "text" : "password"}
                              id="confirmPassword" 
                              className="form-input" 
                              placeholder="Re-enter new password"
                              ref={confirmPasswordRef}
                            />
                            <span 
                              className="password-toggle"
                              onClick={() => setShowConfirmPassword(v => !v)}
                              style={{ cursor: 'pointer', position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)' }}
                              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                            >
                              {showConfirmPassword ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.06 10.06 0 0 1 12 20c-5 0-9.27-3.11-11-8 1.09-2.86 3.05-5.13 5.66-6.44"/><path d="M1 1l22 22"/><path d="M9.53 9.53A3.5 3.5 0 0 0 12 15.5c1.93 0 3.5-1.57 3.5-3.5a3.5 3.5 0 0 0-5.97-2.47"/></svg>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="12" rx="10" ry="7"/><circle cx="12" cy="12" r="3"/></svg>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="form-actions">
                        <button className="btn btn-secondary">Cancel</button>
                        <button className="btn btn-primary" onClick={handleChangePassword}>Change Password</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
                        <div className="password-strength-bar"></div>
