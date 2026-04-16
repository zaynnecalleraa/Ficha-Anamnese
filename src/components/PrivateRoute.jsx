import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function PrivateRoute({ children }) {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
    })
  }, [])

  if (session === undefined) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-gold-500 text-xl font-display">Carregando...</div>
    </div>
  )

  return session ? children : <Navigate to="/login" />
}