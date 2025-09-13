'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { productsApi, Product } from '@/lib/api';

export default function SellerDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    fetchSellerProducts();
  }, []);

  const fetchSellerProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      
      setDebugInfo({
        token: token ? 'Present' : 'Missing',
        user: user ? 'Present' : 'Missing',
        tokenLength: token ? token.length : 0
      });
      
      if (!token) {
        setError('No authentication token found');
        setLoading(false);
        return;
      }

      const data = await productsApi.getSellerProducts();
      setProducts(data);
      setLoading(false);
    } catch (error: any) {
      console.error('Error:', error);
      setError(error.response?.data?.message || error.message || 'Unknown error');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="p-8">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="p-8">
        <h1 className="text-2xl mb-4">Seller Dashboard</h1>
        
        <div className="bg-yellow-100 p-4 mb-4 rounded">
          <h3>Debug Info:</h3>
          <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
          {error && <p className="text-red-600">Error: {error}</p>}
        </div>

        <div className="bg-white p-4 rounded shadow">
          <h2>Your Products ({products.length})</h2>
          {products.length === 0 ? (
            <p>No products found</p>
          ) : (
            <ul>
              {products.map(product => (
                <li key={product.id}>{product.name} - </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
