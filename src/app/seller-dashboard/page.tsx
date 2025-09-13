'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import AddProductForm from '@/components/AddProductForm';
import SellerProductList from '@/components/SellerProductList';
import { productsApi, Product } from '@/lib/api';

export default function SellerDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSellerProducts();
  }, []);

  const fetchSellerProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Token in localStorage:', token ? 'Token exists' : 'No token found');
      
      if (!token) {
        console.error('No authentication token found. User needs to login.');
        setLoading(false);
        return;
      }

      const data = await productsApi.getSellerProducts();
      setProducts(data);
      setLoading(false);
    } catch (error: unknown) {
      console.error('Error fetching seller products:', error);
      
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number } };
        if (axiosError.response?.status === 401) {
          console.error('Authentication failed. Token might be expired or invalid.');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      
      setLoading(false);
    }
  };

  const handleProductAdded = (newProduct: Product) => {
    const updatedProducts = [newProduct, ...products];
    setProducts(updatedProducts);
    
    const existingProducts = JSON.parse(localStorage.getItem('localProducts') || '[]');
    const allProducts = [newProduct, ...existingProducts];
    localStorage.setItem('localProducts', JSON.stringify(allProducts));
    
    window.dispatchEvent(new CustomEvent('localProductsChanged'));
    
    setShowAddForm(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-300 rounded w-1/4"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2"></div>
            <div className="h-32 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Seller Dashboard</h1>
            <p className="text-gray-600 mt-2">
              Manage your products and track your sales
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            {showAddForm ? 'Cancel' : 'Add Product'}
          </button>
        </div>

        {showAddForm && (
          <div className="mb-8">
            <AddProductForm
              onProductAdded={handleProductAdded}
              onCancel={() => setShowAddForm(false)}
            />
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Your Products</h2>
            <p className="text-gray-600 mt-1">
              {products.length} product{products.length !== 1 ? 's' : ''} listed
            </p>
          </div>
          
          <SellerProductList 
            products={products} 
            onProductUpdate={fetchSellerProducts}
          />
        </div>
      </div>
    </div>
  );
}
