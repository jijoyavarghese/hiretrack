# 🟠 HireTrack — Candidate Database

A mobile-friendly recruitment tracker with AI-powered CV parsing.  
Built with **React + Vite**, **Supabase** (Postgres), and **Anthropic Claude** for CV parsing.

---

## ✅ Prerequisites

- [Node.js](https://nodejs.org) v18 or higher
- A free [Supabase](https://supabase.com) account
- An [Anthropic](https://console.anthropic.com) API key (for CV parsing)

---

## 🚀 Setup in 5 Steps

### Step 1 — Install dependencies

```bash
npm install
```

### Step 2 — Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → **New Project**
2. Choose a name and region (pick one close to India, e.g. `ap-south-1`)
3. Once created, go to **Settings → API** and copy:
   - **Project URL** (looks like `https://abcxyz.supabase.co`)
   - **anon public** key

### Step 3 — Run the database migration

1. In your Supabase project, go to **SQL Editor → New Query**
2. Open `supabase/migration.sql` from this project
3. Paste the entire contents and click **Run**

This creates the `candidates` and `positions` tables with proper indexes.

### Step 4 — Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and fill in your values:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
VITE_ANTHROPIC_API_KEY=sk-ant-your-anthropic-key
```

Get your Anthropic API key at [console.anthropic.com](https://console.anthropic.com) → API Keys.

### Step 5 — Run the app

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🌐 Deploying to Vercel (free)

1. Push this project to a GitHub repository
2. Go to [vercel.com](https://vercel.com) → **New Project** → Import your repo
3. Add environment variables in Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_ANTHROPIC_API_KEY`
4. Click **Deploy** — done! You'll get a URL like `hiretrack.vercel.app`

## 🌐 Deploying to Netlify (free)

```bash
npm run build
```

Drag and drop the `dist/` folder at [netlify.com/drop](https://app.netlify.com/drop).  
Or connect your GitHub repo and add the same env vars in **Site Settings → Environment Variables**.

---

## 📱 Mobile Access

Once deployed, open the Vercel/Netlify URL on your phone.  
To add it to your home screen:
- **iPhone**: Safari → Share → "Add to Home Screen"
- **Android**: Chrome → Menu → "Add to Home Screen"

---

## ✨ Features

- **AI CV Parsing** — Upload a CV and Claude auto-fills name, email, phone, location, experience, CTC, skills, and notice period
- **Candidate profiles** — Full details across 5 tabs: CV, Basic Info, Professional, Interview, Notes
- **Status pipeline** — Screening → Interview Scheduled → Interview Done → Offer Extended → Hired / Rejected
- **Source tracking** — Naukri India, Indeed India, LinkedIn, Referral, Other
- **Star ratings & feedback** — Per-interview rating and written feedback
- **Search & filters** — Filter by status, position, source; full-text search
- **Real-time data** — Supabase Postgres, accessible from any device
- **Mobile-first design** — Works great on phone, tablet, and desktop

---

## 🗃 Database Schema

```sql
candidates (
  id, name, email, phone, position, source, status,
  experience, current_ctc, expected_ctc, notice_period,
  location, skills, resume_text, resume_file_name,
  feedback, rating, interview_date, interviewer_name,
  notes, applied_date, created_at, updated_at
)

positions (name, created_at)
```

---

## 🔒 Security Notes

- The `.env` file is gitignored — never commit it
- Supabase anon key is safe to use in the browser (it's public by design)
- Row Level Security (RLS) is enabled on both tables
- For team use with login, upgrade the RLS policies to use `auth.uid()`
- The Anthropic API key is used client-side — for production, proxy it through a backend function

---

## 🛠 Tech Stack

| Layer     | Technology              |
|-----------|-------------------------|
| Frontend  | React 18 + Vite         |
| Database  | Supabase (Postgres)     |
| AI        | Anthropic Claude Sonnet |
| Hosting   | Vercel / Netlify (free) |
