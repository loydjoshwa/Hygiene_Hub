import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import Footer from '../components/Footer'; 
import Navbar from '../components/Navbar';
import { useCart, useAuth } from '../Context/CartContext';

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const { addToWishlist, currentUser, isInWishlist , isSessionActive} = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        const response = await axios.get('http://localhost:3130/products');
        const products = response.data.slice(0, 4);
        setFeaturedProducts(products);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching products:', error);
        toast.error('Failed to load featured products');
        setLoading(false);
      }
    };

    fetchFeaturedProducts();
  }, []);

  const handleAddToCart = async (product) => {
    if (!currentUser || !isSessionActive()) {
      toast.error('Please login to add items to cart');
      navigate('/login');
      return;
    }

    try {
      await addToCart(product);
      toast.success(`${product.name} added to cart!`);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleAddToWishlist = async (product) => {
    if (!currentUser || !isSessionActive()) {
      toast.error('Please login to add items to wishlist');
      navigate('/login');
      return;
    }

    try {
      const added = await addToWishlist(product);
      if (added) {
        toast.success(`${product.name} added to wishlist!`);
      } else {
        toast.info(`${product.name} is already in your wishlist!`);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  return ( 
    <>
      <Navbar />
      <div className="bg-gradient-to-b from-blue-50 via-white to-green-50"> 
        
        <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-green-500 to-emerald-400 py-20">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
          
          <div className="max-w-7xl mx-auto px-4 relative z-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-12">
              <div className="md:w-1/2">
                <div className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full mb-6">
                  <span className="text-white text-sm font-semibold">✨ Premium Hygiene Products</span>
                </div>
                <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
                  Fresh & Natural
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-emerald-200">
                    Hand Care Collection
                  </span>
                </h1>
                <p className="text-xl text-white/90 mb-8 leading-relaxed">
                  Discover our collection of natural, refreshing handwash products 
                  that combine effective cleaning with skin-friendly ingredients.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    to="/products"
                    className="group bg-white text-green-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-2xl text-center flex items-center justify-center gap-2"
                  >
                    Shop Now
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </Link>
                  <Link
                    to="/about"
                    className="group border-2 border-white text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/20 transition-all duration-300 transform hover:-translate-y-1 text-center flex items-center justify-center gap-2"
                  >
                     Learn More
                  </Link>
                </div>
              </div>
              
              <div className="md:w-1/2">
                <div className="relative">
                  <div className="bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500">
                    <div className="text-7xl text-white text-center mb-4 animate-bounce">
                      🧴✨
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                      <p className="text-center text-white font-semibold text-lg">
                        Fresh & Natural Handwash Collection
                      </p>
                      <p className="text-center text-white/80 text-sm mt-2">
                        100% Natural Ingredients • Cruelty-Free • Eco-Friendly
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 bg-gradient-to-b from-white to-blue-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-16">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-full mb-6 shadow-lg">
                <span className="text-2xl text-white">⭐</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">Featured Products</h2>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">Handpicked selection of our premium handwash products with natural ingredients</p>
              <div className="w-24 h-1 bg-gradient-to-r from-green-500 to-blue-500 mx-auto mt-6 rounded-full"></div>
            </div>

            {loading ? (
              <div className="text-center py-16">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
                <p className="text-gray-600 mt-4">Loading featured products...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {featuredProducts.map(product => (
                  <div
                    key={product.id} 
                    className="group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-green-200 relative"
                  >
                    <div className="absolute top-4 left-4 bg-gradient-to-r from-green-500 to-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold z-10">
                      FEATURED
                    </div>
                    
                    <div className="h-56 bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-6 group-hover:scale-105 transition-transform duration-300">
                      <img 
                        src={product.image} 
                        alt={product.name}
                        className="h-full w-full object-contain group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>

                    <div className="p-6">
                      <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2 group-hover:text-green-600 transition-colors">
                        {product.name}
                      </h3>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {product.description}
                      </p>
                      
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">₹{product.price}</span>
                        <div className="flex items-center bg-yellow-50 px-2 py-1 rounded-full">
                          <div className="flex text-yellow-400">
                            {'★'.repeat(Math.floor(product.rating))}
                            {'☆'.repeat(5 - Math.floor(product.rating))}
                          </div>
                          <span className="text-sm text-gray-600 ml-1">({product.rating})</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAddToCart(product)}
                          className="flex-1 group/cart bg-gradient-to-r from-green-500 to-blue-500 text-white py-3 px-4 rounded-xl hover:from-green-600 hover:to-blue-600 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center gap-2"
                        >
                          <span className="group-hover/cart:rotate-12 transition-transform">🛒</span>
                          Add to Cart
                        </button>
                        
                        <button
                          onClick={() => handleAddToWishlist(product)}
                          className="group/wishlist relative p-3 rounded-xl transition-all duration-300 transform hover:-translate-y-1 bg-white shadow-md hover:shadow-lg border border-gray-200 hover:border-red-300"
                          title={isInWishlist(product.id) ? "Remove from Wishlist" : "Add to Wishlist"}
                        >
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            className={`h-6 w-6 transition-all duration-300 ${
                              isInWishlist(product.id) 
                                ? 'text-red-500 fill-current scale-110' 
                                : 'text-gray-500 group-hover/wishlist:text-red-500'
                            }`} 
                            fill={isInWishlist(product.id) ? "currentColor" : "none"}
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                            strokeWidth="1.5"
                          >
                            <path 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" 
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="text-center mt-16">
              <Link
                to="/products"
                className="inline-flex items-center gap-3 bg-gradient-to-r from-green-600 to-blue-600 text-white px-10 py-4 rounded-xl font-bold text-lg hover:from-green-700 hover:to-blue-700 transition-all duration-300 transform hover:-translate-y-1 shadow-xl hover:shadow-2xl"
              >
                <span>🔍</span>
                Explore All Products
                <span className="group-hover:translate-x-2 transition-transform">→</span>
              </Link>
            </div>
          </div>
        </section>

        <section className="py-16 bg-gradient-to-r from-green-600 to-blue-600 text-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-4xl font-bold mb-2">500+</div>
                <p className="text-white/80">Happy Customers</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold mb-2">100%</div>
                <p className="text-white/80">Natural Ingredients</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold mb-2">50+</div>
                <p className="text-white/80">Products</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold mb-2">24/7</div>
                <p className="text-white/80">Customer Support</p>
              </div>
            </div>
          </div>
        </section>

        <Footer /> 
      </div> 
    </>
  );
};

export default Home;