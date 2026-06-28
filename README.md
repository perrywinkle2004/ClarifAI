<div align="center">
# 🎓 ClarifAI
### Your Personal AI Learning Companion
 
**Upload • Learn • Master**
 
Turn your own notes, textbooks, and slides into a private AI tutor — powered entirely by free, local, open-source AI. No OpenAI key. No Pinecone bill. No data leaving your machine.
 
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Ollama](https://img.shields.io/badge/LLM-Ollama-black?logo=ollama&logoColor=white)](https://ollama.com/)
[![ChromaDB](https://img.shields.io/badge/VectorDB-ChromaDB-FF6B6B)](https://www.trychroma.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
 
</div>
---
 
## 📖 Overview
 
Most "AI tutoring" tools either hallucinate answers or require an OpenAI API key and a credit card. **ClarifAI** does neither.
 
Upload a PDF, DOCX, or TXT file, and ClarifAI builds a **Retrieval-Augmented Generation (RAG)** pipeline around *only* that material. Ask it anything — it answers strictly from your own documents, cites the page it pulled from, and tells you plainly when something **isn't** in your material instead of making it up.
 
Everything runs on free, local infrastructure:
 
| Instead of...        | ClarifAI uses...                                  |
|-----------------------|----------------------------------------------------|
| OpenAI Embeddings     | 🤗 HuggingFace `sentence-transformers` (local)     |
| OpenAI LLM (GPT-4)    | 🦙 Ollama (local LLM, e.g. Llama 3.1)              |
| Pinecone              | 🗄️ ChromaDB (local, persistent, on-disk)          |
 
**No API keys. No usage costs. Runs entirely on your own machine.**
 
---
 
## ✨ Features
 
### 🧑‍🎓 Student
- Upload notes (PDF / DOCX / TXT) and track processing status
- Chat with an AI tutor that's strictly grounded in your material, with **streaming responses**, **Markdown + syntax highlighting**, and **page-level citations**
- Full conversation history, search, and export
- Auto-generated **adaptive quizzes** with instant grading + explanations
- Auto-generated **flashcards** with spaced-repetition style mastery tracking
- Topic summaries on demand
- Personal **learning progress** dashboard: mastery scores, streaks, recent activity
### 🛠️ Admin
- Upload syllabus / reference material visible across the platform
- Manage and delete any document
- **Rebuild the vector database** on demand (e.g. after changing the embedding model)
- Analytics dashboard: most-searched topics, average response time, question volume, grounded-answer rate
- System logs viewer
- User management
### 🤖 AI / RAG Pipeline
- Page-aware chunking with overlap for better retrieval
- Cosine-similarity semantic search with a configurable relevance threshold
- **Strict grounding** — if retrieved context doesn't clear the relevance bar, ClarifAI says so instead of guessing
- Conversation memory passed back into the LLM for natural follow-ups
- Structured JSON generation (with validation) for quizzes and flashcards
---
 
## 🏗️ Tech Stack
 
**Backend** — Python · FastAPI · Pydantic · SQLAlchemy · SQLite · LangChain · ChromaDB · HuggingFace `sentence-transformers` · Ollama · PyPDF · python-docx
 
**Frontend** — React 19 · TypeScript · Vite · TailwindCSS · shadcn/ui · Framer Motion · React Router · React Query · React Hook Form · Zod · Recharts
 
**Demo** — Streamlit
 
**Infra** — Docker · docker-compose · Vercel (frontend) · Render (backend) · Streamlit Community Cloud (demo)
 
---
 
## 📂 Project Structure
 
```
ClarifAI/
├── backend/                  # FastAPI application
│   ├── app/
│   │   ├── api/routes/       # auth, documents, chat, quizzes, flashcards, analytics, admin
│   │   ├── core/             # config, logging, security (JWT/bcrypt)
│   │   ├── db/                # SQLAlchemy models + session
│   │   ├── schemas/          # Pydantic request/response models
│   │   ├── services/         # RAG pipeline, embeddings, vectorstore, LLM, quiz/flashcard gen
│   │   └── main.py
│   ├── data/                 # uploads/ + chroma_db/ (gitignored)
│   ├── requirements.txt
│   └── .env.example
├── frontend/                  # React + TypeScript + Vite SPA
├── streamlit_app/             # Streamlit demo client
├── docker-compose.yml
├── README.md
└── .gitignore
```
 
---
 
## 🚀 Getting Started
 
### Prerequisites
- Python 3.11+
- Node.js 18+
- [Ollama](https://ollama.com/) installed locally
### 1. Pull a local model
```bash
ollama pull llama3.1
ollama serve
```
 
### 2. Backend setup
```bash
cd backend
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
API docs available at **http://localhost:8000/docs**
 
### 3. Frontend setup
```bash
cd frontend
npm install
npm run dev
```
App available at **http://localhost:5173**
 
### 4. (Optional) Streamlit demo
```bash
cd streamlit_app
pip install -r requirements.txt
streamlit run app.py
```
 
### One-command alternative: Docker Compose
```bash
docker-compose up --build
```
 
---
 
## 🔑 Environment Variables
 
See [`backend/.env.example`](backend/.env.example) for the full list. Nothing here requires a paid API key — `OLLAMA_BASE_URL` and `EMBEDDING_MODEL_NAME` point at fully local resources.
 
---
 
## 🗺️ Roadmap / Status
 
- [x] Backend architecture (FastAPI, auth, RAG pipeline, quiz/flashcard generation, analytics)
- [ ] React frontend (14 pages)
- [ ] Streamlit demo app
- [ ] Docker + deployment configs
- [ ] CI/CD
---
 
## 📜 License
 
MIT — see [LICENSE](LICENSE) for details.
 
---
 
<div align="center">
Built as part of an exploration into local-first, zero-cost AI tutoring systems.
</div>
 
