CityPulse

AI-Powered Civic Intelligence & Neighborhood Safety Platform

CityPulse is a civic intelligence platform that brings incidents, alerts, CCTV intelligence, weather, traffic, emergency reports, and neighborhood insights into a single location-aware dashboard.

🚨 Problem

Civic information is often fragmented across different sources. Citizens may need to check separate platforms for incidents, traffic, weather, emergency information, and local updates.

This makes it difficult to get a unified view of what is happening in a particular neighborhood.

💡 Solution

CityPulse provides a unified civic intelligence platform where users can select their location and view relevant civic information through an interactive, real-time dashboard.

The platform combines multiple civic services into one interface and provides location-aware insights to help users understand their surrounding environment.

✨ Key Features

🗺️ Interactive location-aware civic map

📍 Area → Mandal → District location selection

🚨 Incident reporting and tracking

📢 Local civic alerts

📹 CCTV camera integration and event architecture

🚑 Emergency reporting

📊 Neighborhood Pulse Score

🤖 AI-powered civic insights

🌦️ Weather information

🚦 Traffic information

📰 Civic news

⚡ Real-time updates using Server-Sent Events (SSE)

📱 Responsive interface

🌐 Graceful fallback when external services are unavailable

🏗️ How It Works

User
  ↓
React + TypeScript Frontend
  ↓
FastAPI Backend
  ↓
Civic Services
  ├── Incidents
  ├── Alerts
  ├── CCTV
  ├── Emergency Reports
  ├── Weather
  ├── Traffic
  ├── News
  └── Pulse Score
  ↓
Database / External APIs
  ↓
Realtime SSE Updates

🛠️ Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React, TypeScript, Vite |
| Backend | FastAPI, Python |
| Database | SQLite, SQLAlchemy |
| Maps | Leaflet |
| Validation | Pydantic |
| Realtime | Server-Sent Events |
| Testing | Pytest |
| Map Data | OpenStreetMap-compatible services |
| Weather Data | Open-Meteo |
| API Communication | REST APIs |

📁 Project Structure

CityPulse/
│
├── backend/
│   ├── app/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── utils/
│   │
│   ├── tests/
│   │   ├── test_api.py
│   │   └── test_cctv.py
│   │
│   ├── requirements.txt
│   └── seed.py
│
├── public/
│
├── src/
│   ├── components/
│   ├── context/
│   ├── services/
│   └── types/
│
├── .env.example
├── package.json
├── package-lock.json
├── vite.config.ts
└── README.md

📹 CCTV Intelligence

CityPulse provides an extensible architecture for integrating CCTV cameras and processing civic events.

CCTV Camera
     ↓
Frame / Stream Source
     ↓
Detection Layer
     ↓
CCTV Event
     ↓
Incident / Alert
     ↓
Pulse Score / Dashboard

The current MVP supports CCTV camera registration, connectivity monitoring, event handling, and an extensible detector architecture.

The detection layer can be extended with computer-vision models for additional CCTV-based event detection.

The current MVP does not claim continuous real-world computer-vision processing of every connected camera.

⚡ Realtime Architecture

CityPulse uses Server-Sent Events (SSE) to deliver realtime backend events to connected frontend clients.

Backend Event
     ↓
Realtime Publisher
     ↓
SSE Stream
     ↓
Frontend
     ↓
Dashboard Update

This architecture allows civic events such as incidents and CCTV events to be propagated to the dashboard without requiring the user to manually refresh the page.

🚨 Incident Management

CityPulse supports an incident lifecycle that allows reported incidents to move through different stages.

REPORT RECEIVED
       ↓
REPORTED
       ↓
UNDER REVIEW
       ↓
VERIFIED
       ↓
RESPONSE INITIATED
       ↓
RESOLVED

Incidents contain location and civic information that can be displayed on the map and incorporated into the platform's civic intelligence features.

📊 Neighborhood Pulse Score

The Pulse Score provides a consolidated representation of the current civic conditions of the selected location.

It can incorporate information such as:

Incidents

Alerts

Traffic conditions

Environmental information

CCTV events

Other available civic signals

The score is designed as a dashboard-level civic indicator rather than a replacement for official emergency or public-safety information.

🤖 Civic Intelligence

CityPulse provides an intelligence layer that processes available civic information and generates contextual insights for the selected location.

The architecture is designed so additional analytics, anomaly detection, and AI models can be integrated without changing the core frontend.

🗺️ Location & Maps

CityPulse uses an interactive Leaflet-based map to display location-aware civic information.

The platform supports hierarchical location selection and map-based visualization of relevant civic data.

Map functionality is designed to degrade gracefully if external services are temporarily unavailable.

🌦️ Weather & 🚦 Traffic

CityPulse integrates external services to provide additional context about the selected location.

Weather information can be used alongside civic events to provide broader neighborhood context.

Traffic information can be incorporated into the location's overall civic condition and dashboard insights.

🚀 Installation

Prerequisites

Make sure you have:

Python

Node.js

npm

Git

1. Clone the Repository

git clone https://github.com/abhinay-ds/CityPulse.git
cd CityPulse

2. Backend Setup

cd backend

Create a virtual environment:

python -m venv venv

Windows

venv\Scripts\activate

Install dependencies:

pip install -r requirements.txt

Start the backend:

uvicorn app.main:app --reload

The backend will run at:

https://citypulse-hack.onrender.com
3. Frontend Setup

Open a new terminal and return to the project root:

cd ..

Install dependencies:

npm install

Start the development server:

npm run dev

The frontend will normally be available at:

city-pulse-gamma-bay.vercel.app

📖 API Documentation

Once the backend is running, FastAPI automatically provides interactive API documentation.

Swagger UI

http://127.0.0.1:8000/docs

OpenAPI Specification

http://127.0.0.1:8000/openapi.json

🔐 Environment Variables

Example environment files are included in the repository:

.env.example
backend/.env.example

Create your local environment files as required by the configured services.

Never commit real API keys or secrets.

The following files should remain local:

.env
backend/.env

🧪 Testing

Backend tests are implemented using Pytest.

From the backend directory:

cd backend
python -m pytest -q

🏗️ Frontend Production Build

To verify the frontend production build:

npm run build

🔌 API Areas

The backend provides APIs for major CityPulse services, including:
| Service | Purpose |
|---|---|
| Incidents | Create, retrieve and update civic incidents |
| Alerts | Civic alerts and notifications |
| CCTV | Camera and CCTV event management |
| Emergency | Emergency reports |
| News | Civic news |
| Pulse | Neighborhood Pulse Score |
| Weather | Weather information |
| Traffic | Traffic information |
| Location | Location and geographic services |
| Stream | Realtime SSE events |

📸 Screenshots

Screenshots of the following interfaces can be added here:

Dashboard

Interactive Civic Map

Incident Reporting

CCTV Intelligence

Pulse Score

Alerts

Emergency Reporting

Weather and Traffic

⚠️ Limitations

The current MVP does not provide continuous real-world computer-vision processing for every CCTV stream.

External API availability can affect some live data features.

The current SQLite configuration is intended for development and MVP usage.

Some features may use fallback/demo data when external services are unavailable.

Production deployment would require additional infrastructure, security, monitoring, and scalability considerations.

🔮 Future Scope

Potential future improvements include:

Advanced computer-vision models

More real-time civic data sources

Predictive civic analytics

Advanced anomaly detection

Production-grade database infrastructure

Mobile application

Expanded smart-city integrations

More sophisticated routing and mobility intelligence

Additional civic data integrations

🌐 Deployment

Live Demo

Add the deployed frontend URL here after deployment.

Backend API

Add the deployed backend URL here after deployment.

API Documentation

Add the deployed Swagger/API documentation URL here after deployment.

👥 Team

CityPulse — Hackathon Project

📄 License

This project was developed as a hackathon project.

### Production frontend/backend connection

The frontend uses `VITE_API_BASE_URL` when provided. A production fallback is also configured for the deployed CityPulse Render API (`https://citypulse-1-ewb2.onrender.com`), while localhost development continues to use `http://127.0.0.1:8000`. The Render CORS configuration includes the current Vercel frontend origin (`https://citypulse-rouge.vercel.app`).
