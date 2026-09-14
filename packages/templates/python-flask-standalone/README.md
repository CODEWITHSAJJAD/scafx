# {{projectName}}

Flask REST API service scaffolded by scafx.

## Features

- Flask 3.x with Application Factory Pattern (`create_app()`)
- Modular Blueprints (`/api` and `/health`)
- CORS support via `flask-cors`
- Environment configuration via `python-dotenv`

## Getting Started

### Prerequisites

- Python >= 3.10
- pip or uv/poetry

### Installation

```bash
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
```

### Development

```bash
python -m src.app.main
# or
flask --app src.app.main run --port 5000 --debug
```
