import React, { useState, useEffect } from 'react';
import { authService } from '@/api/services/auth';
import { authCookies } from '@/utils/cookies';

export const AuthDebugPanel: React.FC = () => {
  const [tokenInfo, setTokenInfo] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      const info = authService.getTokenInfo();
      setTokenInfo({
        ...info,
        currentTime: new Date().toLocaleTimeString(),
        accessToken: authCookies.getAccessToken()?.slice(0, 20) + '...',
        refreshToken: authCookies.getRefreshToken()?.slice(0, 20) + '...',
        accessExpiresAt: authCookies.getTokenExpiresAt(),
        refreshExpiresAt: authCookies.getRefreshExpiresAt(),
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          zIndex: 9999,
          background: '#007bff',
          color: 'white',
          border: 'none',
          padding: '8px 12px',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        🐞 Debug Auth
      </button>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        width: '400px',
        background: 'white',
        border: '2px solid #007bff',
        borderRadius: '8px',
        padding: '16px',
        zIndex: 9999,
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        fontFamily: 'monospace',
        fontSize: '12px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
        <h3 style={{ margin: 0 }}>🔍 Auth Debug Panel</h3>
        <button
          onClick={() => setIsVisible(false)}
          style={{
            background: '#dc3545',
            color: 'white',
            border: 'none',
            padding: '4px 8px',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          ✕
        </button>
      </div>

      {tokenInfo && (
        <div>
          <div><strong>Current Time:</strong> {tokenInfo.currentTime}</div>
          <div><strong>Has Access Token:</strong> {tokenInfo.hasAccessToken ? '✅' : '❌'}</div>
          <div><strong>Has Refresh Token:</strong> {tokenInfo.hasRefreshToken ? '✅' : '❌'}</div>
          <div><strong>Access Token Actually Expired:</strong> {
            (() => {
              if (!tokenInfo.accessExpiresAt) return '❌';
              const now = Date.now();
              const expires = new Date(tokenInfo.accessExpiresAt).getTime();
              return now >= expires ? '❌' : '✅';
            })()
          }</div>
          <div><strong>Refresh Token Actually Expired:</strong> {
            (() => {
              if (!tokenInfo.refreshExpiresAt) return '❌';
              const now = Date.now();
              const expires = new Date(tokenInfo.refreshExpiresAt).getTime();
              return now >= expires ? '❌' : '✅';
            })()
          }</div>
          <div><strong>Should Refresh (within threshold):</strong> {tokenInfo.accessTokenExpired ? '⚠️' : '✅'}</div>
          <div><strong>Time Until Expiry:</strong> {Math.round((tokenInfo.timeUntilExpiry || 0) / 1000)}s</div>
          
          <div style={{ marginTop: '12px', fontSize: '10px' }}>
            <div><strong>Access Token:</strong> {tokenInfo.accessToken}</div>
            <div><strong>Refresh Token:</strong> {tokenInfo.refreshToken}</div>
            <div><strong>Access Expires:</strong> {tokenInfo.accessExpiresAt ? new Date(tokenInfo.accessExpiresAt).toLocaleTimeString() : 'N/A'}</div>
            <div><strong>Refresh Expires:</strong> {tokenInfo.refreshExpiresAt ? new Date(tokenInfo.refreshExpiresAt).toLocaleTimeString() : 'N/A'}</div>
          </div>

          <div style={{ marginTop: '12px' }}>
            <button
              onClick={() => authService.forceLogout()}
              style={{
                background: '#dc3545',
                color: 'white',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                marginRight: '8px',
              }}
            >
              Force Logout
            </button>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: '#28a745',
                color: 'white',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
