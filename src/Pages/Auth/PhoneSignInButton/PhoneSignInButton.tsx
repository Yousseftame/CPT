// src/components/Auth/PhoneSignInButton/PhoneSignInButton.tsx

import React, { useState } from 'react';
import { Phone, ArrowRight } from 'lucide-react';
import AuthInput from '../../../components/shared/AuthInput';
import AuthButton from '../../../components/shared/AuthButton';
import { sendPhoneOTP, cancelPhoneSignIn } from '../../../service/phoneAuthService';
import toast from 'react-hot-toast';

interface PhoneSignInButtonProps {
  onOTPSent?: (phoneNumber: string) => void;
  onError?: (error: Error) => void;
  className?: string;
  disabled?: boolean;
}

const PhoneSignInButton: React.FC<PhoneSignInButtonProps> = ({
  onOTPSent,
  onError,
  className = '',
  disabled = false,
}) => {
  const [showPhoneInput, setShowPhoneInput] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate phone number
      if (!phoneNumber.trim()) {
        throw new Error('Please enter a phone number');
      }

      if (!phoneNumber.startsWith('+')) {
        throw new Error('Phone number must include country code (e.g., +1 for USA)');
      }

      // Send OTP
      await sendPhoneOTP(phoneNumber);

      toast.success('OTP sent successfully!');

      // Call callback with phone number
      if (onOTPSent) {
        onOTPSent(phoneNumber);
      }

    } catch (err: any) {
      console.error('Error sending OTP:', err);
      const errorMessage = err.message || 'Failed to send OTP';
      toast.error(errorMessage);

      if (onError) {
        onError(err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    cancelPhoneSignIn();
    setShowPhoneInput(false);
    setPhoneNumber('');
  };

  if (showPhoneInput) {
    return (
      <form onSubmit={handleRequestOTP} className={`space-y-4 ${className}`}>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-blue-800">
            <span className="font-semibold">Format:</span> Include country code (e.g., +1 for USA, +44 for UK)
          </p>
          <p className="text-xs text-blue-600 mt-1">
            Example: +1 (555) 123-4567
          </p>
        </div>

        <AuthInput
          label="Phone Number"
          icon={Phone}
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="+1 (555) 123-4567"
          required
          disabled={loading}
        />

        <div className="flex gap-3">
          <AuthButton
            type="submit"
            loading={loading}
            disabled={loading}
            loadingText="Sending OTP..."
            icon={<ArrowRight size={20} />}
            className="flex-1"
          >
            Send OTP
          </AuthButton>

          <button
            type="button"
            onClick={handleCancel}
            disabled={loading}
            className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setShowPhoneInput(true)}
      disabled={disabled || loading}
      className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200
        flex items-center justify-center gap-3
        bg-white text-gray-700 border-2 border-gray-200 hover:border-gray-300 hover:shadow-md
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}`}
    >
      <Phone size={20} />
      <span>Sign in with Phone</span>
    </button>
  );
};

export default PhoneSignInButton;