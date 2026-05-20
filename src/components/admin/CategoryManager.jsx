import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { addToast } from '../ToastContainer'

const EMPTY = { name: '', icon: '', description: '' }

export default function CategoryManager() {
  const [cats,    setCats]    = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing]  = useState(null)
  const [form,    setForm]     = useState(EMPTY)
  const [saving,  setSaving]   = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('categories').select('*').order('name')
    setCats(data || [])
    setLoading(false)
  }

  function openNew()  { setEditing(null); setForm(EMPTY); setShowForm(true) }
  function openEdit(c){ setEditing(c); setForm({ name: c.name, icon: c.icon || '', description: c.description || '' }); setShowForm(true) }

  async function save(e) {
    e.preventDefault()
    if (!form.name) { addToast('Name is required', 'error'); return }
    setSaving(true)
    try {
      if (editing) {
        await supabase.from('categories').update(form).eq('id', editing.id)
        addToast('Category updated!', 'success')
      } else {
        await supabase.from('categories').insert(form)
        addToast('Category created!', 'success')
      }
      setShowForm(false); load()
    } catch { addToast('Save failed', 'error') }
    setSaving(false)
  }

  async function del(c) {
    if (!confirm(`Delete "${c.name}"?`)) return
    await supabase.from('categories').delete().eq('id', c.id)
    setCats(prev => prev.filter(x => x.id !== c.id))
    addToast('Category deleted', 'info')
  }

  function setF(field) { return e => setForm(f => ({ ...f, [field]: e.target.value })) }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-800">Categories ({cats.length})</h2>
        <button onClick={openNew} className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-dark transition flex items-center gap-2">
          <i className="fas fa-plus" /> Add Category
        </button>
      </div>

      {loading ? <div className="skeleton h-32 rounded-xl" /> : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {cats.map(c => (
            <div key={c.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex flex-col gap-2">
              <div className="flex items-center gap-2">
                {c.icon && <span className="text-2xl">{c.icon}</span>}
                <p className="font-semibold text-gray-800 text-sm">{c.name}</p>
              </div>
              {c.description && <p className="text-xs text-gray-400 line-clamp-2">{c.description}</p>}
              <div className="flex gap-1 mt-auto">
                <button onClick={() => openEdit(c)} className="flex-1 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-100 transition">
                  <i className="fas fa-edit mr-1" /> Edit
                </button>
                <button onClick={() => del(c)} className="flex-1 py-1.5 bg-red-50 text-red-500 rounded-lg text-xs font-semibold hover:bg-red-100 transition">
                  <i className="fas fa-trash mr-1" /> Delete
                </button>
              </div>
            </div>
          ))}
          {cats.length === 0 && <div className="col-span-4 text-center py-10 text-gray-400">No categories yet</div>}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowForm(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="font-bold text-gray-800">{editing ? 'Edit Category' : 'New Category'}</h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-full"><i className="fas fa-times" /></button>
            </div>
            <form onSubmit={save} className="p-5 space-y-3">
              <Inp label="Name *"        name="name"        value={form.name}        onChange={setF('name')} />
              <Inp label="Icon (emoji)" name="icon"        value={form.icon}        onChange={setF('icon')} placeholder="📱" />
              <Inp label="Description"  name="description" value={form.description} onChange={setF('description')} />
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

function Inp({ label, name, value, onChange, placeholder }) {
  const fieldId = `cat-${name || label.toLowerCase().replace(/\s+/g, '-')}`
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={fieldId} className="text-xs font-semibold text-gray-600">{label}</label>
      <input id={fieldId} name={name || fieldId} type="text" value={value} onChange={onChange} placeholder={placeholder}
        className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition" />
    </div>
  )
}
