require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const itemRoutes = require('./routes/items');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS
app.use(cors());

// Parse JSON and UrlEncoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure upload directory exists and serve it statically
const uploadsPath = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}
app.use('/uploads', express.static(uploadsPath));

// Mount API routes
app.use('/api/items', itemRoutes);

// Simple API Healthcheck route
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'CampusReclaim API Server is running' });
});

// Database connection
const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campusreclaim';
mongoose.connect(mongoUri)
  .then(() => {
    console.log('✅ Connected to MongoDB Database successfully.');
    app.listen(PORT, () => {
      console.log(`🚀 CampusReclaim Backend Server running at http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('❌ MongoDB Connection Error:', error);
    process.exit(1);
  });
