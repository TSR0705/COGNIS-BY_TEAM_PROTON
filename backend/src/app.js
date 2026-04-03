require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cognis';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✓ Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err.message));

// Routes
const processRouter = require('./routes/process');

app.get('/', (req, res) => {
  res.json({ 
    message: 'COGNIS PROTON Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      process: '/api/process'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// API Routes
app.use('/api', processRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
