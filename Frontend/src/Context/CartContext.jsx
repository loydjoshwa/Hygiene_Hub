/* eslint-disable */
import React, { createContext, useContext, useState, useEffect } from "react";
import axiosInstance from "../utils/axiosInstance";

const CartContext = createContext();
const AuthContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useCart = () => useContext(CartContext);
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  const isSessionActive = () => {
    return !!localStorage.getItem("currentUser");
  };

  useEffect(() => {
    const stored = localStorage.getItem("currentUser");
    if (stored) setCurrentUser(JSON.parse(stored));
  }, []);

  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === "currentUser" && e.newValue === null) {
        setCurrentUser(null);
        setCartItems([]);
        setWishlistItems([]);
        window.location.href = "/login";
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  async function fetchUserCartItems() {
    if (!currentUser) return;
    try {
      const { data } = await axiosInstance.get("/user/cart");
      const backendItems = data.items || [];
      const mappedItems = backendItems.map((item) => ({
        id: item.id, 
        productId: item.product_id || item.product?.id,
        name: item.product?.name || item.product?.title || "",
        price: item.price,
        image: item.product?.main_image || "",
        description: item.product?.description || "",
        quantity: item.quantity,
        userId: item.user_id,
        stock: item.product?.stock || 0,
      }));
      setCartItems(mappedItems);
    } catch (err) {
      console.error("Error fetching cart:", err);
    }
  }

  async function fetchUserWishlistItems() {
    if (!currentUser) return;
    try {
      const { data } = await axiosInstance.get("/user/wishlist");
      const mappedItems = (data || []).map((item) => ({
        id: item.id,
        productId: item.product_id || item.product?.id,
        name: item.product?.name || item.product?.title || "",
        price: item.product?.price || 0,
        image: item.product?.main_image || "",
        description: item.product?.description || "",
        userId: item.user_id,
        stock: item.product?.stock || 0,
      }));
      setWishlistItems(mappedItems);
    } catch (err) {
      console.error("Error fetching wishlist:", err);
    }
  }

  useEffect(() => {
    if (currentUser) {
      fetchUserCartItems();
      fetchUserWishlistItems();
    } else {
      setCartItems([]);
      setWishlistItems([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const login = async (email, password) => {
    try {
      const res = await axiosInstance.post("/auth/login", { email, password });
      const { access_token, refresh_token, role } = res.data;
      
      localStorage.setItem("access_token", access_token);
      localStorage.setItem("refresh_token", refresh_token);
      
      const profileRes = await axiosInstance.get("/user/dashboard");
      const profile = profileRes.data;
      
      const userObj = {
        id: profile.id,
        name: profile.name,
        role: profile.role,
        email: email
      };
      
      localStorage.setItem("currentUser", JSON.stringify(userObj));
      setCurrentUser(userObj);
      return userObj;
    } catch (error) {
      const errMsg = error.response?.data?.error || error.message || "Login failed";
      throw new Error(errMsg);
    }
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem("refresh_token");
      if (refreshToken) {
        await axiosInstance.post("/auth/logout", { refresh_token: refreshToken });
      }
    } catch (err) {
      console.warn("Logout error:", err);
    } finally {
      localStorage.removeItem("currentUser");
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      setCurrentUser(null);
      setCartItems([]);
      setWishlistItems([]);
    }
  };

  const validateUser = async () => {
    const stored = localStorage.getItem("currentUser");
    if (!stored) return false;
    
    try {
      const res = await axiosInstance.get("/user/dashboard");
      if (res.data.is_blocked) {
        logout();
        return false;
      }
      return true;
    } catch (err) {
      logout();
      return false;
    }
  };

  const getProductStockLimit = (productId, fallbackItem) => {
    const item = cartItems.find((i) => i.productId === productId);
    if (item) return item.stock;
    if (fallbackItem && fallbackItem.stock !== undefined) return fallbackItem.stock;
    return 9999;
  };

  const addToCart = async (product) => {
    if (!(await validateUser())) throw new Error("Session expired");

    const productId = product.productId || product.id;
    const existing = cartItems.find((item) => item.productId === productId);
    const currentQty = existing ? existing.quantity : 0;
    const stock = getProductStockLimit(productId, product);

    if (currentQty + 1 > stock) {
      throw new Error("Out of stock");
    }

    try {
      await axiosInstance.post("/user/cart", {
        product_id: productId,
        quantity: 1,
      });
      fetchUserCartItems();
    } catch (error) {
      const errMsg = error.response?.data?.error || error.message || "Failed to add to cart";
      throw new Error(errMsg);
    }
  };

  const moveToCart = async (wishlistItemId) => {
    if (!(await validateUser())) throw new Error("Session expired");

    const wishItem = wishlistItems.find((item) => item.id === wishlistItemId);
    if (wishItem) {
      const productId = wishItem.productId;
      const existing = cartItems.find((item) => item.productId === productId);
      const currentQty = existing ? existing.quantity : 0;
      const stock = getProductStockLimit(productId, wishItem);

      if (currentQty + 1 > stock) {
        throw new Error("Out of stock");
      }
    }

    try {
      const res = await axiosInstance.post(`/user/wishlist/${wishlistItemId}/move-to-cart`);
      await fetchUserCartItems();
      await fetchUserWishlistItems();
      return res.data;
    } catch (error) {
      const errMsg = error.response?.data?.error || error.message || "Failed to move to cart";
      throw new Error(errMsg);
    }
  };

  const removeFromCart = async (productId) => {
    const item = cartItems.find((i) => i.productId === productId);
    if (item) {
      await axiosInstance.delete(`/user/cart/${item.id}`);
      fetchUserCartItems();
    }
  };

  const updateQuantity = async (productId, qty) => {
    if (qty < 1) return removeFromCart(productId);
    const item = cartItems.find((i) => i.productId === productId);
    if (item) {
      const stock = getProductStockLimit(productId, item);
      if (qty > stock) {
        throw new Error("Out of stock");
      }
      try {
        await axiosInstance.put(`/user/cart/${item.id}`, { quantity: qty });
        fetchUserCartItems();
      } catch (error) {
        const errMsg = error.response?.data?.error || error.message || "Failed to update quantity";
        throw new Error(errMsg);
      }
    }
  };

  const increaseQuantity = async (productId) => {
    const item = cartItems.find((i) => i.productId === productId);
    if (item) {
      await updateQuantity(productId, item.quantity + 1);
    }
  };

  const decreaseQuantity = async (productId) => {
    const item = cartItems.find((i) => i.productId === productId);
    if (item) {
      await updateQuantity(productId, item.quantity - 1);
    }
  };

  const getQuantity = (productId) => {
    const item = cartItems.find((i) => i.productId === productId);
    return item ? item.quantity : 0;
  };

  const getTotalItems = () =>
    cartItems.reduce((t, i) => t + i.quantity, 0);

  const getTotalPrice = () =>
    cartItems.reduce((t, i) => t + i.price * i.quantity, 0);

  const clearCart = async () => {
    if (!currentUser) return;
    try {
      await axiosInstance.delete("/user/cart");
      setCartItems([]);
    } catch (err) {
      console.error("Failed to clear cart", err);
    }
  };

  const addToWishlist = async (product) => {
    if (!(await validateUser())) throw new Error("Session expired");

    const exists = wishlistItems.find((i) => i.productId === product.id);
    if (exists) return false;

    try {
      await axiosInstance.post("/user/wishlist", { product_id: product.id });
      fetchUserWishlistItems();
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  const removeFromWishlist = async (productId) => {
    const item = wishlistItems.find((i) => i.productId === productId);
    if (item) {
      await axiosInstance.delete(`/user/wishlist/${item.id}`);
      fetchUserWishlistItems();
    }
  };

  const isInWishlist = (productId) =>
    wishlistItems.some((i) => i.productId === productId);

  const getWishlistCount = () => wishlistItems.length;

  const createOrder = async (orderData) => {
    if (!(await validateUser())) {
      throw new Error("User blocked or logged out");
    }
    const { data } = await axiosInstance.post("/user/orders", orderData);
    return data;
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        login,
        logout,
        isSessionActive,
        validateUser,
        wishlistItems,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        getWishlistCount,
      }}
    >
      <CartContext.Provider
        value={{
          cartItems,
          addToCart,
          moveToCart,
          removeFromCart,
          updateQuantity,
          increaseQuantity,
          decreaseQuantity,
          getQuantity,
          getTotalItems,
          getTotalPrice,
          clearCart,
          createOrder,
        }}
      >
        {children}
      </CartContext.Provider>
    </AuthContext.Provider>
  );
};
