import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import BannerSlider from '../components/BannerSlider'
import CategoryFilter from '../components/CategoryFilter'
import ProductCard from '../components/ProductCard'

const SORT_OPTIONS = [
  { value: 'rating',     label: 'Top Rated' },
  { value: 'newest',    label: 'Newest' },
  { value: 'price_asc',  label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'popular',   label: 'Most Popular' },
]

const PAGE_SIZE = 12

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products,   setProducts]   = useState([])
  const [categories, setCategories] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [category,   setCategory]   = useState(null)
  const [sortBy,     setSortBy]     = useState('rating')
  const [query,      setQuery]      = useState(searchParams.get('q') || '')
  const [page,       setPage]       = useState(1)
  const [hasMore,    setHasMore]    = useState(true)
  const [sortOpen,   setSortOpen]   = useState(false)
  const sortRef = useRef(null)

  // Load categories once
  useEffect(() => {
    supabase
      .from('categories')
      .select('id, name, icon')
      .order('name')
      .then(({ data }) => setCategories(data || []))
  }, [])

  // Reload on filter change
  useEffect(() => {
    setPage(1)
    setProducts([])
    loadProducts(1, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, sortBy, query])

  async function loadProducts(pageNum = 1, reset = false) {
    setLoading(true)
    const from = (pageNum - 1) * PAGE_SIZE
    const to   = from + PAGE_SIZE - 1

    let q = supabase
      .from('products')
      .select('*, categories(name)', { count: 'exact' })
      .eq('is_active', true)
      .range(from, to)

    if (category)     q = q.eq('category_id', category)
    if (query.trim()) q = q.ilike('name', `%${query.trim()}%`)

    switch (sortBy) {
      case 'rating':
        q = q.order('avg_rating', { ascending: false }).order('review_count', { ascending: false })
        break
      case 'newest':
        q = q.order('created_at', { ascending: false })
        break
      case 'price_asc':
        q = q.order('price', { ascending: true })
        break
      case 'price_desc':
        q = q.order('price', { ascending: false })
        break
      case 'popular':
        q = q.order('review_count', { ascending: false })
        break
      default:
        break
    }

    const { data, count } = await q
    const mapped = (data || []).map(p => ({ ...p, category_name: p.categories?.name }))

    setProducts(prev => reset ? mapped : [...prev, ...mapped])
    setHasMore((from + PAGE_SIZE) < (count || 0))
    setLoading(false)
  }

  function handleSearch(val) {
    setQuery(val)
    if (val) setSearchParams({ q: val })
    else setSearchParams({})
  }

  function loadMore() {
    const next = page + 1
    setPage(next)
    loadProducts(next)
  }

  return (
    <div>
      {/* Banner */}
      <BannerSlider />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Search bar */}
        <div className="mb-6">
          <div className="relative max-w-lg">
            <input
              type="text"
              value={query}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 transition-all duration-200 shadow-sm"
            />
            <i className="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            {query && (
              <button
                onClick={() => handleSearch('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Clear search"
              >
                <i className="fas fa-times text-sm" />
              </button>
            )}
          </div>
        </div>

        {/* Category filter */}
        {categories.length > 0 && (
          <div className="mb-6">
            <CategoryFilter categories={categories} selected={category} onSelect={setCategory} />
          </div>
        )}

        {/* Sort and count row */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <p className="text-sm text-gray-500">
            {query && (
              <span>
                Results for{' '}
                <strong className="text-gray-700">&ldquo;{query}&rdquo;</strong>
                {' '}&middot;{' '}
              </span>
            )}
            {!loading && (
              <span>
                <strong className="text-gray-700">{products.length}</strong> products
              </span>
            )}
          </p>

          <div ref={sortRef} className="relative">
            <button
              onClick={() => setSortOpen(o => !o)}
              className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm text-gray-700 shadow-sm hover:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200 transition-all"
            >
              <i className="fas fa-sort-amount-down text-gray-400 text-xs" />
              {SORT_OPTIONS.find(o => o.value === sortBy)?.label}
              <i className={`fas fa-chevron-down text-xs text-gray-400 transition-transform duration-200 ${sortOpen ? 'rotate-180' : ''}`} />
            </button>

            {sortOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setSortOpen(false)} />
                <div className="absolute right-0 top-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl z-20 py-1.5 min-w-[200px] overflow-hidden">
                  {SORT_OPTIONS.map(o => (
                    <button
                      key={o.value}
                      onClick={() => { setSortBy(o.value); setSortOpen(false) }}
                      className={`w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${
                        sortBy === o.value
                          ? 'bg-emerald-50 text-emerald-700 font-semibold'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {sortBy === o.value
                        ? <i className="fas fa-check text-emerald-500 text-xs w-3" />
                        : <span className="w-3" />
                      }
                      {o.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Product grid */}
        {loading && products.length === 0 ? (
          /* Skeleton loading state */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-xl overflow-hidden border border-gray-100">
                <div className="skeleton aspect-square" />
                <div className="p-3.5 space-y-2.5">
                  <div className="skeleton h-3.5 rounded w-2/3" />
                  <div className="skeleton h-4 rounded w-full" />
                  <div className="skeleton h-3 rounded w-1/2" />
                  <div className="skeleton h-9 rounded-lg w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          /* Empty state */
          <div className="text-center py-24 text-gray-400">
            <i className="fas fa-box-open text-5xl mb-5 block text-gray-200" />
            <p className="text-lg font-semibold text-gray-500 mb-1">No products found</p>
            <p className="text-sm text-gray-400">
              {query ? 'Try a different search term.' : 'Check back soon for new arrivals.'}
            </p>
            {query && (
              <button
                onClick={() => handleSearch('')}
                className="mt-4 px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full text-sm font-semibold transition-all duration-200"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>

            {/* Load more */}
            {hasMore && (
              <div className="text-center mt-10">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="px-8 py-3 border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded-full font-semibold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {loading
                    ? <><i className="fas fa-spinner fa-spin mr-2" />Loading...</>
                    : <><i className="fas fa-chevron-down mr-2" />Load More</>
                  }
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
