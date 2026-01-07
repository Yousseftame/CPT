// src/hooks/usePhoneAuth.ts

import { useState, useCallback } from 'react';
import {
  sendPhoneOTP,
  verifyPhoneOTP,
  resendPhoneOTP,
  cancelPhoneSignIn,
} from '../service/phoneAuthService';

export const usePhoneAuth = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const handleSendOTP = useCallback(async (phone: string) => {
    setLoading(true);
    setError('');

    try {
      await sendPhoneOTP(phone);
      setPhoneNumber(phone);
      setOtpSent(true);
      setResendCooldown(60);
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const handleVerifyOTP = useCallback(async (otp: string) => {
    setLoading(true);
    setError('');

    try {
      const result = await verifyPhoneOTP(otp);
      return result;
    } catch (err: any) {
      setError(err.message || 'Failed to verify OTP');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const handleResendOTP = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      await resendPhoneOTP(phoneNumber);
      setResendCooldown(60);
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to resend OTP');
      return false;
    } finally {
      setLoading(false);
    }
  }, [phoneNumber]);

  const handleCancel = useCallback(() => {
    cancelPhoneSignIn();
    setPhoneNumber('');
    setOtpSent(false);
    setError('');
  }, []);

  return {
    phoneNumber,
    setPhoneNumber,
    loading,
    error,
    otpSent,
    resendCooldown,
    setResendCooldown,
    handleSendOTP,
    handleVerifyOTP,
    handleResendOTP,
    handleCancel,
  };
};

// src/utils/phoneNumberValidator.ts

/**
 * Validate phone number format
 */
export const isValidPhoneNumber = (phoneNumber: string): boolean => {
  // Must start with +
  if (!phoneNumber.startsWith('+')) {
    return false;
  }

  // Extract digits only
  const digits = phoneNumber.replace(/\D/g, '');

  // Must have 10-15 digits (E.164 standard)
  return digits.length >= 10 && digits.length <= 15;
};

/**
 * Format phone number to E.164 standard
 * @param phoneNumber Raw phone number
 * @returns Formatted phone number (e.g., "+15551234567")
 */
export const formatPhoneNumber = (phoneNumber: string): string => {
  // Remove all non-digit characters except +
  let formatted = phoneNumber.replace(/[^\d+]/g, '');

  // Ensure it starts with +
  if (!formatted.startsWith('+')) {
    formatted = '+' + formatted;
  }

  return formatted;
};

/**
 * Get country code from phone number
 */
export const getCountryCode = (phoneNumber: string): string | null => {
  const match = phoneNumber.match(/^\+(\d{1,3})/);
  return match ? match[1] : null;
};

/**
 * Get phone number without country code
 */
export const getPhoneWithoutCountryCode = (phoneNumber: string): string => {
  return phoneNumber.replace(/^\+\d+/, '');
};

// src/utils/countryPhoneCodes.ts

export const COUNTRY_PHONE_CODES = [
  { country: 'Afghanistan', code: '+93', shortCode: 'AF' },
  { country: 'Albania', code: '+355', shortCode: 'AL' },
  { country: 'Algeria', code: '+213', shortCode: 'DZ' },
  { country: 'Andorra', code: '+376', shortCode: 'AD' },
  { country: 'Angola', code: '+244', shortCode: 'AO' },
  { country: 'Argentina', code: '+54', shortCode: 'AR' },
  { country: 'Australia', code: '+61', shortCode: 'AU' },
  { country: 'Austria', code: '+43', shortCode: 'AT' },
  { country: 'Azerbaijan', code: '+994', shortCode: 'AZ' },
  { country: 'Bahamas', code: '+1', shortCode: 'BS' },
  { country: 'Bahrain', code: '+973', shortCode: 'BH' },
  { country: 'Bangladesh', code: '+880', shortCode: 'BD' },
  { country: 'Belgium', code: '+32', shortCode: 'BE' },
  { country: 'Belize', code: '+501', shortCode: 'BZ' },
  { country: 'Benin', code: '+229', shortCode: 'BJ' },
  { country: 'Brazil', code: '+55', shortCode: 'BR' },
  { country: 'Bulgaria', code: '+359', shortCode: 'BG' },
  { country: 'Canada', code: '+1', shortCode: 'CA' },
  { country: 'Chile', code: '+56', shortCode: 'CL' },
  { country: 'China', code: '+86', shortCode: 'CN' },
  { country: 'Colombia', code: '+57', shortCode: 'CO' },
  { country: 'Croatia', code: '+385', shortCode: 'HR' },
  { country: 'Cyprus', code: '+357', shortCode: 'CY' },
  { country: 'Czech Republic', code: '+420', shortCode: 'CZ' },
  { country: 'Denmark', code: '+45', shortCode: 'DK' },
  { country: 'Egypt', code: '+20', shortCode: 'EG' },
  { country: 'Estonia', code: '+372', shortCode: 'EE' },
  { country: 'Finland', code: '+358', shortCode: 'FI' },
  { country: 'France', code: '+33', shortCode: 'FR' },
  { country: 'Germany', code: '+49', shortCode: 'DE' },
  { country: 'Greece', code: '+30', shortCode: 'GR' },
  { country: 'Hong Kong', code: '+852', shortCode: 'HK' },
  { country: 'Hungary', code: '+36', shortCode: 'HU' },
  { country: 'Iceland', code: '+354', shortCode: 'IS' },
  { country: 'India', code: '+91', shortCode: 'IN' },
  { country: 'Indonesia', code: '+62', shortCode: 'ID' },
  { country: 'Iran', code: '+98', shortCode: 'IR' },
  { country: 'Ireland', code: '+353', shortCode: 'IE' },
  { country: 'Israel', code: '+972', shortCode: 'IL' },
  { country: 'Italy', code: '+39', shortCode: 'IT' },
  { country: 'Jamaica', code: '+1', shortCode: 'JM' },
  { country: 'Japan', code: '+81', shortCode: 'JP' },
  { country: 'Jordan', code: '+962', shortCode: 'JO' },
  { country: 'Kazakhstan', code: '+7', shortCode: 'KZ' },
  { country: 'Kenya', code: '+254', shortCode: 'KE' },
  { country: 'Kuwait', code: '+965', shortCode: 'KW' },
  { country: 'Latvia', code: '+371', shortCode: 'LV' },
  { country: 'Lebanon', code: '+961', shortCode: 'LB' },
  { country: 'Lithuania', code: '+370', shortCode: 'LT' },
  { country: 'Luxembourg', code: '+352', shortCode: 'LU' },
  { country: 'Malaysia', code: '+60', shortCode: 'MY' },
  { country: 'Mexico', code: '+52', shortCode: 'MX' },
  { country: 'Morocco', code: '+212', shortCode: 'MA' },
  { country: 'Netherlands', code: '+31', shortCode: 'NL' },
  { country: 'New Zealand', code: '+64', shortCode: 'NZ' },
  { country: 'Nigeria', code: '+234', shortCode: 'NG' },
  { country: 'Norway', code: '+47', shortCode: 'NO' },
  { country: 'Pakistan', code: '+92', shortCode: 'PK' },
  { country: 'Peru', code: '+51', shortCode: 'PE' },
  { country: 'Philippines', code: '+63', shortCode: 'PH' },
  { country: 'Poland', code: '+48', shortCode: 'PL' },
  { country: 'Portugal', code: '+351', shortCode: 'PT' },
  { country: 'Qatar', code: '+974', shortCode: 'QA' },
  { country: 'Romania', code: '+40', shortCode: 'RO' },
  { country: 'Russia', code: '+7', shortCode: 'RU' },
  { country: 'Saudi Arabia', code: '+966', shortCode: 'SA' },
  { country: 'Singapore', code: '+65', shortCode: 'SG' },
  { country: 'Slovakia', code: '+421', shortCode: 'SK' },
  { country: 'Slovenia', code: '+386', shortCode: 'SI' },
  { country: 'South Africa', code: '+27', shortCode: 'ZA' },
  { country: 'South Korea', code: '+82', shortCode: 'KR' },
  { country: 'Spain', code: '+34', shortCode: 'ES' },
  { country: 'Sweden', code: '+46', shortCode: 'SE' },
  { country: 'Switzerland', code: '+41', shortCode: 'CH' },
  { country: 'Taiwan', code: '+886', shortCode: 'TW' },
  { country: 'Thailand', code: '+66', shortCode: 'TH' },
  { country: 'Turkey', code: '+90', shortCode: 'TR' },
  { country: 'UAE', code: '+971', shortCode: 'AE' },
  { country: 'Ukraine', code: '+380', shortCode: 'UA' },
  { country: 'United Kingdom', code: '+44', shortCode: 'GB' },
  { country: 'United States', code: '+1', shortCode: 'US' },
  { country: 'Uruguay', code: '+598', shortCode: 'UY' },
  { country: 'Venezuela', code: '+58', shortCode: 'VE' },
  { country: 'Vietnam', code: '+84', shortCode: 'VN' },
  { country: 'Yemen', code: '+967', shortCode: 'YE' },
  { country: 'Zimbabwe', code: '+263', shortCode: 'ZW' },
];

/**
 * Get country info by code
 */
export const getCountryByCode = (code: string) => {
  return COUNTRY_PHONE_CODES.find(c => c.code === code || c.shortCode === code);
};

/**
 * Get all country codes
 */
export const getAllCountryCodes = () => {
  return COUNTRY_PHONE_CODES.map(c => ({
    label: `${c.country} ${c.code}`,
    value: c.code,
    country: c.country,
  }));
};