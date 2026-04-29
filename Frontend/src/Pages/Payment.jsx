import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../Context/CartContext';
import { toast } from 'react-toastify';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useFormik } from "formik";
import * as Yup from "yup";
import { useAuth } from "../Context/CartContext";   

const Payment = () => {
  const navigate = useNavigate();
  const { cartItems, getTotalPrice, clearCart, createOrder } = useCart();
  const { currentUser,isSessionActive,validateUser } = useAuth();

  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card'); 

  const cardValidationSchema = Yup.object({
    fullName: Yup.string().required("Full Name is required"),
    phone: Yup.string()
      .matches(/^\d{10}$/, "Phone number must be 10 digits")
      .required("Phone number is required"),
    address: Yup.string().required("Address is required"),
    state: Yup.string().required("State is required"),
    pincode: Yup.string()
      .matches(/^\d{6}$/, "Pincode must be 6 digits")
      .required("Pincode is required"),
    cardNumber: Yup.string()
      .matches(/^\d{16}$/, "Card number must be 16 digits")
      .required("Card number is required"),
    cardName: Yup.string().required("Cardholder name is required"),
    expiryDate: Yup.string()
      .matches(/^\d{2}\/\d{2}$/, "Expiry must be MM/YY format")
      .required("Expiry date is required"),
    cvv: Yup.string()
      .matches(/^\d{3}$/, "CVV must be 3 digits")
      .required("CVV is required"),
  });

  const upiValidationSchema = Yup.object({
    fullName: Yup.string().required("Full Name is required"),
    phone: Yup.string()
      .matches(/^\d{10}$/, "Phone number must be 10 digits")
      .required("Phone number is required"),
    address: Yup.string().required("Address is required"),
    state: Yup.string().required("State is required"),
    pincode: Yup.string()
      .matches(/^\d{6}$/, "Pincode must be 6 digits")
      .required("Pincode is required"),
    upiId: Yup.string()
      .matches(/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/, "Enter valid UPI ID (e.g., username@upi)")
      .required("UPI ID is required"),
  });

  const validationSchema = paymentMethod === 'card' ? cardValidationSchema : upiValidationSchema;

  const formik = useFormik({
    initialValues: {
      fullName: "",
      phone: "",
      address: "",
      state: "",
      pincode: "",
      cardNumber: "",
      cardName: "",
      expiryDate: "",
      cvv: "",
      upiId: "",
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
        console.log("user not logged in")
        navigate("/login");
        return;
      }

      setLoading(true);
      
      try {
        const orderData = {
          // eslint-disable-next-line react-hooks/purity
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
          paymentMethod: paymentMethod,
          paymentDetails: paymentMethod === 'card' ? {
            cardLastFour: values.cardNumber.slice(-4),
            cardName: values.cardName
          } : {
            upiId: values.upiId,
            status: 'pending'
          },
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

        await createOrder(orderData);
        await clearCart();

        toast.success(
          <div>
            <div className="font-bold"> Order Placed Successfully!</div>
            <div>Payment via {paymentMethod === 'card' ? 'Credit/Debit Card' : 'UPI'} initiated</div>
          </div>,
          {
            autoClose: 4000,
            position: "top-center"
          }
        );

        setLoading(false);
        setTimeout(() => navigate("/"), 1000);
      } catch (error) {
        console.error('Order failed:', error);
        toast.error(`Failed to process ${paymentMethod === 'card' ? 'card' : 'UPI'} payment. Please try again.`);
        setLoading(false);
      }
    },
  });

  const shippingCost = cartItems.length > 0 ? 40 : 0;
  const finalTotal = getTotalPrice() + shippingCost;

  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method);
    formik.setErrors({});
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="pt-20 pb-16 max-w-6xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-center">Complete Your Order</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          <div className="lg:col-span-3">
            <div className="bg-white p-6 rounded-lg shadow mb-6">
              <h2 className="text-xl font-bold mb-4">Order Summary</h2>

              {cartItems.map(item => (
                <div key={item.id} className="flex justify-between py-3 border-b">
                  <div className="flex gap-3">
                    <img src={item.image} alt="" className="w-12 h-12 bg-gray-100 rounded" />
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <span className="font-medium">₹{item.price * item.quantity}</span>
                </div>
              ))}

              <div className="mt-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{getTotalPrice()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>₹{shippingCost}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t mt-2">
                  <span>Total Amount</span>
                  <span className="text-green-600">₹{finalTotal}</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <form onSubmit={formik.handleSubmit}>
                <h2 className="text-xl font-bold mb-4">Delivery Address</h2>

                <label>Full Name *</label>
                <input
                  name="fullName"
                  value={formik.values.fullName}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className="input-field"
                  placeholder="Enter full name"
                />
                {formik.touched.fullName && formik.errors.fullName && (
                  <p className="text-red-600 text-sm">{formik.errors.fullName}</p>
                )}

                <label className="mt-4 block">Phone Number *</label>
                <input
                  name="phone"
                  maxLength="10"
                  value={formik.values.phone}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "").slice(0, 10);
                    formik.setFieldValue("phone", v);
                  }}
                  onBlur={formik.handleBlur}
                  className="input-field"
                  placeholder="10 digit phone"
                />
                {formik.touched.phone && formik.errors.phone && (
                  <p className="text-red-600 text-sm">{formik.errors.phone}</p>
                )}

                <label className="mt-4 block">Full Address *</label>
                <textarea
                  name="address"
                  rows="3"
                  value={formik.values.address}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className="input-field"
                  placeholder="House, Street, Area"
                />
                {formik.touched.address && formik.errors.address && (
                  <p className="text-red-600 text-sm">{formik.errors.address}</p>
                )}

                <label className="mt-4 block">State *</label>
                <input
                  name="state"
                  value={formik.values.state}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className="input-field"
                  placeholder="State"
                />
                {formik.touched.state && formik.errors.state && (
                  <p className="text-red-600 text-sm">{formik.errors.state}</p>
                )}

                <label className="mt-4 block">Pincode *</label>
                <input
                  name="pincode"
                  maxLength="6"
                  value={formik.values.pincode}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                    formik.setFieldValue("pincode", v);
                  }}
                  onBlur={formik.handleBlur}
                  className="input-field"
                  placeholder="6 digit pincode"
                />
                {formik.touched.pincode && formik.errors.pincode && (
                  <p className="text-red-600 text-sm">{formik.errors.pincode}</p>
                )}

                <h2 className="text-xl font-bold mt-8 mb-4">Payment Method</h2>
                
                <div className="flex gap-4 mb-6">
                  <button
                    type="button"
                    onClick={() => handlePaymentMethodChange('card')}
                    className={`px-4 py-2 rounded-lg border ${paymentMethod === 'card' ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-300'}`}
                  >
                    Credit/Debit Card
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePaymentMethodChange('upi')}
                    className={`px-4 py-2 rounded-lg border ${paymentMethod === 'upi' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-300'}`}
                  >
                    UPI
                  </button>
                </div>

                {paymentMethod === 'card' ? (
                  <>
                    <h3 className="text-lg font-bold mb-4">Card Payment Details</h3>

                    <label>Card Number *</label>
                    <input
                      name="cardNumber"
                      maxLength="16"
                      value={formik.values.cardNumber}
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, "").slice(0, 16);
                        formik.setFieldValue("cardNumber", v);
                      }}
                      onBlur={formik.handleBlur}
                      className="input-field"
                      placeholder="16 digit card number"
                    />
                    {formik.touched.cardNumber && formik.errors.cardNumber && (
                      <p className="text-red-600 text-sm">{formik.errors.cardNumber}</p>
                    )}

                    <label className="mt-4 block">Cardholder Name *</label>
                    <input
                      name="cardName"
                      value={formik.values.cardName}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className="input-field"
                      placeholder="Name on card"
                    />
                    {formik.touched.cardName && formik.errors.cardName && (
                      <p className="text-red-600 text-sm">{formik.errors.cardName}</p>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="mt-4 block">Expiry Date (MM/YY) *</label>
                        <input
                          name="expiryDate"
                          maxLength="5"
                          value={formik.values.expiryDate}
                          onChange={(e) => {
                            let v = e.target.value.replace(/\D/g, "");
                            if (v.length >= 3) v = v.slice(0, 2) + "/" + v.slice(2, 4);
                            formik.setFieldValue("expiryDate", v);
                          }}
                          onBlur={formik.handleBlur}
                          className="input-field"
                          placeholder="MM/YY"
                        />
                        {formik.touched.expiryDate && formik.errors.expiryDate && (
                          <p className="text-red-600 text-sm">{formik.errors.expiryDate}</p>
                        )}
                      </div>

                      <div>
                        <label className="mt-4 block">CVV *</label>
                        <input
                          name="cvv"
                          maxLength="3"
                          value={formik.values.cvv}
                          onChange={(e) => {
                            const v = e.target.value.replace(/\D/g, "").slice(0, 3);
                            formik.setFieldValue("cvv", v);
                          }}
                          onBlur={formik.handleBlur}
                          className="input-field"
                          placeholder="123"
                        />
                        {formik.touched.cvv && formik.errors.cvv && (
                          <p className="text-red-600 text-sm">{formik.errors.cvv}</p>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-bold mb-4">UPI Payment Details</h3>
                    
                    <div className="mb-4">
                      <label className="block mb-2">Enter UPI ID *</label>
                      <input
                        name="upiId"
                        value={formik.values.upiId}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        className="input-field"
                        placeholder="username@upi (e.g., username@oksbi, username@ybl)"
                      />
                      {formik.touched.upiId && formik.errors.upiId && (
                        <p className="text-red-600 text-sm mt-1">{formik.errors.upiId}</p>
                      )}
                    </div>
                  </>
                )}

                <div className="flex gap-4 mt-6">
                  <button
                    type="button"
                    onClick={() => navigate("/cart")}
                    className="border border-green-600 text-green-600 px-6 py-3 rounded-lg hover:bg-green-50"
                  >
                    Back to Cart
                  </button>

                  <button
                    type="submit"
                    disabled={loading}
                    className={`flex-1 px-6 py-3 rounded-lg ${loading ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'} text-white`}
                  >
                    {loading ? "Processing..." : `Pay ₹${finalTotal}`}
                  </button>
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
