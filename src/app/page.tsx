import Header from '@/components/Header';
import ProductGrid from '@/components/ProductGrid';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to MarketPlace
          </h1>
          <p className="text-gray-600">
            Discover amazing products from sellers around you
          </p>
        </div>
        <ProductGrid />
      </main>
    </div>
  );
}
