import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { formatPrice, effectivePrice, discountPct } from '../lib/supabase'
import { addToast } from './ToastContainer'

function Stars({ rating, size = 'sm' }) {
  const s = size === 'sm' ? 'text-xs' : 'text-sm'
  return (
    <span className={`flex items-center gap-0.5 ${s}`}>
      {[1, 2, 3, 4, 5].map(i => (
        <i
          key={i}
          className={`fas fa-star ${i <= Math.round(rating) ? 'star-filled' : 'star-empty'}`}
        />
      ))}
    </span>
  )
}

export { Stars }

export default function ProductCard({ product }) {
  const { addToCart } = useCart()
  const price   = effectivePrice(product)
  const pct     = discountPct(product)
  const inStock = (product.stock ?? 1) > 0

  function handleAdd(e) {
    e.preventDefault()
    e.stopPropagation()
    if (!inStock) return
    addToCart(product, 1)
    addToast(`${product.name} added to cart!`, 'success')
  }

  return (
    <Link
      to={`/product/${product.id}`}
      className="product-card bg-white rounded-xl border border-gray-100 overflow-hidden flex flex-col group shadow-card"
    >
      {/* Image */}
      <div className="relative overflow-hidden bg-gray-50 aspect-square">
        <img
          src={product.image_url || `https://placehold.co/400x400?text=${encodeURIComponent(product.name)}`}
          alt={product.name}
          className="product-img w-full h-full object-cover"
          loading="lazy"
        />

        {/* Sale badge */}
        {pct > 0 && (
          <span className="absolute top-2.5 left-2.5 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full leading-none">
            -{pct}%
          </span>
        )}

        {/* Out of stock overlay */}
        {!inStock && (
          <div className="absolute inset-0 bg-white/65 flex items-center justify-center">
            <span className="bg-gray-800 text-white text-xs px-3 py-1.5 rounded-full font-semibold tracking-wide">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3.5 flex flex-col flex-1 gap-1.5">

        {/* Category badge */}
        {product.category_name && (
          <span className="text-xs text-emerald-600 font-semibold uppercase tracking-wider">
            {product.category_name}
          </span>
        )}

        {/* Product name */}
        <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 leading-snug">
          {product.name}
        </h3>

        {/* Star rating + order count */}
        <div className="flex items-center justify-between mt-0.5">
          {product.avg_rating > 0 ? (
            <div className="flex items-center gap-1.5">
              <Stars rating={product.avg_rating} />
              <span className="text-xs text-gray-400">({product.review_count ?? 0})</span>
            </div>
          ) : <span />}
          {(product.total_orders > 0) && (
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
              <i className="fas fa-shopping-bag text-xs" />
              {product.total_orders} sold
            </span>
          )}
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-2 mt-auto pt-1.5">
          <span className="text-base font-bold text-gray-900">{formatPrice(price)}</span>
          {pct > 0 && (
            <span className="text-xs text-gray-400 line-through">{formatPrice(product.price)}</span>
          )}
        </div>

        {/* Add to cart button */}
        <button
          onClick={handleAdd}
          disabled={!inStock}
          className={`mt-1.5 w-full py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-1.5
            ${inStock
              ? 'btn-primary'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
        >
          <i className="fas fa-cart-plus text-xs" />
          {inStock ? 'Add to Cart' : 'Unavailable'}
        </button>
      </div>
    </Link>
  )
}
