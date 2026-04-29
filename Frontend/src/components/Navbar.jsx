import React, { useState } from "react";
import { IoMenu, IoClose, IoCartOutline, IoHeartOutline, IoPersonOutline, IoLogOutOutline } from "react-icons/io5";
import { Link, useNavigate } from "react-router-dom";
import { useCart, useAuth } from "../Context/CartContext.jsx";
import { toast } from "react-toastify";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const { getTotalItems } = useCart();
  const { currentUser, logout, getWishlistCount } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success('Logged out successfully');
    setOpen(false); 
  };

  return (
    <nav className="bg-gradient-to-r from-gray-900 to-slate-900 text-white fixed top-0 left-0 w-full z-50 shadow-2xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
      
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-green-500 rounded-xl flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform duration-300">
            <span className="text-xl font-bold">H</span>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">HygieneHub.</span>
            <span className="text-xs text-gray-400">Premium Care</span>
          </div>
        </Link>

        <ul className="hidden md:flex items-center gap-8 text-lg font-medium">
          <li>
            <Link 
              className="hover:text-green-400 transition-all duration-300 hover:scale-105 flex items-center gap-1" 
              to="/"
            >
              <span></span> Home
            </Link>
          </li>

          <li>
            <Link 
              className="hover:text-green-400 transition-all duration-300 hover:scale-105 flex items-center gap-1" 
              to="/products"
            >
              <span>🛍️</span> Products
            </Link>
          </li>

          <li className="relative group">
            <Link 
              to="/cart" 
              className="hover:text-green-400 transition-all duration-300 hover:scale-105 flex items-center gap-2"
            >
              <div className="relative">
                <IoCartOutline size={24} className="group-hover:animate-bounce" />
                {getTotalItems() > 0 && (
                  <span className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold ">
                    {getTotalItems()}
                  </span>
                )}
              </div>
              <span>Cart</span>
            </Link>
          </li>

          <li className="relative group">
            <Link 
              to="/wishlist" 
              className="hover:text-green-400 transition-all duration-300 hover:scale-105 flex items-center gap-2"
            >
              <div className="relative">
                <IoHeartOutline size={24} className="group-hover:animate-pulse" />
                {getWishlistCount() > 0 && (
                  <span className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold">
                    {getWishlistCount()}
                  </span>
                )}
              </div>
              <span>Wishlist</span>
            </Link>
          </li>
          
          {currentUser && (
            <li className="group">
              <Link 
                to="/myorders" 
                className="hover:text-green-400 transition-all duration-300 hover:scale-105 flex items-center gap-1"
              >
                <span>📦</span> My Orders
              </Link>
            </li>
          )}

          {currentUser ? (
            <li className="group">
              <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-blue-500/20 to-green-500/20 rounded-xl">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-green-400 rounded-full flex items-center justify-center">
                  <IoPersonOutline size={18} />
                </div>
                <span className="font-semibold">{currentUser.username}</span>
              </div>
            </li>
          ) : (
            <li className="group">
              <Link 
                to="/login" 
                className="flex items-center gap-2 hover:text-green-400 transition-all duration-300 hover:scale-105"
              >
                <IoPersonOutline size={22} />
                <span>Login</span>
              </Link>
            </li>
          )}
        </ul>

        <div className="hidden md:flex items-center space-x-4">
          {currentUser ? (
            <button
              onClick={handleLogout}
              className="group bg-gradient-to-r from-red-500 to-pink-500 text-white px-6 py-3 rounded-xl hover:from-red-600 hover:to-pink-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center gap-3"
            >
              <IoLogOutOutline size={20} className="group-hover:rotate-180 transition-transform duration-300" />
              Logout
            </button>
          ) : (
            <Link
              to="/login"
              className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-8 py-3 rounded-xl hover:from-green-600 hover:to-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 font-semibold"
            >
              Get Started
            </Link>
          )}
        </div>

        
        <button 
          className="md:hidden text-3xl text-white hover:text-green-400 transition-colors duration-300" 
          onClick={() => setOpen(!open)}
        >
          {open ? <IoClose /> : <IoMenu />}
        </button>
      </div>

 
      {open && (
        <div className="md:hidden bg-gradient-to-b from-gray-900 to-slate-900 text-white shadow-2xl p-8 space-y-4 text-lg font-medium animate-slideDown">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">H</span>
            </div>
            <p className="text-gray-400">Navigation Menu</p>
          </div>

          {[
            { to: "/", icon: "🏠", label: "Home" },
            { to: "/products", icon: "🛍️", label: "Products" },
            { to: "/cart", icon: "🛒", label: "Cart", badge: getTotalItems() },
            { to: "/wishlist", icon: "❤️", label: "Wishlist", badge: getWishlistCount() },
            currentUser && { to: "/myorders", icon: "📦", label: "My Orders" },
          ].filter(Boolean).map((item) => (
            <Link
              key={item.to}
              onClick={() => setOpen(false)}
              to={item.to}
              className="flex items-center justify-between p-4 hover:bg-white/10 rounded-xl transition-all duration-300 group"
            >
              <div className="flex items-center gap-4">
                <span className="text-xl group-hover:scale-125 transition-transform">{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {item.badge > 0 && (
                <span className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}

          {currentUser ? (
            <>
              <div className="p-4 bg-gradient-to-r from-blue-500/20 to-green-500/20 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-green-400 rounded-full flex items-center justify-center">
                    <IoPersonOutline size={20} />
                  </div>
                  <div>
                    <p className="font-semibold">{currentUser.username}</p>
                    <p className="text-sm text-gray-400">{currentUser.email}</p>
                  </div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full bg-gradient-to-r from-red-500 to-pink-500 text-white py-4 rounded-xl hover:from-red-600 hover:to-pink-600 transition-all duration-300 shadow-lg flex items-center justify-center gap-3 font-semibold"
              >
                <IoLogOutOutline size={22} />
                Logout Account
              </button>
            </>
          ) : (
            <Link
              onClick={() => setOpen(false)}
              to="/login"
              className="block bg-gradient-to-r from-green-500 to-blue-500 text-white py-4 rounded-xl hover:from-green-600 hover:to-blue-600 transition-all duration-300 shadow-lg text-center font-semibold"
            >
              Login / Register
            </Link>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;