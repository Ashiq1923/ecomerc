import { WHATSAPP_NUMBER, STORE_NAME } from '../lib/supabase'

export default function WhatsAppButton() {
  const message = encodeURIComponent(`Hi ${STORE_NAME}! I need help with my order.`)
  const href    = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="wa-fab fixed bottom-6 right-6 z-40 w-14 h-14 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-xl hover:scale-110 hover:bg-[#1ebe5d] transition-all duration-200"
      aria-label="Chat on WhatsApp"
    >
      <i className="fab fa-whatsapp text-3xl text-white" />
    </a>
  )
}
