\
# RimbaQuest — run backend (FastAPI) and mobile (Expo) with one command.
#
# Usage:
#   make install   Install backend + frontend dependencies
#   make backend   Run the FastAPI backend in this terminal (blocking)
#   make frontend  Run the Expo dev server in this terminal (blocking)
#   make dev       Open backend + Expo each in their own terminal window
#   make stop      Kill anything listening on the backend/Expo ports
#
# Notes:
# - `backend` is bound to 0.0.0.0 so a phone on the same Wi-Fi can reach it.
# - `backend` loads backend/.env explicitly via --env-file (nothing in the
#   app calls load_dotenv(), so without this flag backend/.env is ignored).
# - rimbaquest/.env must point EXPO_PUBLIC_API_BASE_URL at this computer's
#   current LAN IP (ipconfig) on port 8000 for a physical phone to connect.

.PHONY: help install install-backend install-frontend backend frontend dev stop

help:
	@echo make install   - install backend + frontend dependencies
	@echo make backend   - run FastAPI backend (blocking, this terminal)
	@echo make frontend  - run Expo dev server (blocking, this terminal)
	@echo make dev       - launch backend + Expo each in a new terminal window
	@echo make stop      - stop anything listening on ports 8000/8081

install: install-backend install-frontend

install-backend:
	cd backend && python -m pip install -r requirements.txt

install-frontend:
	cd rimbaquest && npm install

backend:
	cd backend && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload --env-file .env

frontend:
	cd rimbaquest && npx expo start

dev:
	powershell -NoProfile -Command "Start-Process cmd -ArgumentList '/k','python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload --env-file .env' -WorkingDirectory 'backend'"
	powershell -NoProfile -Command "Start-Process cmd -ArgumentList '/k','npx expo start' -WorkingDirectory 'rimbaquest'"

stop:
	powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 8000,8081 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $$_.OwningProcess -Force -ErrorAction SilentlyContinue }; Write-Host 'Stopped anything on 8000/8081.'"
