import { useState, useEffect, useCallback, useRef } from 'react'
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
  const trackRef  = useRef(null)
  const snapping  = useRef(false)

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
      .catch(() => { setBanners(FALLBACK); setLoading(false) })
  }, [])

  // Extended list: real slides + clone of first → seamless forward loop
  const ext = banners.length ? [...banners, banners[0]] : []

  const next = useCallback(() => {
    if (snapping.current) return
    setCurrent(c => c + 1)
  }, [])

  const prev = useCallback(() => {
    if (snapping.current) return
    setCurrent(c => (c - 1 + banners.length) % banners.length)
  }, [banners.length])

  // Auto-play
  useEffect(() => {
    if (!banners.length) return
    const t = setInterval(next, 5000)
    return () => clearInterval(t)
  }, [next, banners.length])

  // When transition ends at the clone (index = banners.length), snap back to real first (index 0)
  function onTransitionEnd() {
    if (current === banners.length) {
      snapping.current = true
      const track = trackRef.current
      if (track) track.style.transition = 'none'
      setCurrent(0)
      // Two rAF frames to let React re-render before re-enabling transition
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (track) track.style.transition = ''
        snapping.current = false
      }))
    }
  }

  if (loading) return <div className="skeleton h-64 sm:h-80 lg:h-[460px] w-full" />

  const activeDot = current % banners.length

  return (
    <div className="relative overflow-hidden select-none group">
      <div
        ref={trackRef}
        className="banner-track"
        style={{ transform: `translateX(-${current * 100}%)` }}
        onTransitionEnd={onTransitionEnd}
      >
        {ext.map((b, i) => (
          <div
            key={`${b.id}-${i}`}
            className="banner-slide relative h-64 sm:h-80 lg:h-[460px]"
            style={{ background: b.bg_color || '#111827' }}
          >
            {b.image_url && (
              <img
                src={b.image_url}
                alt={b.title}
                className="absolute inset-0 w-full h-full object-cover"
                onError={e => { e.target.style.display = 'none' }}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-transparent" />
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

      {banners.length > 1 && (
        <>
          {/* Arrows — hidden by default, visible on banner hover */}
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/30 z-20 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            aria-label="Previous"
          >
            <i className="fas fa-chevron-left text-sm" />
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/30 z-20 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            aria-label="Next"
          >
            <i className="fas fa-chevron-right text-sm" />
          </button>

          {/* Dots — show real slides count only (not the clone) */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === activeDot ? 'w-8 bg-emerald-400' : 'w-2 bg-white/40 hover:bg-white/60'
                }`}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
