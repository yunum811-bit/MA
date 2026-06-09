const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { getDb } = require('./database');

async function startServer() {
  // Initialize database first
  await getDb();

  // Load settings into environment
  const fs = require('fs');
  const settingsPath = path.resolve(__dirname, '../settings.json');
  if (fs.existsSync(settingsPath)) {
    try {
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      process.env.EMAIL_ENABLED = settings.emailEnabled ? 'true' : 'false';
      process.env.AZURE_TENANT_ID = settings.azureTenantId || '';
      process.env.AZURE_CLIENT_ID = settings.azureClientId || '';
      process.env.AZURE_CLIENT_SECRET = settings.azureClientSecret || '';
      process.env.SMTP_FROM = settings.smtpFrom || '';
      console.log(`📧 Email: ${settings.emailEnabled ? 'ENABLED' : 'DISABLED'}`);
    } catch (e) {
      console.log('📧 Email: DISABLED (settings error)');
    }
  }

  const authRoutes = require('./routes/auth');
  const requestRoutes = require('./routes/requests');
  const dashboardRoutes = require('./routes/dashboard');
  const usersRoutes = require('./routes/users');
  const settingsRoutes = require('./routes/settings');

  const app = express();
  const PORT = process.env.PORT || 3002;

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: '50mb' }));

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/requests', requestRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/users', usersRoutes);
  app.use('/api/settings', settingsRoutes);

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'ระบบแจ้งซ่อมทำงานปกติ' });
  });

  // Serve uploaded images
  const uploadsPath = path.resolve(__dirname, '../uploads');
  app.use('/uploads', express.static(uploadsPath));

  // Serve frontend (production)
  const frontendPath = path.resolve(__dirname, '../../frontend/dist');
  app.use(express.static(frontendPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`🌐 เข้าใช้งานจากเครื่องอื่น: http://<IP>:${PORT}`);
  });
}

startServer().catch(console.error);
