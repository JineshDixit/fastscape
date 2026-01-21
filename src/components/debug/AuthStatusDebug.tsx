import React, { useState, useEffect } from 'react';
import { authCookies } from '@/utils/cookies';
import { authService } from '@/api/services/auth';
import { useAuthContext } from '@/context/authContext';

const AuthStatusDebug: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const { isAuthenticated: contextAuth, user } = useAuthContext();

  const updateDebugInfo = () => {
    const cookieAuth = authCookies.isAuthenticated();
    const tokenInfo = authService.getTokenInfo();
    const accessToken = authCookies.getAccessToken();
    const refreshToken = authCookies.getRefreshToken();
    
    setDebugInfo({
      contextAuthenticated: contextAuth,
      cookieAuthenticated: cookieAuth,
      hasUser: !!user,
      tokenInfo,
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      accessTokenPreview: accessToken ? accessToken.substring(0, 20) + '...' : null,
      refreshTokenPreview: refreshToken ? refreshToken.substring(0, 20) + '...' : null,
      timestamp: new Date().toLocaleTimeString()
    });
  };

  useEffect(() => {
    updateDebugInfo();
    const interval = setInterval(updateDebugInfo, 5000);
    return () => clearInterval(interval);
  }, [contextAuth, user]);

  const testProfileCall = async () => {
    try {
      const response = await authService.getProfile();
      console.log('Profile call result:', response);
      alert(`Profile call: ${response.success ? 'Success' : 'Failed'}`);
    } catch (error) {
      console.error('Profile call error:', error);
      alert(`Profile call error: ${error.message}`);
    }
  };

  const clearTokens = () => {
    authService.clearTokens();
    updateDebugInfo();
  };

  if (!debugInfo) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'white',
      border: '2px solid #ccc',
      borderRadius: '8px',
      padding: '15px',
      fontSize: '12px',
      fontFamily: 'monospace',
      maxWidth: '400px',
      zIndex: 9999,
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '10px', fontSize: '14px' }}>
        🔐 Auth Debug Panel
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>Context Auth:</strong> {debugInfo.contextAuthenticated ? '✅' : '❌'}<br/>
        <strong>Cookie Auth:</strong> {debugInfo.cookieAuthenticated ? '✅' : '❌'}<br/>
        <strong>Has User:</strong> {debugInfo.hasUser ? '✅' : '❌'}<br/>
        <strong>Access Token:</strong> {debugInfo.hasAccessToken ? '✅' : '❌'}<br/>
        <strong>Refresh Token:</strong> {debugInfo.hasRefreshToken ? '✅' : '❌'}<br/>
      </div>

      <div style={{ marginBottom: '10px', fontSize: '11px' }}>
        <strong>Token Info:</strong><br/>
        <div style={{ background: '#f5f5f5', padding: '5px', borderRadius: '3px' }}>
          Access Expired: {debugInfo.tokenInfo.accessTokenExpired ? '❌' : '✅'}<br/>
          Refresh Expired: {debugInfo.tokenInfo.refreshTokenExpired ? '❌' : '✅'}<br/>
          Time Until Expiry: {debugInfo.tokenInfo.timeUntilExpiry ? Math.floor(debugInfo.tokenInfo.timeUntilExpiry / 1000) + 's' : 'N/A'}
        </div>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <button onClick={testProfileCall} style={{ marginRight: '5px', padding: '5px 10px', fontSize: '11px' }}>
          Test Profile
        </button>
        <button onClick={clearTokens} style={{ marginRight: '5px', padding: '5px 10px', fontSize: '11px' }}>
          Clear Tokens
        </button>
        <button onClick={updateDebugInfo} style={{ padding: '5px 10px', fontSize: '11px' }}>
          Refresh
        </button>
      </div>

      <div style={{ fontSize: '10px', color: '#666' }}>
        Last updated: {debugInfo.timestamp}
      </div>
    </div>
  );
};

export default AuthStatusDebug;