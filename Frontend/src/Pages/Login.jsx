import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { useAuth } from '../Context/CartContext';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import register_bg from "../assets/register_bg.png";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  useEffect(() => {}, []);

  const formik = useFormik({
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
        localStorage.removeItem('adminEmail');
        localStorage.removeItem('adminName');

        try {
          const adminRes = await axios.get('http://localhost:3130/Admin');
          const admin = adminRes.data?.find(
            a => a.email === values.email && a.password === values.password
          );

          if (admin) {
            
            localStorage.removeItem('user');
            localStorage.removeItem('userEmail');
            localStorage.removeItem('token');

            localStorage.setItem('adminLogged', 'true');
            localStorage.setItem('adminEmail', admin.email);
            localStorage.setItem('adminName', admin.name || 'Admin');

            toast.success('Admin login successful!', {
              position: "top-center",
              autoClose: 1500,
            });
            
            setTimeout(() => {
              navigate('/admin/dashboard');
            }, 1000);

            return;
          }
        } catch (adminError) {
          console.log('Admin check error:', adminError);
        }

    
        const userRes = await axios.get("http://localhost:3130/users");
        const user = userRes.data.find(
          (u) => u.email === values.email && u.password === values.password
        );

        if (user) {
          if (user.status === 'blocked') {
            toast.error('Your account has been blocked');
            setLoading(false);
            return;
          }

          
          localStorage.setItem('adminLogged', 'false');
          localStorage.removeItem('adminEmail');
          localStorage.removeItem('adminName');

        
          login(user);
          toast.success('Login successful!');
          navigate('/');
        } else {
          toast.error('Invalid email or password');
          setLoading(false);
        }

      } catch (error) {
        console.error('Login error:', error);
        toast.error('Something went wrong. Please try again.');
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
            <span className="text-2xl text-white">🔐</span>
          </div>
          <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">Welcome Back</h2>
          <p className="text-gray-300 text-sm">Sign in to your account</p>
        </div>

        <form onSubmit={formik.handleSubmit} className="space-y-6">
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
                onBlur={formik.handleBlur}
                onChange={formik.handleChange}
                value={formik.values.email}
              />
              {formik.touched.email && formik.errors.email && (
                <span className="text-red-300 text-sm mt-1">
                  {formik.errors.email}
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
                onBlur={formik.handleBlur}
                onChange={formik.handleChange}
                value={formik.values.password}
              />
              {formik.touched.password && formik.errors.password && (
                <span className="text-red-300 text-sm mt-1">
                  {formik.errors.password}
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
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

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

