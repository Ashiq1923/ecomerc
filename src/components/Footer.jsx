import { Link } from 'react-router-dom'
import { STORE_NAME, WHATSAPP_NUMBER } from '../lib/supabase'

export default function Footer() {
  const waHref = `https://wa.me/${WHATSAPP_NUMBER}`

  return (
    <footer className="bg-gray-900 text-gray-400 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-12">

          {/* Brand Column */}
          <div className="col-span-2 sm:col-span-1">
            <Link to="/" className="flex items-center gap-2.5 mb-4 group">
              <i className="fas fa-store text-emerald-400 text-xl group-hover:text-emerald-300 transition-colors duration-200" />
              <span className="text-white font-bold text-lg group-hover:text-emerald-400 transition-colors duration-200">
                {STORE_NAME}
              </span>
            </Link>
            <p className="text-sm leading-relaxed mb-5">
              Your trusted online shopping destination. Quality products, great prices, and fast delivery.
            </p>
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#25D366] hover:bg-[#1ebe5d] text-white rounded-full text-sm font-semibold transition-all duration-200 shadow-sm hover:shadow-green-500/30"
            >
              <i className="fab fa-whatsapp text-lg" />
              Chat with Us
            </a>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Quick Links</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/" className="hover:text-white hover:translate-x-0.5 transition-all duration-150 inline-flex items-center gap-1.5">
                  <i className="fas fa-home text-xs text-emerald-500" />
                  Home
                </Link>
              </li>
              <li>
                <Link to="/cart" className="hover:text-white hover:translate-x-0.5 transition-all duration-150 inline-flex items-center gap-1.5">
                  <i className="fas fa-shopping-cart text-xs text-emerald-500" />
                  My Cart
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Support</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors duration-150 inline-flex items-center gap-1.5"
                >
                  <i className="fab fa-whatsapp text-xs text-emerald-500" />
                  WhatsApp Support
                </a>
              </li>
              <li>
                <span className="inline-flex items-center gap-1.5 cursor-default">
                  <i className="fas fa-undo text-xs text-emerald-500" />
                  Return Policy
                </span>
              </li>
              <li>
                <span className="inline-flex items-center gap-1.5 cursor-default">
                  <i className="fas fa-lock text-xs text-emerald-500" />
                  Privacy Policy
                </span>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Contact</h4>
            <ul className="space-y-2.5 text-sm">
              <li className="flex items-center gap-2">
                <i className="fab fa-whatsapp text-[#25D366] text-base" />
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors duration-150"
                >
                  +{WHATSAPP_NUMBER}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <i className="fas fa-envelope text-emerald-500 text-sm" />
                <span>support@shopease.pk</span>
              </li>
              <li className="flex items-center gap-2">
                <i className="fas fa-map-marker-alt text-emerald-500 text-sm" />
                <span>Pakistan</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <p className="text-gray-500">
            &copy; {new Date().getFullYear()} {STORE_NAME}. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <i className="fab fa-cc-visa text-xl text-gray-600 hover:text-gray-400 transition-colors" />
              <i className="fab fa-cc-mastercard text-xl text-gray-600 hover:text-gray-400 transition-colors" />
            </div>
            <span className="text-gray-600 flex items-center gap-1.5">
              <i className="fas fa-money-bill-wave text-emerald-600" />
              Cash on Delivery
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
