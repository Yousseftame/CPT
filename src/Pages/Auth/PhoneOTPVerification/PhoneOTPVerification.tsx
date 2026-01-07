// src/components/Auth/PhoneOTPVerification/PhoneOTPVerification.tsx

import React, { useState, useEffect, useRef } from 'react';
import { verifyPhoneOTP, resendPhoneOTP, cancelPhoneSignIn } from '../../../service/phoneAuthService';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { Clock, RotateCcw } from 'lucide-react';
import AuthButton from '../../../components/shared/AuthButton';

interface PhoneOTPVerificationProps {
  phoneNumber: string;
  onVerified?: (uid: string) => void;
  onError?: (error: Error) => void;
  onCancel?: () => void;
}

const PhoneOTPVerification: React.FC<PhoneOTPVerificationProps> = ({
  phoneNumber,
  onVerified,
  onError,
  onCancel,
}) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus();

    // Countdown timer for resend
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleInputChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) {
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    if (e.key === 'Enter') {
      handleVerifyOTP(e as any);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join('');

    if (otpCode.length !== 6) {
      toast.error('Please enter all 6 digits');
      return;
    }

    setLoading(true);

    try {
      const result = await verifyPhoneOTP(otpCode);
      
      toast.success('Phone verified successfully!');

      if (onVerified) {
        onVerified(result.user.uid);
      }

      // Navigate to dashboard
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);

    } catch (err: any) {
      console.error('OTP verification error:', err);
      const errorMessage = err.message || 'Failed to verify OTP';
      toast.error(errorMessage);

      if (onError) {
        onError(err);
      }

      // Clear OTP inputs on error
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setResending(true);

    try {
      await resendPhoneOTP(phoneNumber);
      toast.success('OTP resent successfully!');
      
      // Reset timer
      setTimeLeft(60);
      setCanResend(false);
      
      // Clear inputs
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();

    } catch (err: any) {
      toast.error(err.message || 'Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  const handleCancel = () => {
    cancelPhoneSignIn();
    if (onCancel) {
      onCancel();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify Your Phone</h2>
      <p className="text-gray-600 text-sm mb-6">
        We sent a 6-digit code to<br />
        <span className="font-semibold text-gray-900">{phoneNumber}</span>
      </p>

      <form onSubmit={handleVerifyOTP} className="space-y-6">
        {/* OTP Input Fields */}
        <div className="flex gap-2 justify-between">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleInputChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              disabled={loading}
              className="w-12 h-12 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg
                focus:border-purple-600 focus:outline-none focus:shadow-lg
                transition-all disabled:opacity-50
                bg-gray-50 hover:bg-white"
            />
          ))}
        </div>

        {/* Verify Button */}
        <AuthButton
          type="submit"
          loading={loading}
          disabled={loading || otp.join('').length !== 6}
          loadingText="Verifying..."
        >
          Verify OTP
        </AuthButton>
      </form>

      {/* Resend OTP Section */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        {!canResend ? (
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
            <Clock size={16} />
            <span>Resend OTP in {formatTime(timeLeft)}</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleResendOTP}
            disabled={resending || loading}
            className="w-full flex items-center justify-center gap-2 py-2 px-4
              text-purple-600 hover:text-purple-700 font-medium
              hover:bg-purple-50 rounded-lg transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCcw size={16} />
            {resending ? 'Sending OTP...' : 'Resend OTP'}
          </button>
        )}
      </div>

      {/* Cancel Button */}
      <button
        type="button"
        onClick={handleCancel}
        disabled={loading || resending}
        className="w-full mt-4 py-2 px-4 text-gray-600 hover:text-gray-700 font-medium
          hover:bg-gray-100 rounded-lg transition-colors
          disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Use Different Method
      </button>
    </div>
  );
};

export default PhoneOTPVerification;