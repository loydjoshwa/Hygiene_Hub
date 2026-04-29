import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useCart, useAuth } from '../Context/CartContext';
import { useNavigate } from 'react-router-dom';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { addToCart } = useCart();
  const { addToWishlist, currentUser, isInWishlist, isSessionActive } = useAuth();
  const navigate = useNavigate()
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get('http://localhost:3130/products');
        setProducts(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching products:', error);
        toast.error('Failed to load products');
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const filteredProducts = React.useMemo(() => {
    if (searchTerm) {
      return products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return products;
  }, [searchTerm, products]);

  const handleAddToCart = async (product) => {
    if (!currentUser || !isSessionActive()) {
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
  
  const handleAddToWishlist = async (product) => {
    if (!currentUser || !isSessionActive() ) {
      toast.error('Please login to add items to wishlist');
      navigate("/login")
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20 bg-gradient-to-b from-blue-50 to-green-50">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl text-gray-600 font-medium">Loading amazing products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-green-50 pt-20">
      <Navbar />
      
      
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-green-500 py-16 mb-12">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        
        <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Premium Handwash
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-emerald-200">
              Collection
            </span>
          </h1>
          <p className="text-xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed">
            Discover our exclusive range of natural and refreshing handwash products 
            crafted with care for your daily hygiene needs
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-16">
      
        <div className="mb-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
            <div className="w-full md:w-2/3">
              <div className="relative group">
                <input
                  type="text"
                  placeholder="🔍 Search handwash products"
                  className="w-full px-6 py-4 bg-white/80 backdrop-blur-sm border-2 border-white/30 rounded-2xl focus:outline-none focus:ring-4 focus:ring-green-500/30 focus:border-green-500 text-gray-700 text-lg shadow-xl hover:shadow-2xl transition-all duration-300 placeholder-gray-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg">
              {filteredProducts.length} of {products.length} Products
            </div>
          </div>

          
          <div className="flex flex-wrap gap-3 justify-center">
            {['All', 'Natural', 'Herbal', 'Refreshing', 'Moisturizing', 'Antibacterial'].map(tag => (
              <button
                key={tag}
                onClick={() => setSearchTerm(tag === 'All' ? '' : tag)}
                className={`px-4 py-2 rounded-full font-medium transition-all duration-300 transform hover:-translate-y-1 ${
                  searchTerm === tag || (tag === 'All' && !searchTerm)
                    ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-100 shadow'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-white/50 backdrop-blur-sm rounded-3xl shadow-xl">
            <div className="text-7xl mb-6">🔍</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">No Products Found</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Try different search terms or browse our complete collection
            </p>
            <button
              onClick={() => setSearchTerm('')}
              className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-8 py-4 rounded-xl font-bold hover:from-green-600 hover:to-blue-600 transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-xl"
            >
              View All Products
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredProducts.map(product => (
              <div 
                key={product.id} 
                className="group bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 relative"
              >
                
                {/* <div className="absolute top-4 left-4 bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-1 rounded-full text-xs font-bold z-10 shadow-lg">
                  {product.rating > 4.5 ? '🔥 HOT' : '✨ NEW'}
                </div> */}
                
                
                <div className="h-60 bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-6 group-hover:scale-105 transition-transform duration-500 relative overflow-hidden">
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="h-full w-full object-contain group-hover:scale-110 transition-transform duration-700"
                    onError={(e) => {
                      e.target.src = '/placeholder-image.png';
                    }}
                  />
                
                  <div className="absolute inset-0 bg-gradient-to-t from-black/0 to-black/0 group-hover:from-black/5 group-hover:to-black/10 transition-all duration-500"></div>
                </div>

                
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2 group-hover:text-green-600 transition-colors">
                        {product.name}
                      </h3>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2 group-hover:text-gray-700 transition-colors">
                        {product.description}
                      </p>
                    </div>
                    
                    
                    <button
                      onClick={() => handleAddToWishlist(product)}
                      className="group/wishlist relative p-2 rounded-xl transition-all duration-300 transform hover:-translate-y-1 bg-white shadow-md hover:shadow-lg border border-gray-200 hover:border-red-300 ml-2"
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
                  
                  
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <span className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                        ₹{product.price}
                      </span>
                      <p className="text-xs text-gray-500">per piece</p>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="flex items-center bg-yellow-50 px-3 py-1 rounded-full">
                        <div className="flex text-yellow-500 text-sm">
                          {'★'.repeat(Math.floor(product.rating))}
                          {'☆'.repeat(5 - Math.floor(product.rating))}
                        </div>
                        <span className="text-sm font-bold text-gray-700 ml-2">{product.rating}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Customer Rating</p>
                    </div>
                  </div>

                 
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleAddToCart(product)}
                      className="flex-1 group/cart bg-gradient-to-r from-green-500 to-blue-500 text-white py-3 px-4 rounded-xl hover:from-green-600 hover:to-blue-600 transition-all duration-300 font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center gap-2"
                    >
                      <span className="group-hover/cart:rotate-12 transition-transform text-lg">🛒</span>
                      Add to Cart
                      <span className="group-hover/cart:translate-x-1 transition-transform">→</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination/Info */}
        <div className="mt-16 text-center">
          <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-8 shadow-xl inline-block">
            <h4 className="text-xl font-bold text-gray-800 mb-3">Need Help Choosing?</h4>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              All our handwash products are made with natural ingredients, cruelty-free, and environmentally friendly.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-full">
                <span className="text-green-600">🌿</span>
                <span className="text-gray-700 font-medium">Natural Ingredients</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full">
                <span className="text-blue-600">🐰</span>
                <span className="text-gray-700 font-medium">Cruelty-Free</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 rounded-full">
                <span className="text-yellow-600">🌎</span>
                <span className="text-gray-700 font-medium">Eco-Friendly</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Products;