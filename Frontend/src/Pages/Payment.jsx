import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../Context/CartContext';
import { toast } from 'react-toastify';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useFormik } from "formik";
import * as Yup from "yup";
import { useAuth } from "../Context/CartContext";
import axiosInstance from '../utils/axiosInstance';

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const Payment = () => {
  const navigate = useNavigate();
  const { cartItems, getTotalPrice, clearCart } = useCart();
  const { currentUser, isSessionActive, validateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("razorpay");

  const validationSchema = Yup.object({
    fullName: Yup.string().required("Full Name is required"),
    phone: Yup.string()
      .matches(/^\d{10}$/, "Phone number must be 10 digits")
      .required("Phone number is required"),
    address: Yup.string().required("Address is required"),
    state: Yup.string().required("State is required"),
    pincode: Yup.string()
      .matches(/^\d{6}$/, "Pincode must be 6 digits")
      .required("Pincode is required"),
  });

  const formik = useFormik({
    initialValues: {
      fullName: "",
      phone: "",
      address: "",
      state: "",
      pincode: "",
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      const isValid = await validateUser();
      if (!isValid) {
        toast.error("Account blocked or session expired");
        navigate("/login");
        return;
      }

      if (!currentUser || !isSessionActive()) {
        toast.error("User not logged in");
        navigate("/login");
        return;
      }

      // Cash on Delivery checkout path
      if (selectedPaymentMethod === "cod") {
        setLoading(true);
        try {
          const orderData = {
            orderId: `ORD${Date.now().toString().slice(-6)}`,
            userId: currentUser?.id || 'guest',
            userName: values.fullName,
            userEmail: currentUser?.email || 'guest@example.com',
            userPhone: values.phone,
            shippingAddress: {
              address: values.address,
              state: values.state,
              pincode: values.pincode
            },
            paymentMethod: "cod",
            items: cartItems.map(item => ({
              productId: item.productId,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              image: item.image
            })),
            subtotal: getTotalPrice(),
            shipping: shippingCost,
            total: finalTotal,
            orderDate: new Date().toISOString(),
            status: 'confirmed'
          };

          await axiosInstance.post("/user/orders/cod", {
            client_order_details: orderData
          });

          await clearCart();
          toast.success("Order Placed Successfully! (Cash on Delivery)");
          setLoading(false);
          navigate("/myorders");
        } catch (error) {
          console.error("COD order failed:", error);
          toast.error("Failed to place Cash on Delivery order. Please try again.");
          setLoading(false);
        }
        return;
      }

      // Online payment checkout path via Razorpay
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error("Failed to load Razorpay SDK. Check your internet connection.");
        return;
      }

      setLoading(true);

      try {
        // 1. Create a Razorpay Order on the backend
        const { data: orderResponse } = await axiosInstance.post("/user/payments/order", {
          amount: finalTotal,
        });

        // 2. Prepare order details for verification saving
        const orderData = {
          orderId: `ORD${Date.now().toString().slice(-6)}`,
          userId: currentUser?.id || 'guest',
          userName: values.fullName,
          userEmail: currentUser?.email || 'guest@example.com',
          userPhone: values.phone,
          shippingAddress: {
            address: values.address,
            state: values.state,
            pincode: values.pincode
          },
          paymentMethod: "razorpay",
          items: cartItems.map(item => ({
            productId: item.productId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            image: item.image
          })),
          subtotal: getTotalPrice(),
          shipping: shippingCost,
          total: finalTotal,
          orderDate: new Date().toISOString(),
          status: 'processing'
        };

        // 3. Configure Razorpay modal
        const options = {
          key: orderResponse.key_id,
          amount: orderResponse.amount,
          currency: "INR",
          name: "HygieneHub",
          description: "Complete your premium hygiene purchase",
          order_id: orderResponse.razorpay_order_id,
          handler: async function (response) {
            try {
              // 4. Send transaction details for local verification and saving
              await axiosInstance.post("/user/payments/verify", {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                client_order_details: orderData
              });

              await clearCart();
              toast.success("Payment Successful! Order Placed.");
              setLoading(false);
              navigate("/myorders");
            } catch (err) {
              console.error("Verification error:", err);
              toast.error("Payment verification failed. Please contact support.");
              setLoading(false);
            }
          },
          prefill: {
            name: values.fullName,
            email: currentUser?.email || "",
            contact: values.phone,
          },
          theme: {
            color: "#16a34a", // beautiful theme green matching branding
          },
          modal: {
            ondismiss: function () {
              setLoading(false);
              toast.info("Payment cancelled.");
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } catch (error) {
        console.error('Order failed:', error);
        toast.error("Failed to process payment. Please try again.");
        setLoading(false);
      }
    },
  });

  const shippingCost = cartItems.length > 0 ? 40 : 0;
  const finalTotal = getTotalPrice() + shippingCost;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="pt-20 pb-16 max-w-6xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">Complete Your Order</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          <div className="lg:col-span-3">
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 mb-6">
              <h2 className="text-xl font-bold mb-4 text-gray-800">Order Summary</h2>

              {cartItems.map(item => (
                <div key={item.id} className="flex justify-between py-3 border-b border-gray-100">
                  <div className="flex gap-3">
                    <img src={item.image} alt="" className="w-12 h-12 bg-gray-50 object-contain rounded-xl border border-gray-100" />
                    <div>
                      <p className="font-semibold text-gray-800">{item.name}</p>
                      <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <span className="font-bold text-gray-800">₹{item.price * item.quantity}</span>
                </div>
              ))}

              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>₹{getTotalPrice()}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span>₹{shippingCost}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-4 border-t border-gray-100 mt-2">
                  <span className="text-gray-800">Total Amount</span>
                  <span className="text-green-600">₹{finalTotal}</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
              <form onSubmit={formik.handleSubmit}>
                <h2 className="text-xl font-bold mb-4 text-gray-800">Delivery Address</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block mb-1 font-medium text-gray-700">Full Name *</label>
                    <input
                      name="fullName"
                      value={formik.values.fullName}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Enter full name"
                    />
                    {formik.touched.fullName && formik.errors.fullName && (
                      <p className="text-red-500 text-sm mt-1">{formik.errors.fullName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block mb-1 font-medium text-gray-700">Phone Number *</label>
                    <input
                      name="phone"
                      maxLength="10"
                      value={formik.values.phone}
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, "").slice(0, 10);
                        formik.setFieldValue("phone", v);
                      }}
                      onBlur={formik.handleBlur}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="10 digit phone number"
                    />
                    {formik.touched.phone && formik.errors.phone && (
                      <p className="text-red-500 text-sm mt-1">{formik.errors.phone}</p>
                    )}
                  </div>

                  <div>
                    <label className="block mb-1 font-medium text-gray-700">Full Address *</label>
                    <textarea
                      name="address"
                      rows="3"
                      value={formik.values.address}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="House/Apartment, Street, Area"
                    />
                    {formik.touched.address && formik.errors.address && (
                      <p className="text-red-500 text-sm mt-1">{formik.errors.address}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-1 font-medium text-gray-700">State *</label>
                      <input
                        name="state"
                        value={formik.values.state}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="State"
                      />
                      {formik.touched.state && formik.errors.state && (
                        <p className="text-red-500 text-sm mt-1">{formik.errors.state}</p>
                      )}
                    </div>

                    <div>
                      <label className="block mb-1 font-medium text-gray-700">Pincode *</label>
                      <input
                        name="pincode"
                        maxLength="6"
                        value={formik.values.pincode}
                        onChange={(e) => {
                          const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                          formik.setFieldValue("pincode", v);
                        }}
                        onBlur={formik.handleBlur}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="6 digit pincode"
                      />
                      {formik.touched.pincode && formik.errors.pincode && (
                        <p className="text-red-500 text-sm mt-1">{formik.errors.pincode}</p>
                      )}
                    </div>
                  </div>
                </div>

                <h2 className="text-xl font-bold mb-4 mt-8 text-gray-800">Select Payment Method</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div
                    onClick={() => setSelectedPaymentMethod("razorpay")}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 flex flex-col justify-between ${
                      selectedPaymentMethod === "razorpay"
                        ? "border-green-600 bg-green-50/50 shadow-md"
                        : "border-gray-200 hover:border-green-400 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-800">Online Payment</span>
                      <input
                        type="radio"
                        name="paymentMethodSelect"
                        checked={selectedPaymentMethod === "razorpay"}
                        onChange={() => setSelectedPaymentMethod("razorpay")}
                        className="text-green-600 focus:ring-green-500 h-4 w-4"
                      />
                    </div>
                    <p className="text-sm text-gray-500 mt-2">Pay securely online using Cards, UPI, Netbanking via Razorpay.</p>
                  </div>

                  <div
                    onClick={() => setSelectedPaymentMethod("cod")}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 flex flex-col justify-between ${
                      selectedPaymentMethod === "cod"
                        ? "border-green-600 bg-green-50/50 shadow-md"
                        : "border-gray-200 hover:border-green-400 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-800">Cash on Delivery (COD)</span>
                      <input
                        type="radio"
                        name="paymentMethodSelect"
                        checked={selectedPaymentMethod === "cod"}
                        onChange={() => setSelectedPaymentMethod("cod")}
                        className="text-green-600 focus:ring-green-500 h-4 w-4"
                      />
                    </div>
                    <p className="text-sm text-gray-500 mt-2">Pay in cash when your order gets delivered to your doorstep.</p>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
                  <div className="flex items-center gap-3 text-gray-600 bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-100">
                    <span className="text-xl">{selectedPaymentMethod === "cod" ? "📦" : "🛡️"}</span>
                    <span className="text-sm">
                      {selectedPaymentMethod === "cod" 
                        ? "Pay in cash upon delivery" 
                        : "Secure Payment processed via Razorpay"}
                    </span>
                  </div>

                  <div className="flex gap-4 w-full md:w-auto">
                    <button
                      type="button"
                      onClick={() => navigate("/cart")}
                      className="px-6 py-3 border border-green-600 text-green-600 font-semibold rounded-xl hover:bg-green-50 transition"
                    >
                      Back to Cart
                    </button>

                    <button
                      type="submit"
                      disabled={loading}
                      className={`flex-grow md:flex-none px-8 py-3 rounded-xl font-semibold bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition disabled:opacity-50 flex items-center justify-center gap-2`}
                    >
                      {loading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Processing...
                        </>
                      ) : (
                        selectedPaymentMethod === "cod" 
                          ? `Place COD Order ₹${finalTotal}`
                          : `Pay Securely ₹${finalTotal}`
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Payment;
