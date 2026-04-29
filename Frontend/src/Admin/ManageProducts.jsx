import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { toast } from 'react-toastify';
import axios from 'axios';
import { Search, Plus, Edit2, Trash2, X } from 'lucide-react';
import { useFormik } from "formik";
import * as Yup from "yup";

const ManageProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get("http://localhost:3130/products");
      setProducts(response.data || []);
      setLoading(false);
    } catch {
      toast.error("Failed to load products");
      setLoading(false);
    }
  };

  
  const validationSchema = Yup.object({
    name: Yup.string().required("Product name is required"),
    price: Yup.number().required("Price required").positive(),
    rating: Yup.number().required(),
    description: Yup.string().required("Description required"),
    image: Yup.string().required("image is required"), 
  });

  const formik = useFormik({
    initialValues: {
      name: "",
      price: "",
      rating: "4.5",
      description: "",
      image: "",
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        const product = {
          ...values,
          price: Number(values.price),
          rating: Number(values.rating),
        };

        if (editingProduct) {
          await axios.put(
            `http://localhost:3130/products/${editingProduct.id}`,
            product
          );
          toast.success("Product updated!");
        } else {
          await axios.post("http://localhost:3130/products", {
            ...product,
            id: `p${Date.now()}`
          });
          toast.success("Product added!");
        }

        fetchProducts();
        setShowModal(false);
        setEditingProduct(null);
        formik.resetForm();
      } catch {
        toast.error("Failed to save product");
      }
    },
  });

  const handleEdit = (product) => {
    setEditingProduct(product);

    formik.setValues({
      name: product.name,
      price: product.price,
      rating: product.rating,
      description: product.description,
      image: product.image,
    });

    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete?")) return;

    try {
      await axios.delete(`http://localhost:3130/products/${id}`);
      setProducts(products.filter((p) => p.id !== id));
      toast.success("Product deleted!");
    } catch {
      toast.error("Delete failed");
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderStars = (rating) =>
    [...Array(5)].map((_, i) => (
      <span key={i} className={`text-xl ${i < Math.floor(rating) ? "text-yellow-400" : "text-gray-300"}`}>
        ★
      </span>
    ));

  return (
    <>
      <AdminLayout>
        <div className="p-6">

          
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Manage Products</h1>

            <button
              onClick={() => {
                setEditingProduct(null);
                formik.resetForm();
                setShowModal(true);
              }}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
            >
              <Plus className="inline-block" /> Add Product
            </button>
          </div>

         
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="pl-12 py-3 border rounded-xl w-full"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100 text-left">
                <tr>
                  <th className="px-6 py-4">Image</th>
                  <th className="px-6 py-4">Details</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4">Rating</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="border-t">
                    <td className="px-6 py-4">
                      <img src={p.image} className="w-20 h-20 rounded-xl object-cover border" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold">{p.name}</div>
                      <p className="text-gray-600">{p.description}</p>
                    </td>

                    <td className="px-6 py-4 font-bold text-lg">₹{p.price}</td>
                    <td className="px-6 py-4">{renderStars(p.rating)}</td>

                    <td className="px-6 py-4 flex gap-3">
                      <button
                        onClick={() => handleEdit(p)}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => handleDelete(p.id)}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </AdminLayout>

     
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl p-8">

            
            <div className="flex justify-between mb-8">
              <h2 className="text-2xl font-bold">
                {editingProduct ? "Edit Product" : "Add Product"}
              </h2>

              <button onClick={() => setShowModal(false)}>
                <X className="w-7 h-7 text-gray-500 hover:text-black transition" />
              </button>
            </div>

            
            <form onSubmit={formik.handleSubmit} className="space-y-6">

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

               
                <div>
                  <label className="block mb-1 font-medium">Product Name *</label>
                  <input
                    name="name"
                    placeholder="Enter name"
                    className="w-full px-4 py-3 border rounded-xl"
                    value={formik.values.name}
                    onChange={(e) => {
                      formik.setFieldValue("name", e.target.value.trimStart());
                    }}
                    onBlur={() => {
                      formik.setFieldValue("name", formik.values.name.trim());
                    }}
                  />

                  {formik.touched.name && formik.errors.name && (
                    <p className="text-red-500 text-sm">{formik.errors.name}</p>
                  )}
                </div>

                
                <div>
                  <label className="block mb-1 font-medium">Price *</label>
                  <input
                    type="number"
                    name="price"
                    placeholder="Enter price"
                    className="w-full px-4 py-3 border rounded-xl"
                    value={formik.values.price}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  />
                  {formik.touched.price && formik.errors.price && (
                    <p className="text-red-500 text-sm">{formik.errors.price}</p>
                  )}
                </div>

                <div>
                  <label className="block mb-1 font-medium">Rating *</label>
                  <select
                    name="rating"
                    className="w-full px-4 py-3 border rounded-xl"
                    value={formik.values.rating}
                    onChange={formik.handleChange}
                  >
                    {[4.0, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 5].map((r) => (
                      <option key={r} value={r}>
                        {r} Stars
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block mb-1 font-medium">Image URL </label>
                  <input
                    name="image"
                    placeholder="Enter image URL"
                    className="w-full px-4 py-3 border rounded-xl"
                    value={formik.values.image}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  />
                  {formik.touched.image && formik.errors.image && (
                      <p className="text-red-500 text-sm">{formik.errors.image}</p>
                  )}
                  {formik.values.image &&  (
                    <img
                      src={formik.values.image}
                      className="mt-3 h-32 w-full object-cover rounded-lg border"
                      
                    />
                  )}
                </div>

              </div>

             
              <div>
                <label className="block mb-1 font-medium">Description *</label>
                <textarea
                  name="description"
                  rows="4"
                  placeholder="Enter description"
                  className="w-full px-4 py-3 border rounded-xl"
                  value={formik.values.description}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
                {formik.touched.description && formik.errors.description && (
                  <p className="text-red-500 text-sm">{formik.errors.description}</p>
                )}
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 border rounded-xl hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
                >
                  {editingProduct ? "Update Product" : "Add Product"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default ManageProducts;
