import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase, formatPrice, effectivePrice, discountPct } from '../lib/supabase'
import { useCart } from '../context/CartContext'
import { Stars } from '../components/ProductCard'
import ReviewSection from '../components/ReviewSection'
import ProductCard from '../components/ProductCard'
import { addToast } from '../components/ToastContainer'

export default function ProductPage() {
  const { id } = useParams()
  const navigate  = useNavigate()
  const { addToCart } = useCart()
  const [product,  setProduct]  = useState(null)
  const [related,  setRelated]  = useState([])
  const [qty,      setQty]      = useState(1)
  const [loading,  setLoading]  = useState(true)
  const [imgIdx,   setImgIdx]   = useState(0)

  useEffect(() => {
    window.scrollTo(0, 0)
    loadProduct()
  }, [id])

  async function loadProduct() {
    setLoading(true)
    const { data, error } = await supabase
      .from('products')
      .select('*, categories(name)')
      .eq('id', id)
      .single()

    if (error || !data) { navigate('/'); return }

    setProduct({ ...data, category_name: data.categories?.name })
    setImgIdx(0)
    setQty(1)

    // Load related
    if (data.category_id) {
      const { data: rel } = await supabase
        .from('products')
        .select('*, categories(name)')
        .eq('category_id', data.category_id)
        .eq('is_active', true)
        .neq('id', id)
        .order('avg_rating', { ascending: false })
        .limit(4)
      setRelated((rel || []).map(p => ({ ...p, category_name: p.categories?.name })))
    }
    setLoading(false)
  }

  function handleAdd() {
    if (!product) return
    addToCart(product, qty)
    addToast(`${product.name} added to cart!`, 'success')
  }

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="skeleton aspect-square rounded-2xl" />
        <div className="space-y-4">
          {[200, 120, 80, 100, 150].map((w, i) => (
            <div key={i} className="skeleton h-6 rounded" style={{ width: `${w}px` }} />
          ))}
        </div>
      </div>
    </div>
  )

  if (!product) return null

  const price     = effectivePrice(product)
  const pct       = discountPct(product)
  const inStock   = (product.stock ?? 1) > 0
  const images    = product.images?.length ? product.images : [product.image_url].filter(Boolean)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-400 mb-6 flex items-center gap-2">
        <Link to="/" className="hover:text-primary">Home</Link>
        <i className="fas fa-chevron-right text-xs" />
        {product.category_name && (
          <>
            <span className="hover:text-primary cursor-pointer">{product.category_name}</span>
            <i className="fas fa-chevron-right text-xs" />
          </>
        )}
        <span className="text-gray-600 truncate max-w-[200px]">{product.name}</span>
      </nav>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">

        {/* Images */}
        <div className="space-y-3">
          <div className="relative overflow-hidden rounded-2xl bg-gray-50 aspect-square border">
            <img
              src={images[imgIdx] || `https://placehold.co/600x600?text=${encodeURIComponent(product.name)}`}
              alt={product.name}
              className="w-full h-full object-contain p-4"
            />
            {pct > 0 && (
              <span className="absolute top-4 left-4 bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                -{pct}% OFF
              </span>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setImgIdx(i)}
                  className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition
                    ${i === imgIdx ? 'border-primary' : 'border-gray-100 hover:border-gray-300'}`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col gap-4">
          {product.category_name && (
            <span className="text-sm text-primary font-medium">{product.category_name}</span>
          )}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">{product.name}</h1>

          {/* Rating */}
          {product.avg_rating > 0 && (
            <div className="flex items-center gap-2">
              <Stars rating={product.avg_rating} size="base" />
              <span className="text-sm text-gray-500">
                {Number(product.avg_rating).toFixed(1)} ({product.review_count || 0} reviews)
              </span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-extrabold text-gray-900">{formatPrice(price)}</span>
            {pct > 0 && (
              <>
                <span className="text-lg text-gray-400 line-through">{formatPrice(product.price)}</span>
                <span className="bg-red-100 text-red-600 text-sm font-bold px-2 py-0.5 rounded-full">Save {pct}%</span>
              </>
            )}
          </div>

          {/* Stock */}
          <div className={`flex items-center gap-2 text-sm font-medium ${inStock ? 'text-green-600' : 'text-red-500'}`}>
            <i className={`fas fa-${inStock ? 'check-circle' : 'times-circle'}`} />
            {inStock ? `In Stock (${product.stock} left)` : 'Out of Stock'}
          </div>

          {/* Description */}
          {product.description && (
            <p className="text-gray-600 text-sm leading-relaxed">{product.description}</p>
          )}

          {/* Quantity + Add */}
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setQty(q => Math.max(1, q - 1))}
                className="px-4 py-3 hover:bg-gray-100 transition text-gray-600 font-bold"
              >–</button>
              <span className="px-4 font-semibold text-gray-800 min-w-[40px] text-center">{qty}</span>
              <button
                onClick={() => setQty(q => Math.min(product.stock || 99, q + 1))}
                className="px-4 py-3 hover:bg-gray-100 transition text-gray-600 font-bold"
              >+</button>
            </div>
            <button
              onClick={handleAdd}
              disabled={!inStock}
              className={`flex-1 py-3 rounded-xl font-bold text-base transition flex items-center justify-center gap-2
                ${inStock ? 'bg-primary text-white hover:bg-primary-dark active:scale-95 shadow-md' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
            >
              <i className="fas fa-cart-plus" />
              {inStock ? 'Add to Cart' : 'Out of Stock'}
            </button>
          </div>

          {/* Meta */}
          <div className="mt-4 p-4 bg-gray-50 rounded-xl grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <i className="fas fa-truck text-primary w-5" /> Free Delivery
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <i className="fas fa-undo text-primary w-5" /> Easy Returns
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <i className="fas fa-shield-alt text-primary w-5" /> Genuine Product
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <i className="fab fa-whatsapp text-green-500 w-5" /> Order via WhatsApp
            </div>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <div className="mt-12">
        <ReviewSection productId={id} onRatingChange={loadProduct} />
      </div>

      {/* Related products */}
      {related.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-bold text-gray-800 mb-4">You May Also Like</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {related.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      )}
    </div>
  )
}
