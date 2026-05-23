import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../Context/CartContext';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import register_bg from "../assets/register_bg.png";
import axiosInstance from '../utils/axiosInstance';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [step, setStep] = useState(1); // 1: Login, 2: Forgot Password, 3: Reset Password
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  // 1️⃣ Login Form Configuration
  const loginFormik = useFormik({
    initialValues: {
      email: '',
      password: ''
    },
    validationSchema: Yup.object({
      email: Yup.string()
        .email('Invalid email format')
        .required('Email is required'),
      password: Yup.string()
        .min(6, 'Password must be at least 6 characters')
        .required('Password is required')
    }),
    onSubmit: async (values) => {
      setLoading(true);
      try {
        const user = await login(values.email, values.password);
        toast.success('Login successful!');
        if (user.role === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/');
        }
      } catch (error) {
        console.error('Login error:', error);
        toast.error(error.message || 'Invalid email or password');
      } finally {
        setLoading(false);
      }
    }
  });

  // 2️⃣ Forgot Password Form Configuration
  const forgotFormik = useFormik({
    initialValues: {
      email: ''
    },
    validationSchema: Yup.object({
      email: Yup.string()
        .email('Invalid email format')
        .required('Email is required')
    }),
    onSubmit: async (values) => {
      setLoading(true);
      try {
        const sanitizedEmail = (values.email || "").trim().toLowerCase();
        await axiosInstance.post("/auth/forgot-password", { email: sanitizedEmail });
        setUserEmail(sanitizedEmail);
        toast.success('OTP sent to your email!');
        setStep(3);
      } catch (error) {
        console.error('Forgot password error:', error);
        toast.error(error.response?.data?.error || 'Failed to send OTP. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  });

  // 3️⃣ Reset Password Form Configuration
  const resetFormik = useFormik({
    initialValues: {
      otp: '',
      newPassword: '',
      confirmPassword: ''
    },
    validationSchema: Yup.object({
      otp: Yup.string()
        .length(5, 'OTP must be exactly 5 digits')
        .required('OTP is required'),
      newPassword: Yup.string()
        .min(6, 'Password must be at least 6 characters')
        .required('New password is required'),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('newPassword')], 'Passwords must match')
        .required('Confirm password is required')
    }),
    onSubmit: async (values) => {
      setLoading(true);
      try {
        await axiosInstance.post("/auth/reset-password", {
          email: userEmail,
          otp: values.otp,
          new_password: values.newPassword,
          confirm_password: values.confirmPassword
        });
        toast.success('Password reset successful! Please login with your new password.');
        resetFormik.resetForm();
        setStep(1);
      } catch (error) {
        console.error('Reset password error:', error);
        toast.error(error.response?.data?.error || 'Password reset failed. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  });

  return (
    <div
      className="flex justify-center items-center min-h-screen relative overflow-hidden"
      style={{
        backgroundImage: `url(${register_bg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat"
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-green-600/20"></div>
      <div className="absolute inset-0 bg-black/40"></div>

      <div className="relative z-10 p-8 rounded-2xl shadow-2xl w-96 backdrop-blur-lg"
        style={{
          background: "rgba(255, 255, 255, 0.1)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          boxShadow: "0 25px 45px rgba(0, 0, 0, 0.3)"
        }}
      >
        <div className="absolute -top-10 -right-10 w-20 h-20 bg-green-500/20 rounded-full blur-xl"></div>
        <div className="absolute -bottom-10 -left-10 w-20 h-20 bg-blue-500/20 rounded-full blur-xl"></div>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-2xl text-white">
              {step === 1 ? '🔐' : step === 2 ? '🔑' : '🔄'}
            </span>
          </div>
          <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
            {step === 1 ? 'Welcome Back' : step === 2 ? 'Forgot Password' : 'Reset Password'}
          </h2>
          <p className="text-gray-300 text-sm">
            {step === 1 
              ? 'Sign in to your account' 
              : step === 2 
                ? 'Enter email to receive reset code' 
                : `Enter OTP sent to ${userEmail}`}
          </p>
        </div>

        {/* 💻 STEP 1: Login Form */}
        {step === 1 && (
          <form onSubmit={loginFormik.handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300 hover:bg-white/15"
                  onBlur={loginFormik.handleBlur}
                  onChange={loginFormik.handleChange}
                  value={loginFormik.values.email}
                />
                {loginFormik.touched.email && loginFormik.errors.email && (
                  <span className="text-red-300 text-sm mt-1">
                    {loginFormik.errors.email}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300 hover:bg-white/15"
                  onBlur={loginFormik.handleBlur}
                  onChange={loginFormik.handleChange}
                  value={loginFormik.values.password}
                />
                {loginFormik.touched.password && loginFormik.errors.password && (
                  <span className="text-red-300 text-sm mt-1">
                    {loginFormik.errors.password}
                  </span>
                )}
              </div>
            </div>

            <div className="text-right">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="text-sm text-green-300 hover:text-green-200 hover:underline transition-colors duration-200"
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white py-3 rounded-xl font-semibold hover:from-green-600 hover:to-blue-600 transform hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        )}

        {/* 💻 STEP 2: Forgot Password Form */}
        {step === 2 && (
          <form onSubmit={forgotFormik.handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Registered Email Address
              </label>
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300 hover:bg-white/15"
                onBlur={forgotFormik.handleBlur}
                onChange={forgotFormik.handleChange}
                value={forgotFormik.values.email}
              />
              {forgotFormik.touched.email && forgotFormik.errors.email && (
                <span className="text-red-300 text-sm mt-1">
                  {forgotFormik.errors.email}
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white py-3 rounded-xl font-semibold hover:from-green-600 hover:to-blue-600 transform hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Sending OTP...
                </>
              ) : (
                'Send OTP'
              )}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-sm text-green-300 hover:text-green-200 hover:underline transition-colors duration-200"
              >
                Back to Login
              </button>
            </div>
          </form>
        )}

        {/* 💻 STEP 3: Reset Password Form */}
        {step === 3 && (
          <form onSubmit={resetFormik.handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Enter 5-digit OTP
                </label>
                <input
                  type="text"
                  name="otp"
                  maxLength="5"
                  placeholder="12345"
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300 hover:bg-white/15 text-center tracking-[0.5em] text-xl"
                  onBlur={resetFormik.handleBlur}
                  onChange={resetFormik.handleChange}
                  value={resetFormik.values.otp}
                />
                {resetFormik.touched.otp && resetFormik.errors.otp && (
                  <span className="text-red-300 text-sm mt-1">
                    {resetFormik.errors.otp}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  name="newPassword"
                  placeholder="Enter new password"
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300 hover:bg-white/15"
                  onBlur={resetFormik.handleBlur}
                  onChange={resetFormik.handleChange}
                  value={resetFormik.values.newPassword}
                />
                {resetFormik.touched.newPassword && resetFormik.errors.newPassword && (
                  <span className="text-red-300 text-sm mt-1">
                    {resetFormik.errors.newPassword}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm new password"
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300 hover:bg-white/15"
                  onBlur={resetFormik.handleBlur}
                  onChange={resetFormik.handleChange}
                  value={resetFormik.values.confirmPassword}
                />
                {resetFormik.touched.confirmPassword && resetFormik.errors.confirmPassword && (
                  <span className="text-red-300 text-sm mt-1">
                    {resetFormik.errors.confirmPassword}
                  </span>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white py-3 rounded-xl font-semibold hover:from-green-600 hover:to-blue-600 transform hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Resetting Password...
                </>
              ) : (
                'Reset Password'
              )}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-sm text-green-300 hover:text-green-200 hover:underline transition-colors duration-200"
              >
                Back to Login
              </button>
            </div>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-white/10">
          <p className="text-center text-gray-300">
            Don't have an account?{" "}
            <Link to="/register" className="text-green-300 hover:text-green-200 font-semibold hover:underline transition-colors">
              Register Now
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
};

export default Login;
