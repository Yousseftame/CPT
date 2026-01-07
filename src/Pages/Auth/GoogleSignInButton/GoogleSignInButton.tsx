import React, { useState, useEffect } from 'react';
import { signInWithGoogle, configureGoogleAuth } from '../../../service/googleAuthService';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface GoogleSignInButtonProps {
  onSuccess?: (uid: string) => void;
  onError?: (error: Error) => void;
  fullWidth?: boolean;
  disabled?: boolean;
  className?: string;
}

const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onSuccess,
  onError,
  fullWidth = true,
  disabled = false,
  className = '',
}) => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    configureGoogleAuth();
  }, []);

  const handleGoogleSignIn = async () => {
    if (loading) return;

    setLoading(true);
    try {
      const result = await signInWithGoogle();
      const user = result.user;

      toast.success('Signed in successfully');

      onSuccess?.(user.uid);

      setTimeout(() => navigate('/dashboard'), 800);
    } catch (err: any) {
      console.error(err);

      if (err.code === 'auth/popup-closed-by-user') {
        toast.error('Sign-in cancelled');
      } else {
        toast.error(err.message || 'Google sign-in failed');
      }

      onError?.(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleGoogleSignIn}
      disabled={disabled || loading}
      className={`
        flex items-center justify-center gap-3
        h-12 px-6 rounded-md
        border border-gray-300 bg-white
        text-sm font-medium text-gray-700
        shadow-sm
        transition-all duration-150
        hover:bg-gray-50 hover:shadow
        active:scale-[0.98]
        disabled:opacity-50 disabled:cursor-not-allowed
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
    >
      {/* Google Icon */}
      <img
        src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
        alt="Google"
        className="w-5 h-5"
      />

      <span>
        {loading ? 'Signing in…' : 'Continue with Google'}
      </span>

      {/* Loading Spinner */}
      {loading && (
        <span className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
      )}
    </button>
  );
};

export default GoogleSignInButton;
