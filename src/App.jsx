import { Routes, Route } from 'react-router-dom'
import { AuthProvider }  from './context/AuthContext'
import { CartProvider }  from './context/CartContext'
import { ToastProvider } from './context/ToastContext'
import Navbar        from './components/Navbar'
import Footer        from './components/Footer'
import WhatsAppButton from './components/WhatsAppButton'
import CartSidebar   from './components/CartSidebar'
import AuthModal     from './components/AuthModal'
import ToastContainer from './components/ToastContainer'
import HomePage      from './pages/HomePage'
import ProductPage   from './pages/ProductPage'
import CartPage      from './pages/CartPage'
import AdminPage     from './pages/AdminPage'
import ProfilePage   from './pages/ProfilePage'

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <CartProvider>
          <div className="min-h-screen flex flex-col bg-gray-50">
            <Navbar />
            <main className="flex-1">
              <Routes>
                <Route path="/"            element={<HomePage />} />
                <Route path="/product/:id" element={<ProductPage />} />
                <Route path="/cart"        element={<CartPage />} />
                <Route path="/admin/*"     element={<AdminPage />} />
                <Route path="/profile"    element={<ProfilePage />} />
              </Routes>
            </main>
            <Footer />
            <WhatsAppButton />
            <CartSidebar />
            <AuthModal />
            <ToastContainer />
          </div>
        </CartProvider>
      </AuthProvider>
    </ToastProvider>
  )
}
