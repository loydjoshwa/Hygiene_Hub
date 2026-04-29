import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth, useCart } from '../Context/CartContext';

const Wishlist = () => {
  const navigate=useNavigate()
  const { wishlistItems, removeFromWishlist, currentUser, isSessionActive} = useAuth();
  const { addToCart } = useCart();

  const handleRemoveFromWishlist = (productId, productName) => {
      if (!currentUser|| !isSessionActive()) {
      toast.error('Please login to add items to cart');
      navigate("/login")
      return;
    }
    removeFromWishlist(productId);
    toast.error(`${productName} removed from wishlist`);
  };
  
  const handleAddToCart = async (product) => {
    if (!currentUser|| !isSessionActive()) {
      toast.error('Please login to add items to cart');
      navigate("/login")
      return;
    }

    try {
      await addToCart(product);
      toast.success(`${product.name} added to cart!`);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleMoveAllToCart = async () => {
    if (!currentUser || !isSessionActive()) {
      toast.error('Please login to add items to cart');
     navigate("/login")
      return;
    }

    try {
      for (const item of wishlistItems) {
        await addToCart(item);
      }
      toast.success('All items moved to cart!');
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="pt-20 pb-16">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center py-16 bg-white rounded-lg shadow-md">
              <div className="text-6xl mb-4">❤️</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Please Login</h2>
              <p className="text-gray-600 mb-8">You need to be logged in to view your wishlist.</p>
              <Link
                to="/login"
                className="bg-green-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-green-700 transition-colors duration-300"
              >
                Login Now
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">My Wishlist</h1>
            <p className="text-gray-600">Your favorite handwash products</p>
          </div>

          {wishlistItems.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-lg shadow-md">
              <div className="text-6xl mb-4">❤️</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Your wishlist is empty</h2>
              <p className="text-gray-600 mb-8">Start adding your favorite products to your wishlist!</p>
              <Link
                to="/products"
                className="bg-green-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-green-700 transition-colors duration-300"
              >
                Browse Products
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-800">
                    Wishlist Items ({wishlistItems.length})
                  </h2>
                  <button
                    onClick={handleMoveAllToCart}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors duration-300"
                  >
                    Move All to Cart
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {wishlistItems.map((item) => (
                  <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300">
                    <div className="h-48 bg-gray-100 flex items-center justify-center p-4">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-contain"
                      />
                    </div>

                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">
                        {item.name}
                      </h3>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {item.description}
                      </p>
                      
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-2xl font-bold text-green-600">₹{item.price}</span>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAddToCart(item)}
                          className="flex-1 bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors duration-300 font-medium"
                        >
                          Add to Cart
                        </button>
                        <button
                          onClick={() => handleRemoveFromWishlist(item.productId, item.name)}
                          className="bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors duration-300"
                          title="Remove from Wishlist"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Wishlist;