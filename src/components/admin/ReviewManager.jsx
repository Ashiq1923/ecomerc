import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Stars } from '../ProductCard'
import { addToast } from '../ToastContainer'

export default function ReviewManager() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState('pending')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('reviews')
      .select('*, products(name), profiles(full_name)')
      .order('created_at', { ascending: false })
    setReviews(data || [])
    setLoading(false)
  }

  async function approve(review) {
    await supabase.from('reviews').update({ is_approved: true }).eq('id', review.id)
    setReviews(prev => prev.map(r => r.id === review.id ? { ...r, is_approved: true } : r))
    // Refresh product avg_rating via database trigger — addToast success
    addToast('Review approved!', 'success')
  }

  async function del(review) {
    if (!confirm('Delete this review?')) return
    await supabase.from('reviews').delete().eq('id', review.id)
    setReviews(prev => prev.filter(r => r.id !== review.id))
    addToast('Review deleted', 'info')
  }

  const pending  = reviews.filter(r => !r.is_approved)
  const approved = reviews.filter(r => r.is_approved)
  const displayed = filter === 'pending' ? pending : filter === 'approved' ? approved : reviews

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="text-lg font-bold text-gray-800">
          Reviews
          {pending.length > 0 && (
            <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">{pending.length} pending</span>
          )}
        </h2>
        <div className="flex gap-2">
          {[['pending', 'Pending'], ['approved', 'Approved'], ['all', 'All']].map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition border
                ${filter === val ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200 hover:border-primary'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? <div className="skeleton h-48 rounded-xl" /> : displayed.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <i className="fas fa-star text-4xl mb-3 block opacity-30" />
          <p>No reviews in this category</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map(r => (
            <div key={r.id} className={`bg-white border rounded-2xl p-4 shadow-sm ${!r.is_approved ? 'border-amber-200' : 'border-gray-100'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {(r.profiles?.full_name || 'U')[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{r.profiles?.full_name || 'Anonymous'}</p>
                      <p className="text-xs text-gray-400">on <span className="text-primary font-medium">{r.products?.name}</span></p>
                    </div>
                    <Stars rating={r.rating} />
                    {!r.is_approved && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">Pending</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed mt-2">{r.comment}</p>
                  <p className="text-xs text-gray-400 mt-2">{new Date(r.created_at).toLocaleString('en-PK')}</p>
                </div>
                <div className="flex flex-col gap-1 flex-shrink-0">
                  {!r.is_approved && (
                    <button onClick={() => approve(r)} className="px-3 py-1.5 bg-green-100 text-green-700 rounded-xl text-xs font-semibold hover:bg-green-200 transition flex items-center gap-1">
                      <i className="fas fa-check" /> Approve
                    </button>
                  )}
                  <button onClick={() => del(r)} className="px-3 py-1.5 bg-red-50 text-red-500 rounded-xl text-xs font-semibold hover:bg-red-100 transition flex items-center gap-1">
                    <i className="fas fa-trash" /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
