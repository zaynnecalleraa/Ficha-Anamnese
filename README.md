# 🌿 Ficha Anamnese — Callera Clinic

> Sistema web de gestão de fichas de anamnese desenvolvido exclusivamente para a **Callera Clinic**, clínica de saúde e estética localizada em Manaus, Amazonas.

---

## 🏥 Sobre a Callera Clinic

A **Callera Clinic** é uma clínica de saúde e estética situada em Manaus, no coração da Amazônia. Com foco em tratamentos personalizados e atendimento humanizado, a clínica oferece procedimentos como toxina botulínica, preenchimento com ácido hialurônico, bioestimuladores de colágeno, microagulhamento, peelings e muito mais.

📍 Cidade Nova, Rua Guapimirim, 27 — Manaus, AM  
📱 (92) 99324-2367  
📸 [@calleraclinic](https://instagram.com/calleraclinic)  
✉️ calleraclinic@gmail.com  

---

## 💡 Sobre o Projeto

O **Ficha Anamnese** é um sistema web completo que digitaliza e moderniza o processo de coleta de informações das pacientes da Callera Clinic.

Antes do sistema, as fichas eram preenchidas manualmente no consultório, consumindo tempo da profissional e da paciente. Com o sistema, o link da ficha é enviado antes da consulta, o paciente preenche no conforto de casa e, ao chegar na clínica, o atendimento já pode ser mais ágil e focado no tratamento.

---

## ✨ Funcionalidades

- 🔐 **Login profissional** — acesso seguro com email e senha
- 👩‍⚕️ **Gestão de pacientes** — cadastro com foto, edição de dados e histórico completo
- 🔗 **Link único por paciente** — ficha enviada via WhatsApp ou qualquer canal
- 📋 **Ficha de anamnese online** — 44 perguntas completas preenchidas pelo paciente
- 🖨️ **Impressão elegante** — layout fiel ao modelo original, pronto para assinar
- 📅 **Histórico de sessões** — registro de cada atendimento com procedimento, observações e fotos antes/depois
- 📎 **Anexo de exames** — upload de arquivos por paciente
- ⚙️ **Cadastro de procedimentos** — lista personalizada de tratamentos oferecidos
- 🔍 **Busca de pacientes** — filtro por nome, telefone ou e-mail
- 📲 **Aviso por WhatsApp** — notificação automática quando a ficha é preenchida
- 📱 **Responsivo** — funciona perfeitamente em celular, tablet e computador

---

## 🛠️ Tecnologias Utilizadas

| Tecnologia | Uso |
|---|---|
| [React](https://react.dev) + [Vite](https://vitejs.dev) | Frontend |
| [Tailwind CSS](https://tailwindcss.com) | Estilização |
| [React Router](https://reactrouter.com) | Navegação |
| [Supabase](https://supabase.com) | Banco de dados, autenticação e storage |
| [Lucide React](https://lucide.dev) | Ícones |
| [Vercel](https://vercel.com) | Deploy e hospedagem |

---

## 🎨 Identidade Visual

O sistema segue a identidade visual da Callera Clinic:

- **Cores:** Branco `#FFFFFF` e Dourado `#D4AF37`
- **Tipografia:** Playfair Display (títulos) + Montserrat (corpo)
- **Design:** Elegante, minimalista e responsivo

---

## 🚀 Como Rodar Localmente

### Pré-requisitos
- Node.js 18+
- Conta no Supabase

### Instalação

```bash
# Clone o repositório
git clone https://github.com/zaynnecalleraa/Ficha-Anamnese.git
cd Ficha-Anamnese/ficha-anamnese

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o .env com suas credenciais do Supabase

# Rode o projeto
npm run dev
```

### Variáveis de Ambiente

```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anon
```

---

## 🗄️ Estrutura do Banco de Dados

| Tabela | Descrição |
|---|---|
| `patients` | Cadastro de pacientes |
| `anamnesis_forms` | Fichas de anamnese com token único |
| `sessions` | Histórico de sessões por paciente |
| `session_photos` | Fotos antes/depois por sessão |
| `procedures` | Procedimentos oferecidos pela clínica |
| `exams` | Exames anexados por paciente |

---

## 📁 Estrutura do Projeto

```
src/
├── lib/
│   └── supabase.js
├── pages/
│   ├── Login.jsx
│   ├── Dashboard.jsx
│   ├── PatientDetail.jsx
│   ├── AnamnesisForm.jsx
│   ├── PrintForm.jsx
│   └── Procedures.jsx
└── components/
    └── PrivateRoute.jsx
```

## 👨‍💻 Desenvolvimento

Projeto desenvolvido com dedicação para modernizar o atendimento da Callera Clinic.

---
