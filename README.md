# COGNIS PROTON - Hackathon Project

## Project Structure

```
COGNIS_PROTON/
├── backend/          # Node.js + Express backend
├── frontend/         # Next.js frontend
└── openclaw-skill/   # OpenClaw skill modules
```

## Setup Instructions

### Backend Setup

1. Navigate to backend directory:
```bash
cd COGNIS_PROTON/backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables in `.env`:
   - PORT
   - MONGO_URI
   - ALPACA_API_KEY
   - ALPACA_SECRET_KEY

4. Run development server:
```bash
npm run dev
```

Backend will run on http://localhost:5000

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd COGNIS_PROTON/frontend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables in `.env.local`:
   - NEXT_PUBLIC_BACKEND_URL

4. Run development server:
```bash
npm run dev
```

Frontend will run on http://localhost:3000

## API Endpoints

- `GET /` - API welcome message
- `GET /health` - Health check endpoint

## Development

Both servers support hot-reload during development.
