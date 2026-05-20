import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const FALLBACK = [
  {
    id: 1,
    title: 'Summer Collection',
    subtitle: 'Up to 50% off on premium styles',
    button_text: 'Shop Now',
    bg_color: '#064e3b',
    image_url: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&q=80',
  },
  {
    id: 2,
    title: 'New Arrivals',
    subtitle: 'Explore the latest collection this season',
    button_text: 'Browse Now',
    bg_color: '#1e40af',
    image_url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&q=80',
  },
  {
    id: 3,
    title: 'Best Deals',
    subtitle: 'Best prices on top products and accessories',
    button_text: 'View Deals',
    bg_color: '#111827',
    image_url: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=1200&q=80',
  },
]

export default function BannerSlider() {
  const [banners, setBanners] = useState([])
  const [current, setCurrent] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('banners')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')
      .then(({ data }) => {
        setBanners(data?.length ? data : FALLBACK)
        setLoading(false)
      })
      .catch(() => {
        setBanners(FALLBACK)
        setLoading(false)
      })
  }, [])

  const next = useCallback(() => setCurrent(c => (c + 1) % banners.length), [banners.length])
  const prev = useCallback(() => setCurrent(c => (c - 1 + banners.length) % banners.length), [banners.length])

  useEffect(() => {
    if (!banners.length) return
    const t = setInterval(next, 5000)
    return () => clearInterval(t)
  }, [next, banners.length])

  if (loading) {
    return <div className="skeleton h-56 sm:h-72 lg:h-[420px] w-full" />
  }

  return (
    <div className="relative overflow-hidden select-none">
      <div className="banner-track" style={{ transform: `translateX(-${current * 100}%)` }}>
        {banners.map(b => (
          <div
            key={b.id}
            className="banner-slide relative h-56 sm:h-72 lg:h-[420px]"
            style={{ background: b.bg_color || '#111827' }}
          >
            {/* Background image */}
            {b.image_url && (
              <img
                src={b.image_url}
                alt={b.title}
                className="absolute inset-0 w-full h-full object-cover"
                onError={e => { e.target.style.display = 'none' }}
              />
            )}

            {/* Dark gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-transparent" />

            {/* Content */}
            <div className="relative z-10 h-full flex flex-col justify-center px-8 sm:px-16 lg:px-24">
              <div className="max-w-lg">
                <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white drop-shadow-lg mb-3 leading-tight tracking-tight">
                  {b.title}
                </h2>
                {b.subtitle && (
                  <p className="text-sm sm:text-lg text-white/85 mb-6 leading-relaxed">
                    {b.subtitle}
                  </p>
                )}
                <a
                  href={b.link_url || '/'}
                  className="inline-flex items-center gap-2 self-start px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full font-bold text-sm transition-all duration-200 shadow-lg hover:shadow-emerald-500/40 hover:-translate-y-0.5"
                >
                  {b.button_text || 'Shop Now'}
                  <i className="fas fa-arrow-right text-xs" />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation arrows */}
      {banners.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/25 transition-all duration-200 z-20 text-white"
            aria-label="Previous slide"
          >
            <i className="fas fa-chevron-left text-sm" />
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/25 transition-all duration-200 z-20 text-white"
            aria-label="Next slide"
          >
            <i className="fas fa-chevron-right text-sm" />
          </button>

          {/* Dot indicators */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === current ? 'w-8 bg-emerald-400' : 'w-2 bg-white/40 hover:bg-white/60'
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
