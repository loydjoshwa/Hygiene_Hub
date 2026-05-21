import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from "yup";
import register_bg from "../assets/register_bg.png";
import axiosInstance from '../utils/axiosInstance';
import { toast } from 'react-toastify';
import { Link, useNavigate } from 'react-router-dom';

const Register = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  const signupValidation = Yup.object({
    username: Yup.string()
      .min(3, "Minimum 3 characters needed")
      .required("Please enter username")
      .matches(/^(?!\d+$).*/, "Username cannot be only numbers"),
    email: Yup.string()
      .email("Please enter a valid email")
      .required("Please enter email"),
    password: Yup.string()
      .min(6, "Password must be at least 6 characters")
      .required("Please enter password"),
    cpassword: Yup.string()
      .oneOf([Yup.ref("password")], "Passwords do not match")
      .required("Confirm password is required")
  });

  const otpValidation = Yup.object({
    otp: Yup.string()
      .length(5, "OTP must be exactly 5 digits")
      .required("Please enter OTP")
  });

  const formik = useFormik({
    initialValues: {
      username: "",
      email: "",
      password: "",
      cpassword: ""
    },
    validationSchema: signupValidation,
    onSubmit: async (values) => {
      setLoading(true);
      try {
        await axiosInstance.post("/auth/signup", {
          name: values.username,
          email: values.email,
          password: values.password,
          confirmpassword: values.cpassword
        });
        
        setUserEmail(values.email);
        setStep(2);
        toast.success("OTP sent to your email!");
      } catch (err) {
        toast.error(err.response?.data?.error || "Registration failed. Try again.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  });

  const otpFormik = useFormik({
    initialValues: {
      otp: ""
    },
    validationSchema: otpValidation,
    onSubmit: async (values) => {
      setLoading(true);
      try {
        await axiosInstance.post("/auth/verify", {
          email: userEmail,
          otp: values.otp
        });
        
        toast.success("Account Verified Successfully!");
        navigate("/login");
      } catch (err) {
        toast.error(err.response?.data?.error || "Verification failed. Try again.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  });

  const resendOTP = async () => {
    try {
      await axiosInstance.post("/auth/resend-otp", { email: userEmail });
      toast.success("OTP resent to your email!");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to resend OTP.");
    }
  };

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
            <span className="text-2xl text-white">{step === 1 ? '👤' : '🔐'}</span>
          </div>
          <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
            {step === 1 ? 'Create Account' : 'Verify Email'}
          </h2>
          {step === 2 && (
            <p className="text-gray-300 text-sm mt-2">Enter the 5-digit code sent to {userEmail}</p>
          )}
        </div>

        {step === 1 ? (
          <form onSubmit={formik.handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2 flex items-center">Username</label>
                <input
                  type="text"
                  name="username"
                  placeholder="Choose a username"
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300 hover:bg-white/15"
                  onBlur={formik.handleBlur}
                  onChange={formik.handleChange}
                  value={formik.values.username}
                />
                {formik.touched.username && formik.errors.username && (
                  <span className="text-red-300 text-sm mt-1">{formik.errors.username}</span>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2 flex items-center">Email Address</label>
                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300 hover:bg-white/15"
                  onBlur={formik.handleBlur}
                  onChange={formik.handleChange}
                  value={formik.values.email}
                />
                {formik.touched.email && formik.errors.email && (
                  <span className="text-red-300 text-sm mt-1">{formik.errors.email}</span>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2 flex items-center">Password</label>
                <input
                  type="password"
                  name="password"
                  placeholder="Create a password"
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300 hover:bg-white/15"
                  onBlur={formik.handleBlur}
                  onChange={formik.handleChange}
                  value={formik.values.password}
                />
                {formik.touched.password && formik.errors.password && (
                  <span className="text-red-300 text-sm mt-1">{formik.errors.password}</span>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2 flex items-center">Confirm Password</label>
                <input
                  type="password"
                  name="cpassword"
                  placeholder="Confirm your password"
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300 hover:bg-white/15"
                  onBlur={formik.handleBlur}
                  onChange={formik.handleChange}
                  value={formik.values.cpassword}
                />
                {formik.touched.cpassword && formik.errors.cpassword && (
                  <span className="text-red-300 text-sm mt-1">{formik.errors.cpassword}</span>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white py-3 rounded-xl font-semibold hover:from-green-600 hover:to-blue-600 transform hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Account'}
            </button>
          </form>
        ) : (
          <form onSubmit={otpFormik.handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2 text-center">Enter OTP</label>
                <input
                  type="text"
                  name="otp"
                  maxLength="5"
                  placeholder="12345"
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300 hover:bg-white/15 text-center text-2xl tracking-[0.5em]"
                  onBlur={otpFormik.handleBlur}
                  onChange={otpFormik.handleChange}
                  value={otpFormik.values.otp}
                />
                {otpFormik.touched.otp && otpFormik.errors.otp && (
                  <span className="text-red-300 text-sm mt-1 block text-center">{otpFormik.errors.otp}</span>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white py-3 rounded-xl font-semibold hover:from-green-600 hover:to-blue-600 transform hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify Email'}
            </button>

            <p className="text-center text-sm text-gray-300">
              Didn't receive code?{' '}
              <button 
                type="button" 
                onClick={resendOTP} 
                className="text-green-400 hover:text-green-300 font-semibold"
              >
                Resend OTP
              </button>
            </p>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-white/10">
          <p className="text-center text-gray-300">
            Already have an account?{" "}
            <Link to="/login" className="text-green-300 hover:text-green-200 font-semibold hover:underline transition-colors">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;