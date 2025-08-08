import React, { useState } from 'react';
import './LoginPage.css';

/**
 * Simple Login Page Component
 * 
 * Features:
 * - Username and password input fields
 * - Any credentials are accepted (no authentication)
 * - Enter key support for quick login
 * - Responsive design matching the chat interface
 * - Smooth transition to main app after login
 */
const LoginPage = ({ onLogin }) => {
  // ================================
  // STATE MANAGEMENT
  // ================================
  
  // Form input states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // ================================
  // EVENT HANDLERS
  // ================================

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation - require both fields
    if (!username.trim() || !password.trim()) {
      alert('Please enter both username and password');
      return;
    }

    setIsLoading(true);
    
    // Simulate a brief loading period for better UX
    setTimeout(() => {
      setIsLoading(false);
      // Call the onLogin callback to switch to main app
      onLogin(username.trim());
    }, 800);
  };

  // Handle Enter key press in form fields
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  // ================================
  // COMPONENT RENDER
  // ================================

  return (
    <div className="login-container">
      {/* Background decoration */}
      <div className="login-background">
        <div className="floating-element">🤖</div>
        <div className="floating-element">💬</div>
        <div className="floating-element">🚀</div>
        <div className="floating-element">✨</div>
      </div>

      {/* Main login card */}
      <div className="login-card">
        {/* Header section */}
        <div className="login-header">
          <div className="login-icon">🤖</div>
          <h1 className="login-title">AI Assistant</h1>
          <p className="login-subtitle">Your Multimodal AI Companion</p>
        </div>

        {/* Login form */}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username" className="form-label">
              👤 Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter your username"
              className="form-input"
              disabled={isLoading}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              🔒 Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter your password"
              className="form-input"
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            className="login-button"
            disabled={isLoading || !username.trim() || !password.trim()}
          >
            {isLoading ? (
              <>
                <span className="loading-spinner"></span>
                Signing In...
              </>
            ) : (
              <>
                🚀 Enter Chat
              </>
            )}
          </button>
        </form>

        {/* Footer with feature highlights */}
        <div className="login-footer">
          <p className="login-features">
            🖼️ Image Analysis • 📄 Document Summary • 🎵 Audio Transcription • 🌐 URL Research
          </p>
          <p className="login-note">
            <em>Note: Any username and password combination works!</em>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
