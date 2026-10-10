# 🛡️ IncidentIQ

![IncidentIQ Dashboard Preview](public/icon-dark-32x32.png) <!-- Replace with a real screenshot once deployed -->

> **High-throughput, ML-powered security incident triage and prioritization platform.**

IncidentIQ automatically ingests, analyzes, and prioritizes security logs so Security Operations Center (SOC) teams can focus on critical threats rather than drowning in alerts. Using an advanced Max-Heap priority queue combined with real-time ML anomaly scoring (DBSCAN & TF-IDF), it instantly bubbles up the most dangerous incidents.

---

## ⚡ Key Features

- **Real-time Threat Detection**: Processes thousands of logs per second using an asynchronous FastAPI backend.
- **ML Anomaly Scoring**: Leverages TF-IDF vectorization and DBSCAN clustering (with TruncatedSVD for dimensionality reduction) to identify structural anomalies in log data.
- **Max-Heap Priority Queue**: Ensures $O(\log n)$ insertion and extraction, keeping the highest-risk incidents at the very top of the queue.
- **Rule-based Boosting**: Automatically boosts priority scores for known attack vectors like SQLi, XSS, and RCE.
- **Interactive SOC Console**: A rich Next.js frontend featuring 2D cluster scatter plots, real-time metrics, and a dynamic incident table.

---

## 🏗️ Architecture & Tech Stack

**Frontend:**
- [Next.js 16](https://nextjs.org/) (App Router)
- [React](https://react.dev/) & [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/) & [Framer Motion](https://www.framer.com/motion/) (Animations)
- [Recharts](https://recharts.org/) & [Lucide Icons](https://lucide.dev/)

**Backend:**
- [FastAPI](https://fastapi.tiangolo.com/) (Async Python API)
- [Scikit-learn](https://scikit-learn.org/) (ML Models)
- Uvicorn (ASGI Server)

---

## 🚀 Getting Started

Follow these steps to run the platform locally. You will need to start both the Python backend and the Next.js frontend.

### Prerequisites
- **Node.js** (v18+)
- **Python** (v3.9+)

### 1. Start the Backend (ML Engine & API)

Open a terminal and navigate to the backend directory:

```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate | Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
python run.py
```
The FastAPI server will start on `http://localhost:8000`. 
*Note: You can view the interactive API docs at `http://localhost:8000/docs`.*

### 2. Start the Frontend (Next.js Dashboard)

Open a **new terminal** and navigate to the project root:

```bash
npm install
npm run dev
```
The Next.js application will start on `http://localhost:3000`. 

### 3. Run a Simulation
1. Navigate to [http://localhost:3000/dashboard](http://localhost:3000/dashboard).
2. Click **Start Attack Simulation** in the top right corner.
3. Watch as the ML engine detects anomalies, scores incidents, and organizes them in real-time!

---

## 📂 Project Structure

```text
IncidentIQ/
├── app/                  # Next.js App Router (Pages, Layouts)
├── backend/              # FastAPI Python Backend
│   ├── api/              # API Routes and Models
│   ├── data/             # Log Generation & Simulation scripts
│   ├── heap/             # Max-Heap Implementation
│   ├── ml/               # Scikit-learn Pipeline & DBSCAN Clusterer
│   └── run.py            # Uvicorn entry point
├── components/           # Reusable React UI Components (Bento grid, Charts)
├── hooks/                # Custom React Hooks
├── lib/                  # Utility functions (API client, class merging)
└── public/               # Static assets & icons
```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
