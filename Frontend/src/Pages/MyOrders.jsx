import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../Context/CartContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const MyOrders = () => {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (currentUser) {
      axios.get("http://localhost:3130/orders")
        .then(res => {
          const userOrders = res.data.filter(order => order.userId === currentUser.id);
          setOrders(userOrders);
        })
        .catch(err => console.log(err));
    }
  }, [currentUser]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="pt-20 max-w-5xl mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">My Orders</h1>

        {orders.length === 0 ? (
          <p className="text-gray-600 text-lg">You have no previous orders.</p>
        ) : (
          orders.map(order => (
            <div key={order.id} className="bg-white p-6 mb-4 rounded-lg shadow">
              <div className="flex justify-between mb-4">
                <p><strong>Order ID:</strong> {order.orderId}</p>
                <p><strong>Date:</strong> {new Date(order.orderDate).toLocaleString()}</p>
                <p><strong>Status:</strong> {order.status}</p>
              </div>

              <div className="border-t pt-2">
                <h3 className="font-semibold mb-2">Items:</h3>
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between border-b py-2">
                    <span>{item.name} ({item.quantity})</span>
                    <span>₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>

              <div className="text-right mt-3 font-bold text-lg">
                Total Paid: ₹{order.total}
              </div>
            </div>
          ))
        )}
      </div>
      <Footer />
    </div>
  );
};

export default MyOrders;    
