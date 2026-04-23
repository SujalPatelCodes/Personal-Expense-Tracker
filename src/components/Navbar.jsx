import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Sun, Moon, Menu, X, Wallet, LayoutDashboard, BarChart2, Settings, LogOut, User, ChevronDown } from 'lucide-react';
import './Navbar.css';

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setShowUserMenu(false);
    setMobileMenuOpen(false);
  };

  const handleNavigate = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
    setShowUserMenu(false);
  };

  const isActive = (path) => location.pathname === path;
  const isAppSection = location.pathname === '/dashboard' || location.pathname === '/analytics';

  return (
    <nav className="navbar" id="main-navbar">
      <div className="container navbar-inner">
        <button className="navbar-brand" onClick={() => handleNavigate('/')} id="nav-brand">
          <div className="brand-icon">
            <Wallet size={22} />
          </div>
          <span className="brand-text">TrackIt</span>
        </button>

        <div className={`navbar-links ${mobileMenuOpen ? 'open' : ''}`}>
          {(!isAppSection || isAuthenticated) && (
            <>
              <button className={`nav-link ${isActive('/') ? 'active' : ''}`} onClick={() => handleNavigate('/')}>
                Home
              </button>
              <button className={`nav-link ${isActive('/about') ? 'active' : ''}`} onClick={() => handleNavigate('/about')}>
                About
              </button>
              <button className={`nav-link ${isActive('/contact') ? 'active' : ''}`} onClick={() => handleNavigate('/contact')}>
                Contact
              </button>
            </>
          )}

          {isAuthenticated && (
            <>
              <button className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`} onClick={() => handleNavigate('/dashboard')}>
                <LayoutDashboard size={16} />
                Dashboard
              </button>
              <button className={`nav-link ${isActive('/analytics') ? 'active' : ''}`} onClick={() => handleNavigate('/analytics')}>
                <BarChart2 size={16} />
                Analytics
              </button>
            </>
          )}

          {/* Mobile-only actions */}
          <div className="mobile-nav-actions">
            <div className="dropdown-divider"></div>
            <button className="nav-link" onClick={toggleTheme}>
              {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
              <span>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
            </button>
            
            {!isAuthenticated ? (
              <button className="nav-link" onClick={() => handleNavigate('/auth')}>
                <User size={16} />
                <span>Sign In</span>
              </button>
            ) : (
              <>
                <button className="nav-link" onClick={() => handleNavigate('/profile')}>
                  <Settings size={16} />
                  <span>Settings</span>
                </button>
                <button className="nav-link logout-item" onClick={handleLogout}>
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </>
            )}
          </div>
        </div>

        <div className="navbar-actions">
          <button
            className="theme-toggle desktop-only"
            onClick={toggleTheme}
            id="theme-toggle"
            aria-label="Toggle theme"
          >
            <div className="toggle-track">
              <div className={`toggle-thumb ${theme === 'dark' ? 'dark' : ''}`}>
                {theme === 'dark' ? <Moon size={14} /> : <Sun size={14} />}
              </div>
            </div>
          </button>
          
          {!isAuthenticated ? (
            <button
              className="btn-signin-nav desktop-only"
              onClick={() => handleNavigate('/auth')}
            >
              Sign In
            </button>
          ) : (
            <div className="nav-user-section desktop-only" ref={userMenuRef}>
              <button 
                className={`nav-profile-toggle ${showUserMenu ? 'active' : ''}`}
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <div className="nav-user-avatar">
                  {user?.name?.charAt(0)?.toUpperCase()}
                </div>
                <span className="nav-user-name">{user?.name?.split(' ')[0]}</span>
                <ChevronDown size={14} className={`menu-chevron ${showUserMenu ? 'rotate' : ''}`} />
              </button>

              {showUserMenu && (
                <div className="user-dropdown-menu glass-card animate-fadeInScale">
                  <div className="dropdown-header">
                    <p className="dropdown-user-name">{user?.name}</p>
                    <p className="dropdown-user-email">{user?.email}</p>
                  </div>
                  <div className="dropdown-divider"></div>
                  <button className="dropdown-item" onClick={() => handleNavigate('/profile')}>
                    <Settings size={16} />
                    <span>Settings</span>
                  </button>
                  <button className="dropdown-item logout-item" onClick={handleLogout}>
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          )}

          <button
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && <div className="mobile-backdrop" onClick={() => setMobileMenuOpen(false)} />}
    </nav>
  );
}
