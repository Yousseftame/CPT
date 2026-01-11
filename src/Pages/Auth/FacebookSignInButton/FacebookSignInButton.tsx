import React, { useState } from 'react';
import { signInWithPopup, FacebookAuthProvider, getAuth } from 'firebase/auth';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface FacebookSignInButtonProps {
  onSuccess?: (uid: string) => void;
  onError?: (error: Error) => void;
  fullWidth?: boolean;
  disabled?: boolean;
  className?: string;
}

const FacebookSignInButton: React.FC<FacebookSignInButtonProps> = ({
  onSuccess,
  onError,
  fullWidth = true,
  disabled = false,
  className = '',
}) => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const auth = getAuth();

  const provider = new FacebookAuthProvider();
  provider.addScope('email');
  provider.addScope('public_profile');

  const handleFacebookSignIn = async () => {
    if (loading) return;

    setLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      toast.success('Signed in with Facebook');

      onSuccess?.(user.uid);

      setTimeout(() => navigate('/dashboard'), 800);
    } catch (err: any) {
      console.error(err);

      if (err.code === 'auth/popup-closed-by-user') {
        toast.error('Sign-in cancelled');
      } else {
        toast.error(err.message || 'Facebook sign-in failed');
      }

      onError?.(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleFacebookSignIn}
      disabled={disabled || loading}
      className={`
        flex items-center justify-center gap-3
        h-12 px-6 rounded-md
        bg-[#1877F2] text-white
        text-sm font-medium
        shadow-sm
        transition-all duration-150
        hover:bg-[#166FE5]
        active:scale-[0.98]
        disabled:opacity-50 disabled:cursor-not-allowed
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
    >
      {/* Facebook Icon */}
      <svg
        className="w-5 h-5 fill-white"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="M22 12a10 10 0 1 0-11.5 9.87v-6.99h-2.5V12h2.5V9.8c0-2.47 1.47-3.83 3.72-3.83 1.08 0 2.21.2 2.21.2v2.43h-1.25c-1.23 0-1.62.77-1.62 1.56V12h2.76l-.44 2.88h-2.32v6.99A10 10 0 0 0 22 12z" />
      </svg>

      <span>
        {loading ? 'Signing in…' : 'Facebook  "Disabled"'}
      </span>

      {loading && (
        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
      )}
    </button>
  );
};

export default FacebookSignInButton;
