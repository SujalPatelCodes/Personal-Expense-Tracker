import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  User, Mail, Shield, CheckCircle, Plus, 
  Smartphone, Globe, Lock, AlertCircle, 
  Edit3, Camera, Moon, Sun, Trash2, Key, LogOut
} from 'lucide-react';
import { supabase } from '../supabase';
import './ProfilePage.css';

export default function ProfilePage() {
  const { user, updateName, linkAccount, deleteAccount, logout, updatePassword, changePassword } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [newName, setNewName] = useState(user?.name || '');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleUpdateName = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });
    const result = await updateName(newName);
    setLoading(false);
    if (result.success) {
      setMessage({ type: 'success', text: 'Name updated successfully!' });
      setIsEditing(false);
    } else {
      setMessage({ type: 'error', text: result.message });
    }
  };

  const handleLink = async (providerId) => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    const result = await linkAccount(providerId);
    setLoading(false);
    if (result.success) {
      setMessage({ type: 'success', text: `Successfully connected ${providerId}!` });
    } else {
      setMessage({ type: 'error', text: result.message });
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });
    
    const result = await changePassword(oldPassword, newPassword);
    
    setLoading(false);
    if (result.success) {
      setMessage({ type: 'success', text: 'Password updated successfully!' });
      setIsChangingPassword(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setMessage({ type: 'error', text: result.message });
    }
  };

  const isProviderLinked = (id) => {
    const providerMap = {
      'google.com': 'google',
      'microsoft.com': 'azure',
      'apple.com': 'apple'
    };
    return user?.providers?.includes(providerMap[id] || id);
  };

  return (
    <div className="profile-page animate-fadeIn" id="profile-page">
      <div className="profile-header">
        <div className="container">
          <div className="header-flex">
            <div>
              <h1 className="profile-title">Account <span className="accent-text">Settings</span></h1>
              <p className="profile-subtitle">Manage your personal information and preferences.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container profile-content">
        <div className="profile-grid">
          {/* Main Profile Info */}
          <div className="profile-card main-info-card glass-card">
            <div className="profile-avatar-section">
              <div className="profile-avatar-wrapper">
                <div className="profile-avatar">
                  {user?.photo ? <img src={user.photo} alt="Profile" /> : user?.name?.charAt(0).toUpperCase()}
                </div>
                <button className="avatar-edit-btn" title="Change Avatar">
                  <Camera size={16} />
                </button>
              </div>
              <div className="profile-header-details">
                <h2>{user?.name}</h2>
                <p className="user-email-meta"><Mail size={14} /> {user?.email}</p>
              </div>
            </div>

            <div className="profile-sections">
              <div className="info-row">
                <div className="info-label">
                  <User size={18} />
                  <span>Display Name</span>
                </div>
                <div className="info-action">
                  {isEditing ? (
                    <form onSubmit={handleUpdateName} className="inline-edit-form">
                      <input 
                        type="text" 
                        value={newName} 
                        onChange={(e) => setNewName(e.target.value)}
                        className="input-field input-sm"
                        autoFocus
                      />
                      <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>Save</button>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsEditing(false)}>Cancel</button>
                    </form>
                  ) : (
                    <div className="display-value">
                      <span>{user?.name}</span>
                      <button className="btn-icon-sm" onClick={() => setIsEditing(true)}><Edit3 size={14} /></button>
                    </div>
                  )}
                </div>
              </div>

              <div className="info-row">
                <div className="info-label">
                  <Mail size={18} />
                  <span>Email Address</span>
                </div>
                <div className="info-action">
                  <span className="static-value">{user?.email}</span>
                  <Shield size={14} className="verified-badge" title="Verified" />
                </div>
              </div>

              <div className="info-row">
                <div className="info-label">
                  {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
                  <span>Appearance</span>
                </div>
                <div className="info-action">
                  <button className="btn btn-secondary btn-sm" onClick={toggleTheme}>
                    Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode
                  </button>
                </div>
              </div>
            </div>

            {message.text && (
              <div className={`status-message ${message.type} animate-fadeIn`}>
                {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                {message.text}
              </div>
            )}
          </div>

          {/* Social Connections */}
          <div className="profile-card glass-card">
            <div className="card-header-simple">
              <Globe size={20} className="accent-text" />
              <h3>Linked Accounts</h3>
            </div>
            <p className="card-desc">Login easily using these providers</p>

            <div className="social-links-list">
              <div className="social-item">
                <div className="social-info">
                  <div className="social-icon google">
                    <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                  </div>
                  <span>Google</span>
                </div>
                {isProviderLinked('google.com') ? (
                  <span className="linked-status"><CheckCircle size={14} /> Linked</span>
                ) : (
                  <button className="btn btn-secondary-outline btn-xs" onClick={() => handleLink('google.com')} disabled={loading}>Connect</button>
                )}
              </div>

              <div className="social-item">
                <div className="social-info">
                  <div className="social-icon microsoft">
                    <svg viewBox="0 0 23 23" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                      <path fill="#f35325" d="M1 1h10v10H1z"/><path fill="#81bc06" d="M12 1h10v10H12z"/><path fill="#05a6f0" d="M1 12h10v10H1z"/><path fill="#ffba08" d="M12 12h10v10H12z"/>
                    </svg>
                  </div>
                  <span>Microsoft</span>
                </div>
                {isProviderLinked('microsoft.com') ? (
                  <span className="linked-status"><CheckCircle size={14} /> Linked</span>
                ) : (
                  <button className="btn btn-secondary-outline btn-xs" onClick={() => handleLink('microsoft.com')} disabled={loading}>Connect</button>
                )}
              </div>

              <div className="social-item">
                <div className="social-info">
                  <div className="social-icon apple">
                    <Smartphone size={16} />
                  </div>
                  <span>Apple ID</span>
                </div>
                {isProviderLinked('apple.com') ? (
                  <span className="linked-status"><CheckCircle size={14} /> Linked</span>
                ) : (
                  <button className="btn btn-secondary-outline btn-xs" onClick={() => handleLink('apple.com')} disabled={loading}>Connect</button>
                )}
              </div>
            </div>
          </div>

          {/* Security & Data Management */}
          <div className="profile-card glass-card">
            <div className="card-header-simple">
              <Shield size={20} className="accent-text" />
              <h3>Security & Account</h3>
            </div>
            <p className="card-desc">Protect your account and manage your data</p>
            
            <div className="security-actions">
              {isChangingPassword ? (
                <form onSubmit={handleUpdatePassword} className="password-form" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div className="form-group-custom">
                    <label className="input-label-sm">Current Password</label>
                    <input
                      type="password"
                      placeholder="Enter current password"
                      className="input-field"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group-custom">
                    <label className="input-label-sm">New Password</label>
                    <input
                      type="password"
                      placeholder="Enter new password"
                      className="input-field"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group-custom">
                    <label className="input-label-sm">Confirm New Password</label>
                    <input
                      type="password"
                      placeholder="Confirm new password"
                      className="input-field"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="password-form-actions" style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                    <button type="submit" className="btn btn-primary btn-sm" disabled={loading} style={{ flex: 1 }}>Update Password</button>
                    <button type="button" className="btn btn-secondary-soft btn-sm" onClick={() => { setIsChangingPassword(false); setOldPassword(''); setNewPassword(''); setConfirmPassword(''); }} style={{ flex: 1 }}>Cancel</button>
                  </div>
                </form>
              ) : (
                <button className="btn btn-secondary-soft btn-full" onClick={() => { setIsChangingPassword(true); setMessage({ type: '', text: '' }); }}>
                  <Key size={16} /> Change Password
                </button>
              )}
              
              <button className="btn btn-secondary-soft btn-full" onClick={logout}>
                <LogOut size={16} /> Logout from Session
              </button>

              <div className="danger-zone">
                <h4>Danger Zone</h4>
                <p>Permanently delete your account and all associated data.</p>
                <button 
                  className="btn btn-danger-soft btn-full" 
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 size={16} /> Delete My Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '20px' }}>
          <div className="modal glass-card animate-fadeInUp" style={{ maxWidth: '400px', textAlign: 'center', padding: '32px', background: 'var(--bg-glass)', borderRadius: 'var(--radius-xl)' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header" style={{ justifyContent: 'center', marginBottom: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--danger-soft)', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                <Trash2 size={24} />
              </div>
            </div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Confirm Account Deletion</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
              Are you sure you want to delete your account? This action will permanently wipe all your data and cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={() => setShowDeleteConfirm(false)} style={{ flex: 1 }}>
                Cancel
              </button>
              <button 
                className="btn btn-danger" 
                style={{ flex: 1 }}
                onClick={() => {
                  setShowDeleteConfirm(false);
                  deleteAccount();
                }}
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
