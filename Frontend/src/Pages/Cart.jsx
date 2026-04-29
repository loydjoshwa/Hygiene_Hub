import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../Context/CartContext';
import { toast } from 'react-toastify';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Cart = () => {
  const { 
    cartItems, 
    removeFromCart, 
    increaseQuantity, 
    decreaseQuantity, 
    getTotalItems, 
    getTotalPrice,
    clearCart 
  } = useCart();
 const Navigate=useNavigate()
 
  const handleRemoveItem = (productId, productName) => {
    removeFromCart(productId);
    toast.error(`${productName} removed from cart`);
  };

  const handleIncreaseQuantity = (productId, productName) => {
    increaseQuantity(productId);
    toast.info(`Increased quantity of ${productName}`);
  };

  const handleDecreaseQuantity = (productId, productName, quantity) => {
    if (quantity === 1) {
      handleRemoveItem(productId, productName);
    } else {
      decreaseQuantity(productId);
      toast.info(`Decreased quantity of ${productName}`);
    }
  };

  const handleClearCart = () => {
    if (cartItems.length === 0) {
      toast.info('Cart is already empty');
      return;
    }
    clearCart();
    toast.error('Cart cleared');
  };

  const handleCheckout = () => {
   
    Navigate("/payment");
  };

  const shippingCost = getTotalItems() > 0 ? 40 : 0;
  const finalTotal = getTotalPrice() + shippingCost;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">Shopping Cart</h1>
            <p className="text-gray-600">Review your items and proceed to checkout</p>
          </div>

          {cartItems.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-lg shadow-md">
              <div className="text-6xl mb-4">🛒</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Your cart is empty</h2>
              <p className="text-gray-600 mb-8">Looks like you haven't added any products to your cart yet.</p>
              <Link
                to="/products"
                className="bg-green-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-green-700 transition-colors duration-300"
              >
                Continue Shopping
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg shadow-md">
                  <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-800">
                      Cart Items ({getTotalItems()})
                    </h2>
                    <button
                      onClick={handleClearCart}
                      className="text-red-500 hover:text-red-700 font-medium text-sm"
                    >
                      Clear Cart
                    </button>
                  </div>
                  
                  <div className="divide-y divide-gray-200">
                    {cartItems.map((item) => (
                      <div key={item.id} className="p-6 flex flex-col sm:flex-row gap-4">
                        <div className="flex-shrink-0">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-20 h-20 object-contain bg-gray-100 rounded-lg"
                          />
                        </div>
                        
                        <div className="flex-grow">
                          <h3 className="text-lg font-semibold text-gray-800 mb-2">
                            {item.name}
                          </h3>
                          <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                            {item.description}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-2xl font-bold text-green-600">
                              ₹{item.price}
                            </span>
                            <button
                              onClick={() => handleRemoveItem(item.productId, item.name)}
                              className="text-red-500 hover:text-red-700 text-sm font-medium"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between sm:justify-end sm:flex-col sm:items-end gap-4">
                          <div className="flex items-center border border-gray-300 rounded-lg">
                            <button
                              onClick={() => handleDecreaseQuantity(item.productId, item.name, item.quantity)}
                              className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded-l-lg"
                            >
                              -
                            </button>
                            <span className="px-4 py-1 text-gray-800 font-medium">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => handleIncreaseQuantity(item.productId, item.name)}
                              className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded-r-lg"
                            >
                              +
                            </button>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-gray-800">
                              ₹{item.price * item.quantity}
                            </p>
                            <p className="text-sm text-gray-500">
                              ₹{item.price} × {item.quantity}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg shadow-md sticky top-24">
                  <div className="p-6 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-800">Order Summary</h2>
                  </div>
                  
                  <div className="p-6 space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal ({getTotalItems()} items)</span>
                      <span className="font-medium">₹{getTotalPrice()}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shipping</span>
                      <span className="font-medium">₹{shippingCost}</span>
                    </div>
                    
                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total</span>
                        <span className="text-green-600">₹{finalTotal}</span>
                      </div>
                    </div>
                    
                    <button
                      onClick={handleCheckout}
                      className="w-full bg-green-600 text-white py-4 rounded-lg font-semibold hover:bg-green-700 transition-colors duration-300 mt-4"
                    >
                      Proceed to Checkout
                    </button>
                    
                    <Link
                      to="/products"
                      className="w-full border-2 border-green-600 text-green-600 py-4 rounded-lg font-semibold hover:bg-green-600 hover:text-white transition-colors duration-300 text-center block"
                    >
                      Continue Shopping
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Cart;