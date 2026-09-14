# {{projectName}}

FastAPI application scaffolded with **scafx**.

- **Stack:** {{stack}}
- **Framework:** {{framework}}
- **App Shape:** {{appShape}}
- **Architecture:** {{architecture}}
- **Database:** {{database}}

## Getting Started

### 1. Create a virtual environment

```bash
python -m venv .venv
# On Windows
.venv\Scripts\activate
# On macOS / Linux
source .venv/bin/activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
pip install -r requirements-dev.txt
```

### 3. Run the development server

```bash
uvicorn app.main:app --reload --port 8000
```

### 4. Interactive API Documentation

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## API Endpoints

- `GET /health` - Health check status
- `GET /api` - Welcome API endpoint
