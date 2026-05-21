import { useLocation, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { formatPrice } from '../lib/supabase'

export default function CartBottomBar() {
  const { totalItems, totalPrice } = useCart()
  const { pathname } = useLocation()
  const navigate = useNavigate()

  // Hide on cart page and admin page
  if (!totalItems || pathname === '/cart' || pathname.startsWith('/admin')) return null

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 px-4 pb-4 pointer-events-none">
      <div
        className="max-w-lg mx-auto bg-gray-900 text-white rounded-2xl shadow-2xl flex items-center gap-3 px-4 py-3 pointer-events-auto"
        style={{ animation: 'slideUp .25s ease' }}
      >
        {/* Cart summary */}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-400 leading-none mb-0.5">Cart</p>
          <p className="font-bold text-sm truncate">
            {totalItems} item{totalItems > 1 ? 's' : ''}
            <span className="text-emerald-400 ml-2">{formatPrice(totalPrice)}</span>
          </p>
        </div>

        {/* WhatsApp quick button */}
        <a
          href="/cart"
          onClick={e => { e.preventDefault(); navigate('/cart') }}
          className="flex items-center gap-1.5 px-3 py-2 bg-[#25D366] hover:bg-[#1ebe5d] text-white rounded-xl text-xs font-bold transition flex-shrink-0"
        >
          <i className="fab fa-whatsapp text-base" />
          <span className="hidden sm:inline">WhatsApp</span>
        </a>

        {/* Checkout button */}
        <button
          onClick={() => navigate('/cart')}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-sm font-bold transition flex-shrink-0"
        >
          Checkout
          <i className="fas fa-arrow-right text-xs" />
        </button>
      </div>
    </div>
  )
}
