import React from 'react';
import AuthModal from './AuthModal';

/**
 * Backward compatibility wrapper for AuthModal
 */
export default function LoginModal(props) {
  return (
    <AuthModal
      {...props}
      onAuthSuccess={props.onLoginSuccess || props.onAuthSuccess}
    />
  );
}
