# {{projectName}}

Django REST API service scaffolded by scafx.

## Features

- Django 5.x with modular project architecture
- CORS headers configured via `django-cors-headers`
- Environment configuration via `python-dotenv`
- Health check endpoint (`/health`) and API greeting (`/api`)

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
python manage.py migrate
python manage.py runserver 8000
```
