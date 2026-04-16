import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const SIM_NAO = ['sim', 'não']
const SIM_NAO_ASVEZ = ['sim', 'não', 'às vezes']

function Radio({ name, options, value, onChange }) {
  return (
    <div className="flex gap-4 flex-wrap">
      {options.map(opt => (
        <label key={opt} className="flex items-center gap-2 cursor-pointer text-sm text-gray-600">
          <input
            type="radio"
            name={name}
            value={opt}
            checked={value === opt}
            onChange={() => onChange(opt)}
            className="accent-yellow-600"
          />
          {opt}
        </label>
      ))}
    </div>
  )
}

function Field({ label, children, extra }) {
  return (
    <div className="border-b border-gray-100 pb-4">
      <p className="text-sm text-gray-700 mb-2 font-medium">{label}</p>
      {children}
      {extra}
    </div>
  )
}

function TextInput({ value, onChange, placeholder }) {
  return (
    <input
      type="text"
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder || ''}
      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-yellow-500 transition mt-1"
    />
  )
}

export default function AnamnesisForm() {
  const { token } = useParams()
  const [form, setForm] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [answers, setAnswers] = useState({})
  const [personal, setPersonal] = useState({})

  useEffect(() => {
    fetchForm()
  }, [token])

  async function fetchForm() {
    const { data } = await supabase
      .from('anamnesis_forms')
      .select('*')
      .eq('token', token)
      .single()

    if (data) {
      setForm(data)
      if (data.status === 'completed') setSubmitted(true)
      if (data.answers) setAnswers(data.answers)
    }
    setLoading(false)
  }

  function setA(key, value) {
    setAnswers(prev => ({ ...prev, [key]: value }))
  }

  function setP(key, value) {
    setPersonal(prev => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e) {
  e.preventDefault()
  setSaving(true)

  await supabase
    .from('anamnesis_forms')
    .update({
      status: 'completed',
      submitted_at: new Date().toISOString(),
      answers,
      full_name: personal.full_name,
      birth_date: personal.birth_date,
      address: personal.address,
      cpf: personal.cpf,
      profession: personal.profession,
      marital_status: personal.marital_status,
      email: personal.email,
      phone: personal.phone,
    })
    .eq('token', token)

  setSaving(false)
  setSubmitted(true)

  // Aviso WhatsApp para a clínica
  const nome = personal.full_name || 'Paciente'
  const mensagem = `✅ *Nova ficha preenchida!*\n\nA paciente *${nome}* acabou de preencher a ficha de anamnese.\n\nAcesse o painel para visualizar: ${window.location.origin}`
  const whatsappUrl = `https://wa.me/5592993242367?text=${encodeURIComponent(mensagem)}`
  window.open(whatsappUrl, '_blank')
}

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-yellow-600 font-display text-xl">Carregando...</p>
    </div>
  )

  if (!form) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-red-400 text-center">Link inválido ou expirado.</p>
    </div>
  )

  if (submitted) return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-yellow-50 border-2 border-yellow-400 flex items-center justify-center mx-auto mb-4 text-2xl">✓</div>
        <h2 className="font-display text-2xl text-yellow-600 mb-2">Ficha enviada!</h2>
        <p className="text-gray-400 text-sm">Obrigada! Suas informações foram salvas.<br />Até breve na Callera Clinic. 🌿</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-yellow-200 px-4 py-6 text-center">
        <h1 className="font-display text-3xl font-bold text-yellow-600">Callera Clinic</h1>
        <p className="text-xs text-gray-400 tracking-widest uppercase mt-1">Saúde e Estética</p>
        <div className="w-12 h-px bg-yellow-400 mx-auto mt-3"></div>
        <h2 className="font-display text-xl text-gray-600 mt-3">Ficha de Anamnese</h2>
        <p className="text-xs text-gray-400 mt-1">Preencha com atenção para que possamos oferecer o melhor atendimento.</p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-4 py-8 space-y-5">

        {/* Dados pessoais */}
        <div className="bg-yellow-50 rounded-xl p-5 space-y-4">
          <h3 className="font-display text-lg text-yellow-700">Dados Pessoais</h3>
          {[
            { key: 'full_name', label: 'Nome completo', type: 'text' },
            { key: 'birth_date', label: 'Data de nascimento', type: 'date' },
            { key: 'cpf', label: 'CPF', type: 'text' },
            { key: 'address', label: 'Endereço', type: 'text' },
            { key: 'profession', label: 'Profissão', type: 'text' },
            { key: 'marital_status', label: 'Estado civil', type: 'text' },
            { key: 'email', label: 'E-mail', type: 'email' },
            { key: 'phone', label: 'Celular', type: 'text' },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-sm text-gray-500 mb-1">{f.label}</label>
              <input
                type={f.type}
                value={personal[f.key] || ''}
                onChange={e => setP(f.key, e.target.value)}
                className="w-full border border-yellow-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-yellow-500 transition bg-white"
              />
            </div>
          ))}
        </div>

        {/* Perguntas */}
        <div className="space-y-5">

          <Field label="1. Gosta do formato e volume dos seus lábios?">
            <Radio name="q1" options={SIM_NAO} value={answers.q1} onChange={v => setA('q1', v)} />
          </Field>

          <Field label="2. Você nota marcas de expressão ao sorrir ou falar?">
            <Radio name="q2" options={SIM_NAO} value={answers.q2} onChange={v => setA('q2', v)} />
          </Field>

          <Field label="3. Você nota alguma flacidez no rosto?">
            <Radio name="q3" options={SIM_NAO} value={answers.q3} onChange={v => setA('q3', v)} />
          </Field>

          <Field label="4. Alergias: medicamentos, proteína do ovo, carne suína, picada de abelhas, camarão ou lactose?">
            <Radio name="q4" options={SIM_NAO} value={answers.q4} onChange={v => setA('q4', v)} />
            {answers.q4 === 'sim' && <TextInput value={answers.q4_detail} onChange={v => setA('q4_detail', v)} placeholder="Quais?" />}
          </Field>

          <Field label="5. Apresenta lesões na pele?">
            <Radio name="q5" options={SIM_NAO} value={answers.q5} onChange={v => setA('q5', v)} />
            {answers.q5 === 'sim' && <TextInput value={answers.q5_detail} onChange={v => setA('q5_detail', v)} placeholder="Quais?" />}
          </Field>

          <Field label="6. Apresenta herpes labial ou Zoster?">
            <Radio name="q6" options={SIM_NAO} value={answers.q6} onChange={v => setA('q6', v)} />
          </Field>

          <Field label="7. Faz uso de medicação frequente?">
            <Radio name="q7" options={SIM_NAO} value={answers.q7} onChange={v => setA('q7', v)} />
            {answers.q7 === 'sim' && <TextInput value={answers.q7_detail} onChange={v => setA('q7_detail', v)} placeholder="Qual?" />}
          </Field>

          <Field label="8. Usa ou estava usando Roacutan?">
            <Radio name="q8" options={SIM_NAO} value={answers.q8} onChange={v => setA('q8', v)} />
            {answers.q8 === 'sim' && <TextInput value={answers.q8_detail} onChange={v => setA('q8_detail', v)} placeholder="Quando parou?" />}
          </Field>

          <Field label="9. Usa anticoagulantes, aspirina ou AAS ou tem problema de coagulação?">
            <Radio name="q9" options={SIM_NAO} value={answers.q9} onChange={v => setA('q9', v)} />
          </Field>

          <Field label="10. Tomou vacina antitetânica há pouco tempo?">
            <Radio name="q10" options={SIM_NAO} value={answers.q10} onChange={v => setA('q10', v)} />
          </Field>

          <Field label="11. Tomou vacina COVID-19?">
            <Radio name="q11" options={SIM_NAO} value={answers.q11} onChange={v => setA('q11', v)} />
            {answers.q11 === 'sim' && <TextInput value={answers.q11_detail} onChange={v => setA('q11_detail', v)} placeholder="Data da última dose" />}
          </Field>

          <Field label="12. Fumante?">
            <Radio name="q12" options={SIM_NAO} value={answers.q12} onChange={v => setA('q12', v)} />
          </Field>

          <Field label="13. Doença renal?">
            <Radio name="q13" options={SIM_NAO} value={answers.q13} onChange={v => setA('q13', v)} />
          </Field>

          <Field label="14. Problemas hormonais / tireoide / fígado?">
            <Radio name="q14" options={SIM_NAO} value={answers.q14} onChange={v => setA('q14', v)} />
          </Field>

          <Field label="15. Bronquite / asma / tuberculose?">
            <Radio name="q15" options={SIM_NAO} value={answers.q15} onChange={v => setA('q15', v)} />
          </Field>

          <Field label="16. Tem dores de cabeça / febre frequente?">
            <Radio name="q16" options={SIM_NAO} value={answers.q16} onChange={v => setA('q16', v)} />
          </Field>

          <Field label="17. Alguma doença viral? HIV, Sífilis, hepatite (A, B ou C)?">
            <Radio name="q17" options={SIM_NAO} value={answers.q17} onChange={v => setA('q17', v)} />
          </Field>

          <Field label="18. Diabetes / hipertenso / anemia?">
            <Radio name="q18" options={SIM_NAO} value={answers.q18} onChange={v => setA('q18', v)} />
          </Field>

          <Field label="19. Alguma doença autoimune, reumatismo / febre reumática?">
            <Radio name="q19" options={SIM_NAO} value={answers.q19} onChange={v => setA('q19', v)} />
          </Field>

          <Field label="20. Está com gengivite, periodontite, canal ou alguma infecção na boca?">
            <Radio name="q20" options={SIM_NAO} value={answers.q20} onChange={v => setA('q20', v)} />
          </Field>

          <Field label="21. Teve ou tem alguma outra doença?">
            <Radio name="q21" options={SIM_NAO} value={answers.q21} onChange={v => setA('q21', v)} />
            {answers.q21 === 'sim' && <TextInput value={answers.q21_detail} onChange={v => setA('q21_detail', v)} placeholder="Qual?" />}
          </Field>

          <Field label="22. Dorme bem?">
            <Radio name="q22" options={SIM_NAO_ASVEZ} value={answers.q22} onChange={v => setA('q22', v)} />
          </Field>

          <Field label="23. Sente-se desmotivado(a)?">
            <Radio name="q23" options={SIM_NAO_ASVEZ} value={answers.q23} onChange={v => setA('q23', v)} />
          </Field>

          <Field label="24. Está com queda de cabelo, unhas fracas ou pele ressecada?">
            <Radio name="q24" options={SIM_NAO} value={answers.q24} onChange={v => setA('q24', v)} />
          </Field>

          <Field label="25. Como está o seu nível de concentração?">
            <TextInput value={answers.q25} onChange={v => setA('q25', v)} />
          </Field>

          <Field label="26. Como está a sua memória?">
            <TextInput value={answers.q26} onChange={v => setA('q26', v)} />
          </Field>

          <Field label="27. Sente-se cansado(a)?">
            <Radio name="q27" options={SIM_NAO} value={answers.q27} onChange={v => setA('q27', v)} />
            {answers.q27 === 'sim' && <TextInput value={answers.q27_detail} onChange={v => setA('q27_detail', v)} placeholder="Em qual horário do dia?" />}
          </Field>

          <Field label="28. Seu intestino funciona bem?">
            <Radio name="q28" options={SIM_NAO_ASVEZ} value={answers.q28} onChange={v => setA('q28', v)} />
          </Field>

          <Field label="29. A maior parte da alimentação diária é:">
            <div className="flex gap-3 flex-wrap mt-1">
              {['carboidratos', 'doces', 'proteínas', 'frutas', 'legumes', 'outros'].map(opt => (
                <label key={opt} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(answers.q29 || []).includes(opt)}
                    onChange={e => {
                      const prev = answers.q29 || []
                      setA('q29', e.target.checked ? [...prev, opt] : prev.filter(x => x !== opt))
                    }}
                    className="accent-yellow-600"
                  />
                  {opt}
                </label>
              ))}
            </div>
          </Field>

          <Field label="30. Quanto costuma tomar de água por dia?">
            <TextInput value={answers.q30} onChange={v => setA('q30', v)} />
          </Field>

          <Field label="31. Tem outra bebida de rotina?">
            <div className="flex gap-3 flex-wrap mt-1">
              {['café', 'chá', 'refrigerante', 'leite', 'suco', 'vinho', 'cerveja', 'outra'].map(opt => (
                <label key={opt} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(answers.q31 || []).includes(opt)}
                    onChange={e => {
                      const prev = answers.q31 || []
                      setA('q31', e.target.checked ? [...prev, opt] : prev.filter(x => x !== opt))
                    }}
                    className="accent-yellow-600"
                  />
                  {opt}
                </label>
              ))}
            </div>
          </Field>

          <Field label="32. Usa antidepressivos ou medicamentos para ansiedade?">
            <Radio name="q32" options={SIM_NAO} value={answers.q32} onChange={v => setA('q32', v)} />
            {answers.q32 === 'sim' && <TextInput value={answers.q32_detail} onChange={v => setA('q32_detail', v)} placeholder="Qual?" />}
          </Field>

          <Field label="33. Pressão arterial / Peso / Altura">
            <div className="grid grid-cols-3 gap-2 mt-1">
              <TextInput value={answers.q33_pressao} onChange={v => setA('q33_pressao', v)} placeholder="Pressão" />
              <TextInput value={answers.q33_peso} onChange={v => setA('q33_peso', v)} placeholder="Peso" />
              <TextInput value={answers.q33_altura} onChange={v => setA('q33_altura', v)} placeholder="Altura" />
            </div>
          </Field>

          <Field label="34. Já realizou algum procedimento estético na face?">
            <Radio name="q34" options={SIM_NAO} value={answers.q34} onChange={v => setA('q34', v)} />
            {answers.q34 === 'sim' && <TextInput value={answers.q34_detail} onChange={v => setA('q34_detail', v)} placeholder="Qual tratamento e quando foi a última aplicação?" />}
          </Field>

          <Field label="35. Se expõe com frequência ao sol?">
            <Radio name="q35" options={SIM_NAO} value={answers.q35} onChange={v => setA('q35', v)} />
          </Field>

          <Field label="36. Acne?">
            <Radio name="q36" options={SIM_NAO_ASVEZ} value={answers.q36} onChange={v => setA('q36', v)} />
            {answers.q36 === 'sim' && (
              <div className="flex gap-4 mt-2">
                {['acne ativa', 'cicatrizes'].map(opt => (
                  <label key={opt} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                    <input type="checkbox"
                      checked={(answers.q36_detail || []).includes(opt)}
                      onChange={e => {
                        const prev = answers.q36_detail || []
                        setA('q36_detail', e.target.checked ? [...prev, opt] : prev.filter(x => x !== opt))
                      }}
                      className="accent-yellow-600"
                    />
                    {opt}
                  </label>
                ))}
              </div>
            )}
          </Field>

          <Field label="37. Atividade física que pratica e quantas vezes por semana:">
            <TextInput value={answers.q37} onChange={v => setA('q37', v)} />
          </Field>

          <Field label="38. Gestante ou tentando engravidar?">
            <Radio name="q38" options={SIM_NAO} value={answers.q38} onChange={v => setA('q38', v)} />
          </Field>

          <Field label="39. Usa anticoncepcional ou DIU? Qual e há quanto tempo?">
            <TextInput value={answers.q39} onChange={v => setA('q39', v)} />
          </Field>

          <Field label="40. Está na menopausa? Há quanto tempo? Faz reposição hormonal?">
            <TextInput value={answers.q40} onChange={v => setA('q40', v)} />
          </Field>

          <Field label="41. O que gostaria de melhorar ou prevenir na sua face?">
            <textarea
              value={answers.q41 || ''}
              onChange={e => setA('q41', e.target.value)}
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-yellow-500 transition mt-1 resize-none"
            />
          </Field>

          <Field label="42. Gostaria de informar algo que não foi perguntado?">
            <textarea
              value={answers.q42 || ''}
              onChange={e => setA('q42', e.target.value)}
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-yellow-500 transition mt-1 resize-none"
            />
          </Field>

          <Field label="44. Descreva seus cuidados diários com o rosto, pescoço e colo:">
            <div className="grid grid-cols-2 gap-3 mt-1">
              <div>
                <p className="text-xs text-gray-400 mb-1 text-center">Manhã</p>
                <textarea
                  value={answers.q44_dia || ''}
                  onChange={e => setA('q44_dia', e.target.value)}
                  rows={4}
                  placeholder="Limpeza, proteção solar, hidratação..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-yellow-500 transition resize-none"
                />
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1 text-center">Noite</p>
                <textarea
                  value={answers.q44_noite || ''}
                  onChange={e => setA('q44_noite', e.target.value)}
                  rows={4}
                  placeholder="Limpeza, hidratação, tratamentos..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-yellow-500 transition resize-none"
                />
              </div>
            </div>
          </Field>
        </div>

        {/* Botão enviar */}
        <div className="pt-4 pb-10">
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-4 rounded-xl transition text-sm tracking-wide shadow-md"
          >
            {saving ? 'Enviando...' : 'Enviar Ficha de Anamnese'}
          </button>
          <p className="text-center text-xs text-gray-300 mt-3">
            Callera Clinic · Cidade nova, Rua Guapimirim, 27 - Manaus
          </p>
        </div>
      </form>
    </div>
  )
}