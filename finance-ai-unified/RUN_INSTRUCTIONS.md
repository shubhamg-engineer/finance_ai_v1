# How to Run Finance AI Unified

This project consists of a **FastAPI backend** and a **Vite/React frontend**. You need to run both to get the full application working.

## 1. Run the Backend

1. Navigate to the `backend` directory:
   ```bash
   cd "finance-ai-unified/backend"
   ```
2. Install dependencies (if you haven't already):
   ```bash
   pip install -r requirements.txt
   ```
3. Start the FastAPI server:
   ```bash
   python chief_ai.py
   ```
   > The backend server will start on `http://127.0.0.1:8000`.

## 2. Run the Frontend

1. Navigate to the `frontend` directory in a new terminal:
   ```bash
   cd "finance-ai-unified/frontend"
   ```
2. Install dependencies (if you haven't already):
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   > The frontend server will typically be available at `http://localhost:5173`.

---

**For LLMs / AI Agents:**
To run the code, simply execute the following commands in parallel (e.g., as background tasks):
1. `python chief_ai.py` (working directory: `finance-ai-unified/backend`)
2. `npm run dev` (working directory: `finance-ai-unified/frontend`)
