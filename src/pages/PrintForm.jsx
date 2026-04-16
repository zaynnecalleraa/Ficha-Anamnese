import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function PrintForm() {
  const { token } = useParams()
  const [form, setForm] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchForm()
  }, [token])

  async function fetchForm() {
    const { data } = await supabase
      .from('anamnesis_forms')
      .select('*')
      .eq('token', token)
      .single()
    setForm(data)
    setLoading(false)
  }

  useEffect(() => {
    if (!loading && form) {
      setTimeout(() => window.print(), 800)
    }
  }, [loading, form])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-yellow-600 font-display text-xl">Preparando impressão...</p>
    </div>
  )

  if (!form) return <p className="text-center mt-10 text-red-400">Ficha não encontrada.</p>

  const a = form.answers || {}

  const simNao = (val) => val || '—'

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Montserrat:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Montserrat', sans-serif; background: white; color: #333; }
        .print-container { max-width: 800px; margin: 0 auto; padding: 30px 40px; }
        .header { text-align: center; border-bottom: 2px solid #D4AF37; padding-bottom: 16px; margin-bottom: 20px; }
        .clinic-name { font-family: 'Playfair Display', serif; font-size: 28px; color: #D4AF37; font-weight: 700; }
        .clinic-sub { font-size: 10px; color: #999; letter-spacing: 3px; text-transform: uppercase; margin-top: 4px; }
        .title { font-family: 'Playfair Display', serif; font-size: 18px; color: #555; margin-top: 10px; letter-spacing: 2px; }
        .section { background: #FFFDF5; border: 1px solid #F0D070; border-radius: 8px; padding: 14px 16px; margin-bottom: 16px; }
        .section-title { font-family: 'Playfair Display', serif; font-size: 13px; color: #B8960C; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px; }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
        .field { margin-bottom: 6px; }
        .field-label { font-size: 9px; color: #999; text-transform: uppercase; letter-spacing: 0.5px; }
        .field-value { font-size: 11px; color: #333; border-bottom: 1px solid #E0C060; padding-bottom: 2px; min-height: 16px; margin-top: 2px; }
        .questions { margin-bottom: 16px; }
        .question { display: flex; justify-content: space-between; align-items: flex-start; padding: 5px 0; border-bottom: 1px solid #F5F5F5; gap: 12px; }
        .question-label { font-size: 10px; color: #555; flex: 1; }
        .question-answer { font-size: 10px; color: #333; font-weight: 600; text-align: right; min-width: 60px; }
        .question-detail { font-size: 9px; color: #888; margin-top: 2px; }
        .grid-day-night { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .day-night-box { border: 1px solid #E0C060; border-radius: 6px; padding: 8px; min-height: 60px; }
        .day-night-title { font-size: 9px; color: #B8960C; text-align: center; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 1px; }
        .day-night-content { font-size: 10px; color: #555; }
        .footer { text-align: center; border-top: 1px solid #E0C060; padding-top: 12px; margin-top: 20px; }
        .footer-text { font-size: 9px; color: #B8960C; letter-spacing: 1px; }
        .signature-area { display: flex; justify-content: center; margin-top: 30px; }
        .signature-line { text-align: center; }
        .signature-line hr { width: 260px; border: none; border-top: 1px solid #333; margin-bottom: 6px; }
        .signature-line p { font-size: 10px; color: #555; }
        .date-line { text-align: right; font-size: 10px; color: #555; margin-top: 16px; }
        .no-print { }
        @media print {
          .no-print { display: none !important; }
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
        }
      `}</style>

      {/* Botão imprimir (some ao imprimir) */}
      <div className="no-print fixed top-4 right-4">
        <button
          onClick={() => window.print()}
          className="bg-yellow-500 text-white px-4 py-2 rounded-lg text-sm shadow"
        >
          🖨️ Imprimir
        </button>
      </div>

      <div className="print-container">

        {/* Cabeçalho */}
        <div className="header">
          <div className="clinic-name">Callera Clinic</div>
          <div className="clinic-sub">Saúde e Estética</div>
          <div className="title">F I C H A &nbsp; D E &nbsp; A N A M N E S E</div>
        </div>

        {/* Dados pessoais */}
        <div className="section">
          <div className="section-title">Dados Pessoais</div>
          <div className="grid-2">
            <div className="field"><div className="field-label">Nome completo</div><div className="field-value">{form.full_name || ''}</div></div>
            <div className="field"><div className="field-label">Data de nascimento</div><div className="field-value">{form.birth_date || ''}</div></div>
            <div className="field"><div className="field-label">CPF</div><div className="field-value">{form.cpf || ''}</div></div>
            <div className="field"><div className="field-label">Profissão</div><div className="field-value">{form.profession || ''}</div></div>
            <div className="field"><div className="field-label">Estado civil</div><div className="field-value">{form.marital_status || ''}</div></div>
            <div className="field"><div className="field-label">E-mail</div><div className="field-value">{form.email || ''}</div></div>
            <div className="field"><div className="field-label">Celular</div><div className="field-value">{form.phone || ''}</div></div>
            <div className="field"><div className="field-label">Endereço</div><div className="field-value">{form.address || ''}</div></div>
          </div>
        </div>

        {/* Perguntas */}
        <div className="section">
          <div className="section-title">Questionário de Saúde</div>
          <div className="questions">
            {[
              { n: '1', label: 'Gosta do formato e volume dos seus lábios?', key: 'q1' },
              { n: '2', label: 'Marcas de expressão ao sorrir ou falar?', key: 'q2' },
              { n: '3', label: 'Flacidez no rosto?', key: 'q3' },
              { n: '4', label: 'Alergias?', key: 'q4', detail: 'q4_detail' },
              { n: '5', label: 'Lesões na pele?', key: 'q5', detail: 'q5_detail' },
              { n: '6', label: 'Herpes labial ou Zoster?', key: 'q6' },
              { n: '7', label: 'Medicação frequente?', key: 'q7', detail: 'q7_detail' },
              { n: '8', label: 'Usa/usava Roacutan?', key: 'q8', detail: 'q8_detail' },
              { n: '9', label: 'Anticoagulantes / problema de coagulação?', key: 'q9' },
              { n: '10', label: 'Vacina antitetânica recente?', key: 'q10' },
              { n: '11', label: 'Vacina COVID-19?', key: 'q11', detail: 'q11_detail' },
              { n: '12', label: 'Fumante?', key: 'q12' },
              { n: '13', label: 'Doença renal?', key: 'q13' },
              { n: '14', label: 'Problemas hormonais / tireoide / fígado?', key: 'q14' },
              { n: '15', label: 'Bronquite / asma / tuberculose?', key: 'q15' },
              { n: '16', label: 'Dores de cabeça / febre frequente?', key: 'q16' },
              { n: '17', label: 'Doença viral (HIV, Sífilis, hepatite)?', key: 'q17' },
              { n: '18', label: 'Diabetes / hipertenso / anemia?', key: 'q18' },
              { n: '19', label: 'Doença autoimune / reumatismo?', key: 'q19' },
              { n: '20', label: 'Infecção na boca?', key: 'q20' },
              { n: '21', label: 'Outra doença?', key: 'q21', detail: 'q21_detail' },
              { n: '22', label: 'Dorme bem?', key: 'q22' },
              { n: '23', label: 'Sente-se desmotivado(a)?', key: 'q23' },
              { n: '24', label: 'Queda de cabelo / unhas fracas / pele ressecada?', key: 'q24' },
              { n: '25', label: 'Nível de concentração', key: 'q25' },
              { n: '26', label: 'Memória', key: 'q26' },
              { n: '27', label: 'Sente-se cansado(a)?', key: 'q27', detail: 'q27_detail' },
              { n: '28', label: 'Intestino funciona bem?', key: 'q28' },
              { n: '30', label: 'Água por dia', key: 'q30' },
              { n: '32', label: 'Antidepressivos / ansiedade?', key: 'q32', detail: 'q32_detail' },
              { n: '35', label: 'Exposição frequente ao sol?', key: 'q35' },
              { n: '36', label: 'Acne?', key: 'q36' },
              { n: '37', label: 'Atividade física', key: 'q37' },
              { n: '38', label: 'Gestante ou tentando engravidar?', key: 'q38' },
              { n: '39', label: 'Anticoncepcional / DIU?', key: 'q39' },
              { n: '40', label: 'Menopausa / reposição hormonal?', key: 'q40' },
            ].map(q => (
              <div key={q.key} className="question">
                <div className="question-label">{q.n}. {q.label}</div>
                <div>
                  <div className="question-answer">{simNao(Array.isArray(a[q.key]) ? a[q.key].join(', ') : a[q.key])}</div>
                  {q.detail && a[q.detail] && <div className="question-detail">{a[q.detail]}</div>}
                </div>
              </div>
            ))}

            {/* Pressão / Peso / Altura */}
            <div className="question">
              <div className="question-label">33. Pressão arterial / Peso / Altura</div>
              <div className="question-answer">{a.q33_pressao || '—'} / {a.q33_peso || '—'} / {a.q33_altura || '—'}</div>
            </div>

            {/* Procedimento estético */}
            <div className="question">
              <div className="question-label">34. Procedimento estético anterior?</div>
              <div>
                <div className="question-answer">{simNao(a.q34)}</div>
                {a.q34_detail && <div className="question-detail">{a.q34_detail}</div>}
              </div>
            </div>

            {/* Alimentação */}
            <div className="question">
              <div className="question-label">29. Alimentação principal</div>
              <div className="question-answer">{Array.isArray(a.q29) ? a.q29.join(', ') : '—'}</div>
            </div>

            {/* Bebidas */}
            <div className="question">
              <div className="question-label">31. Bebidas de rotina</div>
              <div className="question-answer">{Array.isArray(a.q31) ? a.q31.join(', ') : '—'}</div>
            </div>

            {/* Melhorar */}
            <div className="question">
              <div className="question-label">41. O que gostaria de melhorar?</div>
              <div className="question-answer" style={{ maxWidth: '200px', textAlign: 'right' }}>{a.q41 || '—'}</div>
            </div>

            {/* Info adicional */}
            <div className="question">
              <div className="question-label">42. Informações adicionais</div>
              <div className="question-answer" style={{ maxWidth: '200px', textAlign: 'right' }}>{a.q42 || '—'}</div>
            </div>
          </div>
        </div>

        {/* Rotina dia/noite */}
        <div className="section">
          <div className="section-title">44. Cuidados Diários com Rosto, Pescoço e Colo</div>
          <div className="grid-day-night">
            <div className="day-night-box">
              <div className="day-night-title">Manhã</div>
              <div className="day-night-content">{a.q44_dia || ''}</div>
            </div>
            <div className="day-night-box">
              <div className="day-night-title">Noite</div>
              <div className="day-night-content">{a.q44_noite || ''}</div>
            </div>
          </div>
        </div>

        {/* Assinatura */}
        <div className="date-line">
          Manaus, _______ de _________________________ de 2025.
        </div>
        <div className="signature-area">
          <div className="signature-line">
            <hr />
            <p>Assinatura do(a) paciente</p>
          </div>
        </div>

        {/* Rodapé */}
        <div className="footer">
          <div className="footer-text">Cidade Nova, Rua Guapimirim, 27 — Manaus · @calleraclinic · (92) 99324-2367 · calleraclinic@gmail.com</div>
        </div>
      </div>
    </>
  )
}