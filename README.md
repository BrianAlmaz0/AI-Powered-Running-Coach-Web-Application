## 🏃‍♂️ AI-Powered Running Coach (MVP)

**What it is:** A web app that turns your Strava logs into a **personalized, adaptive training plan** using AI.  
**Tagline:** *“Strava + AI coach in your pocket.”*

---

### ✨ Core Features (MVP)
- 🔗 **Strava Sync:** Import runs via Strava API OAuth.
- 🤖 **AI Coaching:** Generate and adapt training plans (OpenAI API).
- 📊 **Dashboard:** Upcoming workouts, progress, and simple insights.
- ⚡ **Fast & Secure:** <200ms API responses; JWT auth.

---

### 🛠️ Tech Stack
- **Frontend:** React (Vite + TypeScript), shadcn/ui, Tailwind CSS (this repo)
- **Backend:** Python, Django, Django ORM, PostgreSQL, JWT auth
- **AI:** OpenAI API
- **Integrations:** Strava API
- **Deploy:** Frontend (Lovable Publish), Backend (Render)