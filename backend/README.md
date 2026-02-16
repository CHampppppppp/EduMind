# EduMind Backend

## Setup

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Run the server:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

## API Documentation

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Endpoints

- `GET /api/v1/knowledge`
- `POST /api/v1/knowledge/upload`
- `POST /api/v1/chat`
- `GET /api/v1/analysis/latest`
- `GET /api/v1/analysis/{id}`
- `POST /api/v1/generate`
