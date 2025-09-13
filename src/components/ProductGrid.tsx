'use client';

import { useState, useEffect } from 'react';
import ProductCard from './ProductCard';
import { productsApi, Product } from '@/lib/api';

export default function ProductGrid() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
    
    // Listen for storage changes to refresh products when new ones are added
    const handleStorageChange = () => {
      fetchProducts();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom events from the same page
    window.addEventListener('localProductsChanged', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localProductsChanged', handleStorageChange);
    };
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try to get products from API first
      let apiProducts: Product[] = [];
      try {
        apiProducts = await productsApi.getAll();
      } catch {
        console.log('API not available, using local data');
      }
      
      // Get local products from localStorage
      const localProducts = JSON.parse(localStorage.getItem('localProducts') || '[]');
      
      // Combine API products and local products
      const allProducts = [...localProducts, ...apiProducts];
      
      if (allProducts.length > 0) {
        setProducts(allProducts);
      } else {
        // Fallback to mock data if no products available
        setProducts([
          {
            id: '1',
            name: 'Sample Product 1',
            description: 'This is a sample product description from mock data',
            price: 29.99,
            category: 'Electronics',
            stock: 10,
            sellerId: '1',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            seller: {
              id: '1',
              name: 'John Doe',
              email: 'john@example.com'
            }
          },
          {
            id: '2',
            name: 'Sample Product 2',
            description: 'Another sample product description from mock data',
            price: 49.99,
            category: 'Clothing',
            stock: 5,
            sellerId: '2',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            seller: {
              id: '2',
              name: 'Jane Smith',
              email: 'jane@example.com'
            }
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to fetch products.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="bg-gray-300 h-48 rounded-lg mb-4"></div>
            <div className="bg-gray-300 h-4 rounded mb-2"></div>
            <div className="bg-gray-300 h-4 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
        <div className="flex items-center gap-2 text-yellow-800 mb-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          API Connection Issue
        </div>
        <p className="text-yellow-700">{error}</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8V4a1 1 0 00-1-1H7a1 1 0 00-1 1v1m4 0h4" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Products Found</h3>
        <p className="text-gray-500">Be the first to add a product!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 text-sm">{error}</p>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product, index) => (
          <ProductCard key={`${product.id}-${index}`} product={product} />
        ))}
      </div>
    </div>
  );
}
