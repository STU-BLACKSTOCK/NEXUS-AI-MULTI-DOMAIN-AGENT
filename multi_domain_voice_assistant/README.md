# NexusAI Multi-Domain Backend

FastAPI backend powering NexusAI's specialized autonomous domain pipelines: **Finance, Cooking, Education, Healthcare**, and **Integrated Routing**.

---

## 🏛️ Architecture & Pipelines

Each assistant domain is powered by a dedicated execution engine:

1. **Finance Assistant (`app/assistants/finance/`)**:
   - Pure Python arithmetic engine (`finance_engine.py`): Savings rates, 50/30/20 budget breakdown, emergency fund runways, future value compound growth, and amortization schedules.
   - 2-Stage LLM pipeline (parameter extraction $\rightarrow$ Python arithmetic $\rightarrow$ qualitative synthesis).

2. **Cooking Assistant (`app/assistants/cooking/`)**:
   - 100+ ingredient USDA-calibrated nutrition database (`nutrition_db.py`).
   - Pure Python macronutrient computation & unit conversion (`cooking_engine.py`).
   - Substitution matrix lookup attaching verified alternatives.

3. **Education Assistant (`app/assistants/education/`)**:
   - User mastery tracking stored in MongoDB (`mastery_service.py`).
   - Dynamic prompt calibration adjusting depth (`beginner`, `intermediate`, `advanced`).
   - Structured Mermaid diagram & quiz question schema generation.

4. **Healthcare Assistant (`app/assistants/healthcare/`)**:
   - Deterministic regex red-flag engine (`safety_rules.py`) covering cardiac, stroke FAST, anaphylaxis, respiratory distress, and pediatric infant fevers.
   - Pre- and post-LLM safety gating enforcing unoverridable emergency warning banners and hotlines.

---

## 🔧 Environment Configuration

Create a `.env` file inside `multi_domain_voice_assistant/`:

```env
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.1-8b-instant

MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=nexusai

JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_SECONDS=604800
```

---

## 🚀 Running the Server

```bash
# Install dependencies
pip install -r requirements.txt

# Start FastAPI server
python run.py
```

Server runs at `http://localhost:8000`.

---

## 📡 API Endpoints

### Core Chat & TTS
- `POST /chat` — Send message and receive structured domain response.
- `POST /chat/stream` — Stream response tokens via NDJSON.
- `GET /tts` — Stream synthesized Edge TTS MP3 voice audio.
- `POST /clear` — Clear current chat session in MongoDB.
- `GET /health` — Health check reporting Groq and system status.

### Authentication & Profiles
- `POST /auth/register` — Register user with education level, age, and password hashing (`bcrypt`).
- `POST /auth/login` — Authenticate and receive JWT bearer token.
- `GET /auth/me` — Retrieve current authenticated profile.

### Education Mastery
- `POST /education/quiz-submit` — Record quiz results and update mastery stats.
- `GET /education/mastery` — Query mastery score on a specific topic.

---

## 🧪 Testing

Run all 27 unit and integration tests:
```bash
pytest tests/ -v
```
