import React from 'react';
import Register from './Pages/Register';
import "./App.css";
import { ToastContainer } from 'react-toastify';
import { Route, Routes } from 'react-router-dom';
import Login from './Pages/Login';
import Home from './Pages/Home';
import Products from './Pages/Products';
import About from './Pages/About';
import Contact from './Pages/Contact';
import Cart from './Pages/Cart';
import Wishlist from './Pages/Wishlist';
import { CartProvider } from './Context/CartContext';
import Payment from './Pages/Payment';

import ProtectedRoute from './Routes/ProtectedRoute';
import PublicRoute from './Routes/PublicRoute';
import Navbar from './components/Navbar';
import MyOrders from './Pages/Myorders';


import AdminDashboard from "./Admin/AdminDashboard";
import AdminProtectedRoute from "./Routes/AdminProtectedRoute";
import ManageOrders from './Admin/ManageOrders';
import OrderDetails from './Admin/OrderDetails';
import ManageProducts from './Admin/ManageProducts';
import ManageUsers from './Admin/ManageUsers';




const App = () => {
  return (
    <CartProvider>
      
      <Routes>
  <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
  <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

  <Route path="/" element={<><Navbar /><Home /></>} />
  <Route path="/products" element={<><Navbar /><Products /></>} />
  <Route path="/about" element={<><Navbar /><About /></>} />
  <Route path="/contact" element={<><Navbar /><Contact /></>} />

  <Route path="/cart" element={<ProtectedRoute><Navbar /><Cart /></ProtectedRoute>} />
  <Route path="/wishlist" element={<ProtectedRoute><Navbar /><Wishlist /></ProtectedRoute>} />
  <Route path="/payment" element={<ProtectedRoute><Navbar /><Payment /></ProtectedRoute>} />
  <Route path="/myorders" element={<ProtectedRoute><Navbar /><MyOrders /></ProtectedRoute>} />

  

  <Route path="/admin/dashboard" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />

  <Route path="/admin/orders" element={<AdminProtectedRoute><ManageOrders /></AdminProtectedRoute>} />

  <Route path="/admin/orders/:id" element={<AdminProtectedRoute><OrderDetails /></AdminProtectedRoute>} />

  <Route path="/admin/products" element={<AdminProtectedRoute><ManageProducts /></AdminProtectedRoute>} />

  <Route path="/admin/users" element={<AdminProtectedRoute><ManageUsers /></AdminProtectedRoute>} />
  
</Routes>

      <ToastContainer autoClose={1500} />

    </CartProvider>
  );
};

export default App;

