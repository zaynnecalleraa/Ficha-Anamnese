import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ArrowLeft, Plus, Pencil, Trash2, Check, X } from 'lucide-react'

export default function Procedures() {
  const navigate = useNavigate()
  const [procedures, setProcedures] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ name: '', description: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchProcedures()
  }, [])

  async function fetchProcedures() {
    const { data } = await supabase
      .from('procedures')
      .select('*')
      .order('name')
    setProcedures(data || [])
    setLoading(false)
  }

  function openNew() {
    setEditingId(null)
    setForm({ name: '', description: '' })
    setShowModal(true)
  }

  function openEdit(proc) {
    setEditingId(proc.id)
    setForm({ name: proc.name, description: proc.description || '' })
    setShowModal(true)
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)

    if (editingId) {
      await supabase.from('procedures').update(form).eq('id', editingId)
    } else {
      await supabase.from('procedures').insert(form)
    }

    setSaving(false)
    setShowModal(false)
    fetchProcedures()
  }

  async function handleDelete(id) {
    if (!confirm('Tem certeza que deseja excluir este procedimento?')) return
    await supabase.from('procedures').delete().eq('id', id)
    fetchProcedures()
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Navbar */}
      <nav className="bg-white border-b border-yellow-200 px-6 py-4 flex items-center gap-4 shadow-sm">
        <button onClick={() => navigate('/')} className="text-gray-400 hover:text-yellow-600 transition">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="font-display text-xl text-yellow-600 font-bold">Callera Clinic</h1>
          <p className="text-xs text-gray-400 tracking-widest uppercase">Procedimentos</p>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8">

        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl text-gray-700">Procedimentos</h2>
          <button
            onClick={openNew}
            className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm transition"
          >
            <Plus size={16} />
            Novo procedimento
          </button>
        </div>

        {loading ? (
          <p className="text-center text-gray-400 py-12">Carregando...</p>
        ) : procedures.length === 0 ? (
          <div className="text-center py-16 text-gray-300">
            <p>Nenhum procedimento cadastrado ainda.</p>
            <p className="text-sm mt-1">Clique em "Novo procedimento" para começar.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {procedures.map(proc => (
              <div key={proc.id} className="bg-white border border-gray-100 rounded-xl px-5 py-4 flex items-center justify-between shadow-sm hover:border-yellow-200 transition">
                <div>
                  <p className="font-medium text-gray-700">{proc.name}</p>
                  {proc.description && <p className="text-xs text-gray-400 mt-0.5">{proc.description}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEdit(proc)}
                    className="text-gray-300 hover:text-yellow-500 transition p-1.5 rounded-lg hover:bg-yellow-50"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => handleDelete(proc.id)}
                    className="text-gray-300 hover:text-red-400 transition p-1.5 rounded-lg hover:bg-red-50"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-xl">
            <h3 className="font-display text-2xl text-gray-700 mb-6">
              {editingId ? 'Editar procedimento' : 'Novo procedimento'}
            </h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-500 mb-1">Nome *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-yellow-500 transition"
                  placeholder="Ex: Toxina Botulínica"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Descrição</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-yellow-500 transition resize-none"
                  placeholder="Descrição opcional..."
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 border border-gray-200 text-gray-400 py-3 rounded-lg text-sm hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white py-3 rounded-lg text-sm transition"
                >
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}