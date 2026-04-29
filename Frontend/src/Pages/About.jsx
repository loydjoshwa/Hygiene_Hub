import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const About = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <section className="bg-gradient-to-r from-green-500 to-blue-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6">About Hygiene Hub.</h1>
          <p className="text-xl max-w-3xl mx-auto">
            Your trusted partner in premium hygiene products since 2019
          </p>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-800 mb-6">Our Mission</h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                At Hygiene Hub, we believe that cleanliness and self-care should be accessible to everyone. 
                Our mission is to provide high-quality, natural hygiene products that are effective, 
                environmentally friendly, and gentle on your skin.
              </p>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                We combine traditional herbal wisdom with modern scientific research to create products 
                that not only clean but also nourish and protect your skin.
              </p>
              <div className="flex gap-4">
                <Link
                  to="/products"
                  className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors duration-300"
                >
                  Shop Products
                </Link>
                <Link
                  
                  className="border-2 border-green-600 text-green-600 px-6 py-3 rounded-lg font-semibold hover:bg-green-600 hover:text-white transition-colors duration-300"
                >
                  Contact Us
                </Link>
              </div>
            </div>
            <div className="bg-green-50 rounded-2xl p-8">
              <div className="text-6xl text-green-600 text-center mb-4">
                🌿
              </div>
              <h3 className="text-2xl font-bold text-center text-gray-800 mb-4">Our Values</h3>
              <ul className="space-y-3">
                <li className="flex items-center text-gray-700">
                  <span className="text-green-500 mr-3">✓</span>
                  Natural & Herbal Ingredients
                </li>
                <li className="flex items-center text-gray-700">
                  <span className="text-green-500 mr-3">✓</span>
                  Environmentally Conscious
                </li>
                <li className="flex items-center text-gray-700">
                  <span className="text-green-500 mr-3">✓</span>
                  Cruelty-Free Products
                </li>
                <li className="flex items-center text-gray-700">
                  <span className="text-green-500 mr-3">✓</span>
                  Customer Satisfaction
                </li>
                <li className="flex items-center text-gray-700">
                  <span className="text-green-500 mr-3">✓</span>
                  Affordable Quality
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Our Story</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              From a small idea to a trusted brand in hygiene products
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💡</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">The Beginning</h3>
              <p className="text-gray-600">
                Started in 2020 with a vision to create natural hygiene products that are both effective and eco-friendly.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🚀</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Growth</h3>
              <p className="text-gray-600">
                Expanded our product line to include various natural handwash formulas loved by thousands of customers.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🌟</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Today</h3>
              <p className="text-gray-600">
                Continuing to innovate while staying true to our core values of quality and sustainability.
              </p>
            </div>
          </div>
        </div>
      </section>

      
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Why Choose Us?</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🌱</span>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">100% Natural</h3>
              <p className="text-gray-600">All our products are made from natural ingredients</p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">💧</span>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Gentle Formula</h3>
              <p className="text-gray-600">Safe for all skin types including sensitive skin</p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🌍</span>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Eco-Friendly</h3>
              <p className="text-gray-600">Sustainable packaging and production methods</p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">💝</span>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Cruelty-Free</h3>
              <p className="text-gray-600">Never tested on animals</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-r from-green-500 to-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Experience the Difference?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join our community of satisfied customers and discover the perfect hygiene products for your needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/products"
              className="bg-white text-green-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors duration-300"
            >
              Shop Now
            </Link>
            <Link
              
              className="border-2 border-white text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-white hover:text-green-600 transition-colors duration-300"
            >
              Get In Touch
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;