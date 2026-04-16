import { Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import PatientDetail from './pages/PatientDetail'
import AnamnesisForm from './pages/AnamnesisForm'
import PrintForm from './pages/PrintForm'
import Procedures from './pages/Procedures'
import PrivateRoute from './components/PrivateRoute'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/ficha/:token" element={<AnamnesisForm />} />
      <Route path="/imprimir/:token" element={<PrintForm />} />
      <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/paciente/:id" element={<PrivateRoute><PatientDetail /></PrivateRoute>} />
      <Route path="/procedimentos" element={<PrivateRoute><Procedures /></PrivateRoute>} />
    </Routes>
  )
}