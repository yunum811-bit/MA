const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { getDb } = require('./database');

async function startServer() {
  // Initialize database first
  await getDb();

  const authRoutes = require('./routes/auth');
  const requestRoutes = require('./routes/requests');
  const dashboardRoutes = require('./routes/dashboard');
  const usersRoutes = require('./routes/users');
  const settingsRoutes = require('./routes/settings');

  const app = express();
  const PORT = process.env.PORT || 3001;

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));

  // Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/requests', requestRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/users', usersRoutes);
  app.use('/api/settings', settingsRoutes);

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'ระบบแจ้งซ่อมทำงานปกติ' });
  });

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);
