import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Stars } from './ProductCard'
import { addToast } from './ToastContainer'

export default function ReviewSection({ productId, onRatingChange }) {
  const { user, profile } = useAuth()
  const [reviews, setReviews]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [myRating, setMyRating]   = useState(5)
  const [myComment, setMyComment] = useState('')
  const [showForm, setShowForm]   = useState(false)
  const [userReview, setUserReview] = useState(null)

  useEffect(() => {
    loadReviews()
  }, [productId])

  async function loadReviews() {
    setLoading(true)
    const { data } = await supabase
      .from('reviews')
      .select('*')
      .eq('product_id', productId)
      .eq('is_approved', true)
      .order('created_at', { ascending: false })

    if (data?.length) {
      const userIds = [...new Set(data.map(r => r.user_id).filter(Boolean))]
      const { data: profileRows } = await supabase
        .from('profiles').select('id, full_name').in('id', userIds)
      const nameMap = {}
      profileRows?.forEach(p => { nameMap[p.id] = p.full_name })
      const enriched = data.map(r => ({ ...r, reviewer_name: nameMap[r.user_id] || null }))
      setReviews(enriched)
      if (user) setUserReview(enriched.find(r => r.user_id === user.id) || null)
    } else {
      setReviews([])
      setUserReview(null)
    }
    setLoading(false)
  }

  async function submitReview(e) {
    e.preventDefault()
    if (!user) { addToast('Please login to write a review', 'error'); return }
    if (!myComment.trim()) { addToast('Please write a comment', 'error'); return }
    setSubmitting(true)
    try {
      if (userReview) {
        await supabase.from('reviews').update({ rating: myRating, comment: myComment, is_approved: false })
          .eq('id', userReview.id)
      } else {
        await supabase.from('reviews').insert({
          product_id: productId, user_id: user.id,
          rating: myRating, comment: myComment, is_approved: false,
        })
      }
      addToast('Review submitted! Pending approval.', 'success')
      setMyComment('')
      setShowForm(false)
      loadReviews()
      onRatingChange?.()
    } catch (err) {
      addToast('Failed to submit review', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  // Rating breakdown
  const counts = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => Math.round(r.rating) === star).length,
  }))
  const total = reviews.length
  const avg = total ? (reviews.reduce((s, r) => s + r.rating, 0) / total).toFixed(1) : 0

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <i className="fas fa-star star-filled" /> Customer Reviews
      </h2>

      {/* Summary */}
      {total > 0 && (
        <div className="flex flex-col sm:flex-row gap-6 mb-6 p-5 bg-amber-50 rounded-2xl border border-amber-100">
          <div className="flex flex-col items-center justify-center min-w-[100px]">
            <span className="text-5xl font-extrabold text-amber-500">{avg}</span>
            <Stars rating={parseFloat(avg)} size="base" />
            <span className="text-xs text-gray-500 mt-1">{total} review{total !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex-1 flex flex-col gap-1.5">
            {counts.map(({ star, count }) => (
              <div key={star} className="flex items-center gap-2 text-xs">
                <span className="w-6 text-right text-gray-600 font-medium">{star}</span>
                <i className="fas fa-star star-filled text-xs" />
                <div className="rating-bar flex-1">
                  <div
                    className="rating-bar-fill"
                    style={{ width: total ? `${(count / total) * 100}%` : '0%' }}
                  />
                </div>
                <span className="w-5 text-gray-400">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Write review button */}
      {user && !showForm && (
        <button
          onClick={() => { setShowForm(true); setMyRating(userReview?.rating || 5); setMyComment(userReview?.comment || '') }}
          className="mb-4 px-5 py-2.5 border-2 border-primary text-primary rounded-xl text-sm font-semibold hover:bg-primary hover:text-white transition"
        >
          <i className="fas fa-pencil-alt mr-2" />
          {userReview ? 'Edit Your Review' : 'Write a Review'}
        </button>
      )}
      {!user && (
        <p className="text-sm text-gray-500 mb-4 p-3 bg-gray-50 rounded-xl">
          <i className="fas fa-info-circle mr-2 text-primary" />
          Please <button onClick={() => {}} className="text-primary font-semibold underline">login</button> to write a review.
        </p>
      )}

      {/* Review Form */}
      {showForm && (
        <form onSubmit={submitReview} className="mb-6 p-5 bg-gray-50 rounded-2xl border">
          <h3 className="font-semibold text-gray-700 mb-3">
            {userReview ? 'Update Your Review' : 'Your Review'}
          </h3>
          {/* Star picker */}
          <div className="flex items-center gap-1 mb-3">
            {[1, 2, 3, 4, 5].map(s => (
              <button
                key={s} type="button"
                onClick={() => setMyRating(s)}
                className={`text-2xl transition-transform hover:scale-125 ${s <= myRating ? 'star-filled' : 'star-empty'}`}
              >
                ★
              </button>
            ))}
            <span className="ml-2 text-sm text-gray-500">{myRating} / 5</span>
          </div>
          <textarea
            value={myComment}
            onChange={e => setMyComment(e.target.value)}
            rows={3}
            placeholder="Share your experience with this product..."
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
          <div className="flex gap-2 mt-3">
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-dark disabled:opacity-60 transition"
            >
              {submitting ? <><i className="fas fa-spinner fa-spin mr-1" />Submitting...</> : 'Submit Review'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-5 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-100 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Reviews list */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="skeleton h-24 rounded-xl" />)}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <i className="fas fa-comment-slash text-4xl mb-3 block opacity-30" />
          <p>No reviews yet. Be the first!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map(r => (
            <div key={r.id} className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                    {(r.reviewer_name || 'U')[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700">{r.reviewer_name || 'Anonymous'}</p>
                    <Stars rating={r.rating} />
                  </div>
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">
                  {new Date(r.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{r.comment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
