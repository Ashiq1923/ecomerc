import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { addToast } from '../ToastContainer'
import { ImageUpload } from './ProductManager'

const EMPTY = { title: '', subtitle: '', button_text: 'Shop Now', bg_color: '#1e40af', image_url: '', link_url: '', sort_order: 0, is_active: true }

export default function BannerManager() {
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing]  = useState(null)
  const [form,    setForm]     = useState(EMPTY)
  const [saving,  setSaving]   = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('banners').select('*').order('sort_order')
    setBanners(data || [])
    setLoading(false)
  }

  function openNew() { setEditing(null); setForm(EMPTY); setShowForm(true) }
  function openEdit(b) { setEditing(b); setForm({ ...b }); setShowForm(true) }

  async function save(e) {
    e.preventDefault()
    if (!form.title) { addToast('Title is required', 'error'); return }
    setSaving(true)
    const payload = { ...form, sort_order: parseInt(form.sort_order) || 0 }
    try {
      if (editing) {
        await supabase.from('banners').update(payload).eq('id', editing.id)
        addToast('Banner updated!', 'success')
      } else {
        await supabase.from('banners').insert(payload)
        addToast('Banner created!', 'success')
      }
      setShowForm(false)
      load()
    } catch (err) {
      addToast('Save failed', 'error')
    }
    setSaving(false)
  }

  async function del(b) {
    if (!confirm(`Delete banner "${b.title}"?`)) return
    await supabase.from('banners').delete().eq('id', b.id)
    setBanners(prev => prev.filter(x => x.id !== b.id))
    addToast('Banner deleted', 'info')
  }

  async function toggleActive(b) {
    await supabase.from('banners').update({ is_active: !b.is_active }).eq('id', b.id)
    setBanners(prev => prev.map(x => x.id === b.id ? { ...x, is_active: !x.is_active } : x))
  }

  function setF(field) { return e => setForm(f => ({ ...f, [field]: e.target.value })) }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-800">Banners ({banners.length})</h2>
        <button onClick={openNew} className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-dark transition flex items-center gap-2">
          <i className="fas fa-plus" /> Add Banner
        </button>
      </div>

      {loading ? <div className="skeleton h-48 rounded-xl" /> : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {banners.map(b => (
            <div key={b.id} className={`rounded-2xl overflow-hidden border-2 ${b.is_active ? 'border-primary/30' : 'border-gray-100 opacity-60'}`}>
              {/* Preview */}
              <div className="relative h-28 flex items-center px-5" style={{ background: b.bg_color }}>
                {b.image_url && (
                  <img src={b.image_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
                )}
                <div className="relative z-10">
                  <h3 className="text-white font-bold text-sm">{b.title}</h3>
                  {b.subtitle && <p className="text-white/80 text-xs mt-0.5">{b.subtitle}</p>}
                  <span className="inline-block mt-1 px-2 py-0.5 bg-white/20 rounded text-white text-xs">{b.button_text}</span>
                </div>
              </div>
              {/* Actions */}
              <div className="p-3 bg-white flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleActive(b)}
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${b.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {b.is_active ? 'Active' : 'Hidden'}
                  </button>
                  <span className="text-xs text-gray-400">Order: {b.sort_order}</span>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(b)} className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition">
                    <i className="fas fa-edit text-sm" />
                  </button>
                  <button onClick={() => del(b)} className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition">
                    <i className="fas fa-trash text-sm" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {banners.length === 0 && (
            <div className="col-span-3 text-center py-12 text-gray-400">
              <i className="fas fa-images text-4xl mb-3 block opacity-30" />
              <p>No banners yet. Add your first one!</p>
            </div>
          )}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowForm(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto modal-enter">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="font-bold text-gray-800">{editing ? 'Edit Banner' : 'New Banner'}</h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-full"><i className="fas fa-times" /></button>
            </div>
            <form onSubmit={save} className="p-5 space-y-3">
              <Inp label="Title *"      value={form.title}       onChange={setF('title')} />
              <Inp label="Subtitle"     value={form.subtitle}    onChange={setF('subtitle')} />
              <Inp label="Button Text"  value={form.button_text} onChange={setF('button_text')} />
              <Inp label="Link URL"     value={form.link_url}    onChange={setF('link_url')} placeholder="https://..." />
              <ImageUpload
                bucket="images"
                label="Banner Image"
                value={form.image_url}
                onChange={url => setForm(f => ({ ...f, image_url: url }))}
              />
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-600">Background Color</label>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={form.bg_color} onChange={setF('bg_color')} className="w-10 h-10 rounded-lg border cursor-pointer" />
                    <input type="text" value={form.bg_color} onChange={setF('bg_color')} className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm" />
                  </div>
                </div>
                <Inp label="Sort Order" type="number" value={form.sort_order} onChange={setF('sort_order')} />
              </div>
              {/* Preview */}
              {form.title && (
                <div className="rounded-xl h-20 flex items-center px-4 relative overflow-hidden" style={{ background: form.bg_color }}>
                  {form.image_url && <img src={form.image_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />}
                  <div className="relative z-10">
                    <p className="text-white font-bold text-sm">{form.title}</p>
                    {form.subtitle && <p className="text-white/80 text-xs">{form.subtitle}</p>}
                  </div>
                </div>
              )}
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="w-4 h-4 accent-primary" />
                <span className="text-sm text-gray-700">Active</span>
              </label>
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={saving} className="flex-1 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark disabled:opacity-60 transition">
                  {saving ? 'Saving...' : (editing ? 'Update' : 'Create')}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="px-5 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function Inp({ label, value, onChange, type = 'text', placeholder }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-gray-600">{label}</label>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder}
        className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition" />
    </div>
  )
}
