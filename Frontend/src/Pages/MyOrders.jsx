import React, { useEffect, useState } from "react";
import axiosInstance from "../utils/axiosInstance";
import { useAuth } from "../Context/CartContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { toast } from "react-toastify";

const MyOrders = () => {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [wallet, setWallet] = useState({ balance: 0 });

  // Return product modal state
  const [showModal, setShowModal] = useState(false);
  const [activeReturnInfo, setActiveReturnInfo] = useState({ orderId: "", itemId: "", productName: "" });
  const [returnReason, setReturnReason] = useState("Defective/broken product");
  const [returnDetails, setReturnDetails] = useState("");

  const fetchData = async () => {
    if (currentUser) {
      try {
        const [ordersRes, walletRes] = await Promise.all([
          axiosInstance.get("/user/orders"),
          axiosInstance.get("/user/wallet")
        ]);
        setOrders(ordersRes.data || []);
        setWallet(walletRes.data || { balance: 0 });
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUser]);

  const handleCancelOrder = async (orderId) => {
    if (window.confirm("Are you sure you want to cancel this order?")) {
      try {
        await axiosInstance.patch(`/user/orders/${orderId}/cancel`);
        toast.success("Order cancelled successfully");
        fetchData();
      } catch (err) {
        console.error(err);
        toast.error(err.response?.data?.error || "Failed to cancel order");
      }
    }
  };

  const openReturnModal = (orderId, itemId, productName) => {
    setActiveReturnInfo({ orderId, itemId, productName });
    setReturnReason("Defective/broken product");
    setReturnDetails("");
    setShowModal(true);
  };

  const handleReturnSubmit = async () => {
    if (!returnDetails.trim()) {
      toast.warn("Please provide description details about the defect/return");
      return;
    }

    try {
      const fullReason = `${returnReason}: ${returnDetails}`;
      await axiosInstance.post(`/user/orders/${activeReturnInfo.orderId}/return`, {
        orderItemId: activeReturnInfo.itemId,
        reason: fullReason
      });

      toast.success("Return processed successfully. Refund credited to wallet!");
      setShowModal(false);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Failed to process return");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar />

      <div className="pt-24 max-w-5xl mx-auto p-4 flex-grow w-full">
        
        {/* Modern Wallet Card Widget */}
        <div className="bg-gradient-to-r from-indigo-700 via-blue-600 to-cyan-500 rounded-3xl p-6 text-white shadow-xl mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all duration-300 hover:shadow-2xl">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-100">Digital Refund Wallet Balance</h2>
            <p className="text-4xl font-black mt-2 tracking-tight">₹{wallet.balance.toLocaleString()}</p>
          </div>
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/20">
            <svg className="w-8 h-8 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            <div>
              <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">Account Status</p>
              <p className="text-xs font-bold">Secure Verified Wallet</p>
            </div>
          </div>
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 mb-8">My Orders</h1>

        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-150 p-12 text-center shadow-sm">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-gray-500 text-lg font-medium">You have no previous orders.</p>
          </div>
        ) : (
          orders.map(order => (
            <div key={order.id} className="bg-white p-6 mb-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
              <div className="flex flex-wrap justify-between gap-4 mb-5 text-sm md:text-base border-b pb-4 border-gray-100">
                <p><strong className="text-gray-700">Order ID:</strong> <span className="font-mono text-[#0065F8] font-bold">{order.orderId}</span></p>
                <p><strong className="text-gray-700">Date:</strong> {new Date(order.orderDate).toLocaleString()}</p>
                <p>
                  <strong className="text-gray-700">Status:</strong>{" "}
                  <span className={`capitalize font-bold px-2.5 py-1 rounded-md text-xs border ${
                    order.status === 'delivered' ? 'bg-green-50 text-green-700 border-green-200' :
                    order.status === 'cancelled' ? 'bg-red-50 text-red-700 border-red-200' :
                    'bg-yellow-50 text-yellow-700 border-yellow-200'
                  }`}>
                    {order.status}
                  </span>
                </p>
                <p><strong className="text-gray-700">Payment:</strong> <span className="uppercase font-semibold">{order.paymentMethod || 'razorpay'}</span></p>
              </div>

              <div className="pt-2">
                <h3 className="font-bold mb-4 text-gray-800 tracking-wide text-sm uppercase">Items In Order:</h3>
                <div className="space-y-4">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 border-b border-slate-50 pb-4 last:border-b-0 last:pb-0">
                      <img 
                        src={item.image || 'https://via.placeholder.com/64'} 
                        alt={item.name} 
                        className="w-16 h-16 object-contain bg-gray-50 rounded-xl border border-gray-150 p-1 flex-shrink-0"
                      />
                      <div className="flex-grow min-w-0">
                        <p className="font-semibold text-gray-800 text-sm sm:text-base truncate">{item.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">Quantity: {item.quantity}</p>
                      </div>
                      
                      {/* Price and return logic */}
                      <div className="w-full sm:w-auto text-left sm:text-right mt-2 sm:mt-0 flex sm:flex-col justify-between sm:justify-start items-center sm:items-end">
                        <div>
                          <p className="font-bold text-gray-900 text-base">₹{item.price * item.quantity}</p>
                          <p className="text-[10px] text-gray-400 font-medium">₹{item.price} each</p>
                        </div>
                        
                        {order.status === 'delivered' && (
                          <div className="mt-2">
                            {item.isReturned ? (
                              <div className="text-left sm:text-right">
                                <span className="inline-block px-2.5 py-1 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-lg border border-amber-200 uppercase tracking-wider">
                                  Returned
                                </span>
                                {item.returnReason && (
                                  <p className="text-[10px] text-slate-500 italic mt-1 max-w-[150px] truncate" title={item.returnReason}>
                                    "{item.returnReason}"
                                  </p>
                                )}
                              </div>
                            ) : (
                              <button
                                onClick={() => openReturnModal(order.id, item.id, item.name)}
                                className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-[11px] font-bold rounded-xl shadow-sm hover:shadow transition-all duration-150 cursor-pointer"
                              >
                                Return Product
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100">
                {order.status !== 'cancelled' && order.status !== 'delivered' ? (
                  <button
                    onClick={() => handleCancelOrder(order.id)}
                    className="px-5 py-2.5 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 text-sm font-semibold transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                  >
                    Cancel Order
                  </button>
                ) : (
                  <div></div>
                )}
                <div className="font-extrabold text-lg text-gray-900">
                  Total Amount: ₹{order.total}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modern Defective Returns Modal Overlay Dialog */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100 transition-all transform scale-100">
            <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-6 text-white">
              <h3 className="text-xl font-bold">Return Request</h3>
              <p className="text-xs text-amber-100 mt-1">Initiating return for defective/damaged item</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Product Name</span>
                <p className="font-bold text-gray-800 text-sm mt-0.5">{activeReturnInfo.productName}</p>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block mb-1">Select Defect / Return Reason</label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                >
                  <option value="Defective/broken product">Defective / broken product</option>
                  <option value="Wrong product received">Wrong product received</option>
                  <option value="Product not matching description">Product not matching description</option>
                  <option value="Quality not as expected">Quality not as expected</option>
                  <option value="Other issues">Other issues</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block mb-1">Explain details of defects</label>
                <textarea
                  placeholder="Explain exactly what is wrong with the product..."
                  value={returnDetails}
                  onChange={(e) => setReturnDetails(e.target.value)}
                  className="w-full h-24 bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 placeholder-gray-400 resize-none font-medium"
                />
              </div>
            </div>

            <div className="p-6 bg-slate-50 flex gap-3 border-t border-slate-100">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2.5 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl text-sm font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleReturnSubmit}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                Submit Return
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default MyOrders;
