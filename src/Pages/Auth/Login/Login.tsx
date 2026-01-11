// src/Pages/Auth/Login/Login.tsx (ENHANCED WITH TABS)

import React, { useEffect, useState } from 'react';
import { Mail, Lock, ArrowRight, Phone as PhoneIcon } from 'lucide-react';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth, db } from '../../../service/firebase';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import ErrorAlert from '../../../components/shared/ErrorAlert';
import AuthInput from '../../../components/shared/AuthInput';
import AuthButton from '../../../components/shared/AuthButton';
import { doc, getDoc } from 'firebase/firestore';
import PagesLoader from '../../../components/shared/PagesLoader';
import { trackLoginDirect } from '../../../service/loginTracker';
import PhoneOTPVerification from '../PhoneOTPVerification/PhoneOTPVerification';
import GoogleSignInButton from '../GoogleSignInButton/GoogleSignInButton';
import FacebookSignInButton from '../FacebookSignInButton/FacebookSignInButton';
import { sendPhoneOTP } from '../../../service/phoneAuthService';

type AuthTab = 'email' | 'phone';

const Login = () => {
  // Email/Password State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Phone State
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showOTPVerification, setShowOTPVerification] = useState(false);
  
  // UI State
  const [activeTab, setActiveTab] = useState<AuthTab>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkingAuth, setCheckingAuth] = useState(true);
  
  const navigate = useNavigate();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await userCredential.user.reload();
      const currentUser = auth.currentUser;

      const docRef = doc(db, "admins", userCredential.user.uid);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        setError('Admin account not found.');
        await signOut(auth);
        return;
      }

      const adminData = docSnap.data();
      
      localStorage.setItem('userRole', adminData.role);
      localStorage.setItem('userName', adminData.name || '');
      localStorage.setItem('userStatus', adminData.status || 'active');

      if (!currentUser?.emailVerified) {
        toast.error('Please verify your email to continue.');
        navigate('/verify-account');
        return;
      }

      if (adminData.status === 'inactive') {
        setError('Your account has been deactivated. Please contact a super admin.');
        toast.error('Account is inactive. Access denied.');
        await signOut(auth);
        return;
      }

      await trackLoginDirect(userCredential.user.uid);

      toast.success('Login successful!');
      navigate('/dashboard');

    } catch (err: any) {
      if (err.code === 'auth/user-disabled') {
        navigate('/unauthorized');
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        setError('Invalid email or password. Please try again.');
      } else if (err.code === 'auth/user-not-found') {
        setError('No account found with this email.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please try again later.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address.');
      } else {
        setError('Failed to login. Please check your credentials.');
      }
      
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!phoneNumber.trim()) {
        throw new Error('Please enter a phone number');
      }

      if (!phoneNumber.startsWith('+')) {
        throw new Error('Phone number must include country code (e.g., +1 for USA)');
      }

      const loadingToast = toast.loading('Sending OTP...');

      await sendPhoneOTP(phoneNumber);

      toast.dismiss(loadingToast);
      toast.success('OTP sent successfully!');
      
      setShowOTPVerification(true);

    } catch (err: any) {
      console.error('Error sending OTP:', err);
      const errorMessage = err.message || 'Failed to send OTP';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const signOutUser = async () => {
      if (auth.currentUser) {
        await signOut(auth);
      }
      setCheckingAuth(false);
    };
    signOutUser();
  }, []);

  if (checkingAuth) {
    return <PagesLoader text="Preparing login page..." />;
  }

  if (showOTPVerification) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
        <PhoneOTPVerification
          phoneNumber={phoneNumber}
          onCancel={() => {
            setShowOTPVerification(false);
            setPhoneNumber('');
          }}
          onVerified={(uid) => {
            console.log('✅ User verified with phone:', uid);
          }}
          onError={(error) => {
            console.error('Phone verification error:', error);
            toast.error(error.message);
          }}
        />
      </div>
    );
  }

  return (
    <div>
      {/* REQUIRED: Hidden reCAPTCHA container for phone auth */}
      <div id="recaptcha-container" className="hidden"></div>

      {/* Logo */}
      <div className="mb-8">
        <h1 className="text-8xl font-bold text-gray-900 mb-2">
          Hello!
        </h1>
        <p className="text-gray-600">
          Enter to get unlimited access to data & information.
        </p>
      </div>

      <ErrorAlert message={error} onClose={() => setError('')} />

      {/* Auth Method Tabs */}
      <div className="mb-6">
        <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
          <button
            type="button"
            onClick={() => {
              setActiveTab('email');
              setError('');
            }}
            disabled={loading}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-md font-medium transition-all duration-200 ${
              activeTab === 'email'
                ? 'bg-white text-purple-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            } disabled:opacity-50`}
          >
            <Mail size={18} />
            <span>Email</span>
          </button>
          
          <button
          
            type="button"
            onClick={() => {
              setActiveTab('phone');
              setError('');
            }}
            disabled
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-md font-medium transition-all duration-200 ${
              activeTab === 'phone'
                ? 'bg-white text-purple-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            } disabled:opacity-50`}
          >
            <PhoneIcon size={18} />
            <span>Phone "Disabled"</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[320px]">
        {/* Email/Password Tab */}
        {activeTab === 'email' && (
          <form onSubmit={handleEmailLogin} className="space-y-5 animate-fadeIn">
            <AuthInput
              label="Email"
              icon={Mail}
              type="email"
              value={email}
              onChange={(e: any) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              required
              disabled={loading}
            />

            <AuthInput
              label="Password"
              icon={Lock}
              type="password"
              value={password}
              onChange={(e: any) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
              disabled={loading}
              showPasswordToggle
            />

            <div className="flex items-center justify-end">
              <button
                onClick={() => navigate('/forget-password')}
                type="button"
                className="text-sm text-purple-600 hover:text-purple-800 font-medium transition-colors"
                disabled={loading}
              >
                Forgot your password?
              </button>
            </div>

            <AuthButton
              type="submit"
              loading={loading}
              loadingText="Signing in..."
              icon={<ArrowRight size={20} />}
            >
              Log In with Email
            </AuthButton>
          </form>
        )}

        {/* Phone Tab */}
        {activeTab === 'phone' && (
          <form onSubmit={handlePhoneLogin} className="space-y-5 animate-fadeIn">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800">
                <span className="font-semibold">Format:</span> Include country code
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Examples: +1 (555) 123-4567 (USA), +44 20 1234 5678 (UK), +20 10 1234 5678 (Egypt)
              </p>
            </div>

            <AuthInput
              label="Phone Number"
              icon={PhoneIcon}
              type="tel"
              value={phoneNumber}
              onChange={(e: any) => setPhoneNumber(e.target.value)}
              placeholder="+1 (555) 123-4567"
              required
              disabled={loading}
            />

            <AuthButton
              type="submit"
              loading={loading}
              loadingText="Sending OTP..."
              icon={<ArrowRight size={20} />}
            >
              Send OTP
            </AuthButton>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                You'll receive a 6-digit verification code
              </p>
            </div>
          </form>
        )}
      </div>

      {/* Divider */}
      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t-2 border-gray-200"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white font-medium text-gray-600">
            or continue with
          </span>
        </div>
      </div>

      {/* Social Sign-In Methods */}
      <div className="space-y-3">
        <GoogleSignInButton
          fullWidth
          disabled
          onSuccess={(uid: any) => {
            console.log('✅ User signed in with Google:', uid);
          }}
          onError={(error) => {
            console.error('Google sign-in error:', error);
            toast.error('Google sign-in failed. Please try again.');
          }}
        />
        
        <FacebookSignInButton 
        disabled/>
      </div>

      <p className="text-center text-sm text-gray-600 mt-8">
        Don't have an account?{' '}
        <button
          onClick={() => navigate('/register')}
          type="button"
          className="text-purple-600 font-bold transition-all duration-300 disabled:opacity-50 underline-offset-4"
          disabled
        >
          Create Account
        </button>
      </p>

      {/* Add fadeIn animation CSS */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default Login;