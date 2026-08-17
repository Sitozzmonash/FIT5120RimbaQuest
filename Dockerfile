# Render builds from the repository root, so this Dockerfile is also usable
# when creating a Docker web service manually in the Render dashboard.
FROM python:3.12-slim

WORKDIR /app

COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./
RUN mkdir -p /var/data

ENV DATABASE_URL=sqlite:////var/data/RimbaQuest.db
EXPOSE 8000
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
