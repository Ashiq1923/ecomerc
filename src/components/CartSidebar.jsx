import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { formatPrice, effectivePrice } from '../lib/supabase'

export default function CartSidebar() {
  const { items, isOpen, setIsOpen, removeFromCart, updateQty, totalItems, totalPrice } = useCart()

  return (
    <>
      {/* Backdrop overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-white z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Dark header */}
        <div className="flex items-center justify-between px-5 py-4 bg-gray-900 text-white flex-shrink-0">
          <h2 className="font-bold text-lg flex items-center gap-2.5">
            <i className="fas fa-shopping-cart text-emerald-400" />
            My Cart
            {totalItems > 0 && (
              <span className="bg-emerald-500 text-white text-xs rounded-full px-2 py-0.5 font-bold leading-none">
                {totalItems}
              </span>
            )}
          </h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors duration-150"
            aria-label="Close cart"
          >
            <i className="fas fa-times text-gray-300" />
          </button>
        </div>

        {/* Items list */}
        <div className="flex-1 overflow-y-auto sidebar-scroll">
          {items.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-400 p-8">
              <i className="fas fa-shopping-cart text-6xl text-gray-200" />
              <div className="text-center">
                <p className="font-semibold text-gray-500 text-base">Your cart is empty</p>
                <p className="text-sm text-gray-400 mt-1">Add some products to get started</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full text-sm font-semibold transition-all duration-200 shadow-sm"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {items.map(({ product, quantity }) => {
                const price = effectivePrice(product)
                return (
                  <div key={product.id} className="flex gap-3.5 p-4 hover:bg-gray-50 transition-colors duration-150">
                    {/* Product image */}
                    <img
                      src={product.image_url || `https://placehold.co/80x80?text=${encodeURIComponent(product.name)}`}
                      alt={product.name}
                      className="w-16 h-16 rounded-lg object-cover flex-shrink-0 border border-gray-100"
                    />

                    {/* Product details */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-gray-800 line-clamp-2 leading-tight">
                        {product.name}
                      </h4>
                      <p className="text-emerald-600 font-bold text-sm mt-0.5">{formatPrice(price)}</p>

                      {/* Quantity controls */}
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => updateQty(product.id, quantity - 1)}
                          className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100 hover:border-gray-300 transition-all duration-150 text-gray-600"
                          aria-label="Decrease quantity"
                        >
                          <i className="fas fa-minus text-xs" />
                        </button>
                        <span className="text-sm font-bold w-5 text-center text-gray-800">
                          {quantity}
                        </span>
                        <button
                          onClick={() => updateQty(product.id, quantity + 1)}
                          className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100 hover:border-gray-300 transition-all duration-150 text-gray-600"
                          aria-label="Increase quantity"
                        >
                          <i className="fas fa-plus text-xs" />
                        </button>
                      </div>
                    </div>

                    {/* Item total + remove */}
                    <div className="flex flex-col items-end justify-between flex-shrink-0">
                      <button
                        onClick={() => removeFromCart(product.id)}
                        className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded-lg transition-all duration-150 text-gray-300"
                        aria-label="Remove item"
                      >
                        <i className="fas fa-trash-alt text-sm" />
                      </button>
                      <span className="text-sm font-bold text-gray-800">
                        {formatPrice(price * quantity)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer with checkout */}
        {items.length > 0 && (
          <div className="border-t border-gray-100 p-5 bg-white space-y-3 flex-shrink-0">
            {/* Subtotal */}
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Subtotal ({totalItems} {totalItems === 1 ? 'item' : 'items'})</span>
              <span className="font-bold text-gray-800 text-base">{formatPrice(totalPrice)}</span>
            </div>

            {/* Checkout button */}
            <Link
              to="/cart"
              onClick={() => setIsOpen(false)}
              className="btn-primary flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm"
            >
              <i className="fas fa-lock text-xs" />
              Proceed to Checkout
            </Link>

            {/* Continue shopping */}
            <button
              onClick={() => setIsOpen(false)}
              className="w-full py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors duration-150 text-center"
            >
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </>
  )
}
