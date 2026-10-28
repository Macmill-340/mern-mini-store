import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { ProductFilters } from '../components/product/ProductFilters';
import { ProductGrid } from '../components/product/ProductGrid';
import { Pagination } from '../components/product/Pagination';
import { EmptyState } from '../components/ui/EmptyState';
import { PageLoader } from '../components/ui/Spinner';
import { getErrorMessage } from '../utils/errors';
import type { Product } from '../types';

export default function Shop() {
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [products, setProducts] = useState<Product[]>([]);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams({ keyword, category, sort, page: String(page), limit: '12' });
    api
      .get(`/products?${params}`)
      .then((r) => {
        setProducts(r.data.products);
        setPages(r.data.pages);
      })
      .catch((e) => setError(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [keyword, category, sort, page]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <section className="rounded-2xl bg-emerald-600 px-6 py-10 text-white">
        <h1 className="text-3xl font-bold">Welcome to MERN Store</h1>
        <p className="mt-2 text-emerald-100">Discover quality products at great prices.</p>
      </section>

      <ProductFilters
        keyword={keyword}
        category={category}
        sort={sort}
        onKeyword={(v) => { setKeyword(v); setPage(1); }}
        onCategory={(v) => { setCategory(v); setPage(1); }}
        onSort={(v) => { setSort(v); setPage(1); }}
      />

      {loading && <PageLoader />}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && !error && products.length === 0 && (
        <EmptyState title="No products found" description="Try adjusting your search or filters." />
      )}
      {!loading && products.length > 0 && <ProductGrid products={products} />}
      <Pagination page={page} pages={pages} onChange={setPage} />
    </div>
  );
}
