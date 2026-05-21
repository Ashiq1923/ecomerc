import { useState, useEffect, useRef } from 'react'
import { supabase, formatPrice } from '../../lib/supabase'
import { addToast } from '../ToastContainer'

const EMPTY = { name: '', description: '', price: '', sale_price: '', stock: '', category_id: '', image_url: '', is_active: true }
const BUCKET = 'images'

export default function ProductManager() {
  const [products,   setProducts]   = useState([])
  const [categories, setCategories] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [showForm,   setShowForm]   = useState(false)
  const [editing,    setEditing]    = useState(null)
  const [form,       setForm]       = useState(EMPTY)
  const [saving,     setSaving]     = useState(false)
  const [search,     setSearch]     = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [{ data: prods }, { data: cats }] = await Promise.all([
      supabase.from('products').select('*, categories(name)').order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('name'),
    ])
    setProducts(prods || [])
    setCategories(cats || [])
    setLoading(false)
  }

  function openNew()  { setEditing(null); setForm(EMPTY); setShowForm(true) }
  function openEdit(p) {
    setEditing(p)
    setForm({ name: p.name, description: p.description || '', price: p.price, sale_price: p.sale_price || '', stock: p.stock, category_id: p.category_id || '', image_url: p.image_url || '', is_active: p.is_active })
    setShowForm(true)
  }

  async function save(e) {
    e.preventDefault()
    if (!form.name || !form.price) { addToast('Name and price are required', 'error'); return }
    setSaving(true)
    const payload = {
      name:        form.name,
      description: form.description,
      price:       parseFloat(form.price),
      sale_price:  form.sale_price ? parseFloat(form.sale_price) : null,
      stock:       parseInt(form.stock) || 0,
      category_id: form.category_id || null,
      image_url:   form.image_url || null,
      is_active:   form.is_active,
    }
    try {
      if (editing) {
        await supabase.from('products').update(payload).eq('id', editing.id)
        addToast('Product updated!', 'success')
      } else {
        await supabase.from('products').insert(payload)
        addToast('Product created!', 'success')
      }
      setShowForm(false)
      load()
    } catch (err) {
      addToast('Save failed: ' + err.message, 'error')
    }
    setSaving(false)
  }

  async function toggleActive(p) {
    await supabase.from('products').update({ is_active: !p.is_active }).eq('id', p.id)
    setProducts(prev => prev.map(x => x.id === p.id ? { ...x, is_active: !x.is_active } : x))
  }

  async function del(p) {
    if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return
    await supabase.from('products').delete().eq('id', p.id)
    setProducts(prev => prev.filter(x => x.id !== p.id))
    addToast('Product deleted', 'info')
  }

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="text-lg font-bold text-gray-800">Products ({products.length})</h2>
        <div className="flex gap-2">
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search..." className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 w-44"
          />
          <button onClick={openNew} className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-dark transition flex items-center gap-2">
            <i className="fas fa-plus" /> Add Product
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? <div className="skeleton h-64 rounded-xl" /> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-left">
                {['Image', 'Name', 'Category', 'Price', 'Stock', 'Rating', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-3 py-3 font-semibold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 transition">
                  <td className="px-3 py-2">
                    <img src={p.image_url || `https://placehold.co/48x48?text=${encodeURIComponent(p.name[0])}`} alt="" className="w-10 h-10 rounded-lg object-cover border" />
                  </td>
                  <td className="px-3 py-2">
                    <p className="font-semibold text-gray-800 max-w-[160px] truncate">{p.name}</p>
                    {p.sale_price && <span className="text-xs text-red-500">On Sale</span>}
                  </td>
                  <td className="px-3 py-2 text-gray-500">{p.categories?.name || '—'}</td>
                  <td className="px-3 py-2">
                    <p className="font-bold">{formatPrice(p.sale_price || p.price)}</p>
                    {p.sale_price && <p className="text-xs text-gray-400 line-through">{formatPrice(p.price)}</p>}
                  </td>
                  <td className="px-3 py-2">
                    <span className={`font-semibold ${p.stock <= 5 ? 'text-red-500' : 'text-gray-700'}`}>{p.stock}</span>
                  </td>
                  <td className="px-3 py-2 text-amber-500 font-semibold">
                    {p.avg_rating ? `${Number(p.avg_rating).toFixed(1)}` : '—'}
                  </td>
                  <td className="px-3 py-2">
                    <button onClick={() => toggleActive(p)}
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {p.is_active ? 'Active' : 'Hidden'}
                    </button>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(p)} className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition">
                        <i className="fas fa-edit text-sm" />
                      </button>
                      <button onClick={() => del(p)} className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition">
                        <i className="fas fa-trash text-sm" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="text-center py-10 text-gray-400">No products found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowForm(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto modal-enter">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="font-bold text-gray-800">{editing ? 'Edit Product' : 'New Product'}</h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-full"><i className="fas fa-times" /></button>
            </div>
            <form onSubmit={save} className="p-5 space-y-3">
              <Inp label="Product Name *" name="name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600">Description</label>
                <textarea id="prod-description" name="description" rows={3} value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Inp label="Price (Rs.) *" name="price"      type="number" value={form.price}      onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
                <Inp label="Sale Price"    name="sale_price"  type="number" value={form.sale_price}  onChange={e => setForm(f => ({ ...f, sale_price: e.target.value }))} />
                <Inp label="Stock"         name="stock"       type="number" value={form.stock}       onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} />
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-600">Category</label>
                  <select value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
                    className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary">
                    <option value="">None</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Image upload */}
              <ImageUpload
                bucket={BUCKET}
                value={form.image_url}
                onChange={url => setForm(f => ({ ...f, image_url: url }))}
              />

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="w-4 h-4 accent-primary" />
                <span className="text-sm text-gray-700">Active (visible to customers)</span>
              </label>
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={saving}
                  className="flex-1 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark disabled:opacity-60 transition">
                  {saving ? <><i className="fas fa-spinner fa-spin mr-1" />Saving...</> : (editing ? 'Update' : 'Create')}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-5 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Image Upload Component ─────────────────────────────────────── */
export function ImageUpload({ bucket, value, onChange, label = 'Product Image' }) {
  const [uploading, setUploading] = useState(false)
  const [error,     setError]     = useState(null)
  const inputRef = useRef()

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate type and size (max 5MB)
    if (!file.type.startsWith('image/')) {
      setError('Sirf image files allowed hain (jpg, png, webp)')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image 5MB se choti honi chahiye')
      return
    }

    setError(null)
    setUploading(true)

    try {
      const ext      = file.name.split('.').pop()
      const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`

      const { data, error: uploadErr } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, { cacheControl: '3600', upsert: false })

      if (uploadErr) throw uploadErr

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path)

      onChange(publicUrl)
    } catch (err) {
      setError(err.message || 'Upload fail hua, dobara try karo')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-gray-600">{label}</label>

      {/* Preview + upload area */}
      <div className="flex gap-3 items-start">

        {/* Preview box */}
        <div className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 flex-shrink-0 overflow-hidden bg-gray-50 flex items-center justify-center">
          {value ? (
            <img src={value} alt="Preview" className="w-full h-full object-cover" onError={e => e.target.style.display='none'} />
          ) : (
            <i className="fas fa-image text-2xl text-gray-300" />
          )}
        </div>

        {/* Controls */}
        <div className="flex-1 space-y-2">
          {/* Upload button */}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-xl text-sm font-semibold transition disabled:opacity-50 w-full justify-center"
          >
            {uploading
              ? <><i className="fas fa-spinner fa-spin" /> Uploading...</>
              : <><i className="fas fa-upload" /> Device se Upload karo</>
            }
          </button>
          <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />

          {/* Manual URL input */}
          <input
            type="text"
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder="ya URL paste karo..."
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition text-gray-600"
          />
        </div>
      </div>

      {/* Remove button */}
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="text-xs text-red-400 hover:text-red-600 transition self-start flex items-center gap-1"
        >
          <i className="fas fa-times" /> Image hatao
        </button>
      )}

      {/* Error */}
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <i className="fas fa-exclamation-circle" /> {error}
        </p>
      )}
    </div>
  )
}

function Inp({ label, name, type = 'text', value, onChange, placeholder }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-gray-600">{label}</label>
      <input id={`prod-${name}`} name={name} type={type} value={value} onChange={onChange} placeholder={placeholder}
        className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition" />
    </div>
  )
}
