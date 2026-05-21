import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { supabase, formatPrice, effectivePrice, WHATSAPP_NUMBER, STORE_NAME } from '../lib/supabase'
import { addToast } from '../components/ToastContainer'
import LocationPicker from '../components/LocationPicker'

function orderNo(id) { return `ORD-${id.slice(0, 6).toUpperCase()}` }

export default function CartPage() {
  const { items, removeFromCart, updateQty, clearCart, totalItems, totalPrice } = useCart()
  const { user, profile } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    name:     '',
    phone:    '',
    house:    '',
    street:   '',
    area:     '',
    town:     '',
    city:     '',
    notes:    '',
    location: '',
  })
  const [loading, setLoading] = useState(false)

  // Sync delivery details from saved profile whenever profile loads/changes
  useEffect(() => {
    if (profile) {
      const addr = splitAddress(profile.address)
      setForm(f => ({
        ...f,
        name:     profile.full_name || f.name,
        phone:    profile.phone     || f.phone,
        location: profile.location  || f.location,
        ...addr,
      }))
    }
  }, [profile])

  function change(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleOrder(e) {
    e.preventDefault()
    if (!items.length) { addToast('Your cart is empty!', 'error'); return }
    if (!form.name || !form.phone) { addToast('Please fill name and phone', 'error'); return }
    if (!form.city) { addToast('Please enter your city', 'error'); return }
    setLoading(true)

    const fullAddress = buildAddress(form)

    // Build WhatsApp message — order number added after insert
    const buildLines = (ordNo) => [
      `🛍️ *New Order – ${STORE_NAME}*`,
      ordNo ? `🔢 *Order #:* ${ordNo}` : '',
      ``,
      `👤 *Customer:* ${form.name}`,
      `📞 *Phone:* ${form.phone}`,
      `📍 *Address:*`,
      form.house  ? `   House/Flat: ${form.house}`  : '',
      form.street ? `   Street: ${form.street}`      : '',
      form.area   ? `   Area: ${form.area}`           : '',
      form.town   ? `   Town: ${form.town}`           : '',
      form.city   ? `   City: ${form.city}`           : '',
      form.location ? `🗺️ *Location:* https://maps.google.com/?q=${form.location}` : '',
      form.notes ? `📝 *Notes:* ${form.notes}` : '',
      ``,
      `*Order Items:*`,
      ...items.map(({ product, quantity }) =>
        `• ${product.name} × ${quantity} = ${formatPrice(effectivePrice(product) * quantity)}`
      ),
      ``,
      `💰 *Total: ${formatPrice(totalPrice)}*`,
      ``,
      `Please confirm my order. Thank you!`,
    ].filter(Boolean).join('\n')

    // Save order to Supabase
    let ordNo = ''
    try {
      const orderItems = items.map(({ product, quantity }) => ({
        product_id: product.id,
        quantity,
        price:      effectivePrice(product),
        name:       product.name,
      }))

      const { data: inserted } = await supabase.from('orders').insert({
        user_id:          user?.id || null,
        customer_name:    form.name,
        customer_phone:   form.phone,
        customer_address: fullAddress,
        notes:            form.notes,
        total_amount:     totalPrice,
        status:           'pending',
        items:            orderItems,
        location:         form.location || null,
      }).select('id').single()

      if (inserted?.id) ordNo = orderNo(inserted.id)

      // Increment order count on each ordered product
      const productIds = orderItems.map(i => i.product_id)
      await supabase.rpc('increment_product_orders', { product_ids: productIds })

      // Save delivery details back to profile for future orders
      if (user) {
        await supabase.from('profiles').update({
          full_name: form.name.trim(),
          phone:     form.phone.trim(),
          address:   fullAddress,
          location:  form.location || null,
        }).eq('id', user.id)
      }
    } catch (err) {
      console.warn('Order save failed:', err)
    }

    setLoading(false)
    clearCart()
    // Open WhatsApp with order number included
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(buildLines(ordNo))}`, '_blank')
    addToast(ordNo ? `Order ${ordNo} sent via WhatsApp! 🎉` : 'Order sent via WhatsApp! 🎉', 'success')
    navigate('/')
  }

  if (items.length === 0) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-gray-400 px-4">
      <i className="fas fa-shopping-cart text-8xl text-gray-200" />
      <h2 className="text-2xl font-bold text-gray-600">Your cart is empty</h2>
      <p className="text-sm">Browse our products and add something you love!</p>
      <Link to="/" className="btn-primary px-6 py-3 rounded-full font-semibold text-sm">
        Start Shopping
      </Link>
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-extrabold text-gray-800 mb-6 flex items-center gap-2">
        <i className="fas fa-shopping-cart text-primary" /> My Cart
        <span className="text-base font-normal text-gray-400">({totalItems} items)</span>
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Items */}
        <div className="lg:col-span-2 space-y-3">
          {items.map(({ product, quantity }) => {
            const price = effectivePrice(product)
            return (
              <div key={product.id} className="bg-white rounded-2xl p-4 flex gap-4 shadow-sm border border-gray-100">
                <Link to={`/product/${product.id}`} className="flex-shrink-0">
                  <img
                    src={product.image_url || `https://placehold.co/100x100?text=${encodeURIComponent(product.name)}`}
                    alt={product.name}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover border"
                  />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to={`/product/${product.id}`}>
                    <h3 className="font-semibold text-gray-800 text-sm sm:text-base line-clamp-2 hover:text-primary transition">
                      {product.name}
                    </h3>
                  </Link>
                  <p className="text-primary font-bold mt-1">{formatPrice(price)}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden text-sm">
                      <button onClick={() => updateQty(product.id, quantity - 1)} className="px-3 py-1.5 hover:bg-gray-100 transition text-gray-600 font-bold">–</button>
                      <span className="px-3 font-semibold">{quantity}</span>
                      <button onClick={() => updateQty(product.id, quantity + 1)} className="px-3 py-1.5 hover:bg-gray-100 transition text-gray-600 font-bold">+</button>
                    </div>
                    <button onClick={() => removeFromCart(product.id)} className="text-red-400 hover:text-red-600 transition text-sm">
                      <i className="fas fa-trash-alt" />
                    </button>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-gray-800">{formatPrice(price * quantity)}</p>
                </div>
              </div>
            )
          })}

          <button onClick={clearCart} className="text-sm text-red-400 hover:text-red-600 transition flex items-center gap-1 mt-2">
            <i className="fas fa-times" /> Clear cart
          </button>
        </div>

        {/* Order form + summary */}
        <div className="lg:col-span-1">
          <form onSubmit={handleOrder} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-20">
            <div className="p-5 border-b bg-gray-50">
              <h2 className="font-bold text-gray-800 flex items-center gap-2">
                <i className="fas fa-user text-emerald-500" /> Delivery Details
              </h2>
              {user ? (
                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                  <i className="fas fa-info-circle text-emerald-400" />
                  Details auto-filled from your{' '}
                  <Link to="/profile" className="text-emerald-600 hover:underline font-medium">profile</Link>
                  . Changes are saved automatically.
                </p>
              ) : (
                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                  <i className="fas fa-info-circle" />
                  <button onClick={() => {}} className="text-emerald-600 hover:underline font-medium">Login</button>{' '}
                  to save your details for next time.
                </p>
              )}
            </div>
            <div className="p-5 space-y-3">
              <Field label="Full Name *" name="name"  type="text" value={form.name}  onChange={change} />
              <Field label="Phone *"     name="phone" type="tel"  value={form.phone} onChange={change} />

              {/* Address section */}
              <div className="border border-gray-100 rounded-xl p-3 space-y-2.5 bg-gray-50">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                  <i className="fas fa-map-marker-alt text-emerald-500" /> Delivery Address
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="House / Flat #" name="house"  type="text" value={form.house}  onChange={change} />
                  <Field label="Street #"        name="street" type="text" value={form.street} onChange={change} />
                </div>
                <Field label="Area / Colony"   name="area"   type="text" value={form.area}   onChange={change} />
                <Field label="Town"            name="town"   type="text" value={form.town}   onChange={change} />
                <Field label="City *"          name="city"   type="text" value={form.city}   onChange={change} />
                {/* Optional GPS location */}
                <div className="pt-1">
                  <p className="text-xs font-semibold text-gray-500 mb-1.5 flex items-center gap-1">
                    <i className="fas fa-location-dot text-blue-400" />
                    Live Location <span className="text-gray-400 font-normal">(optional)</span>
                  </p>
                  <LocationPicker
                    value={form.location}
                    onChange={loc => setForm(f => ({ ...f, location: loc }))}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600">Order Notes</label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={change}
                  rows={2}
                  placeholder="Special instructions..."
                  className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                />
              </div>

              {/* Summary */}
              <div className="pt-3 border-t space-y-1.5">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span><span>{formatPrice(totalPrice)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Delivery</span><span className="text-green-600 font-medium">Free</span>
                </div>
                <div className="flex justify-between font-bold text-gray-900 text-base pt-1 border-t">
                  <span>Total</span><span>{formatPrice(totalPrice)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[#25D366] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#1ebe5d] transition disabled:opacity-60 mt-2 text-base shadow-md"
              >
                {loading
                  ? <><i className="fas fa-spinner fa-spin" /> Sending...</>
                  : <><i className="fab fa-whatsapp text-xl" /> Order via WhatsApp</>
                }
              </button>
              <p className="text-center text-xs text-gray-400">
                Your order will be sent via WhatsApp for confirmation
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

function Field({ label, name, type, value, onChange, placeholder }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-gray-600">{label}</label>
      <input
        name={name} type={type} value={value} onChange={onChange} placeholder={placeholder}
        className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition bg-white"
      />
    </div>
  )
}

function buildAddress(form) {
  return [form.house, form.street, form.area, form.town, form.city]
    .map(v => v?.trim()).filter(Boolean).join(', ')
}

function splitAddress(addr) {
  if (!addr) return { house: '', street: '', area: '', town: '', city: '' }
  const parts = addr.split(', ')
  return {
    house:  parts[0] || '',
    street: parts[1] || '',
    area:   parts[2] || '',
    town:   parts[3] || '',
    city:   parts[4] || '',
  }
}
