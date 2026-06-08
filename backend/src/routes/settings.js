const express = require('express');
const fs = require('fs');
const path = require('path');
const { authenticate, authorizeRoles } = require('../middleware/auth');

const router = express.Router();
const settingsPath = path.resolve(__dirname, '../../settings.json');

function getSettings() {
  if (fs.existsSync(settingsPath)) {
    return JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
  }
  return { companyName: 'บริษัท ตัวอย่าง จำกัด', logo: null, emailEnabled: false, smtpHost: 'smtp.office365.com', smtpPort: '587', smtpUser: '', smtpPass: '', smtpFrom: '', categories: ['ไฟฟ้า/แอร์', 'ประปา', 'IT/คอมพิวเตอร์', 'อาคาร/สถานที่', 'อื่นๆ'] };
}

function saveSettings(data) {
  fs.writeFileSync(settingsPath, JSON.stringify(data, null, 2), 'utf8');
}

// Get settings
router.get('/', authenticate, (req, res) => {
  res.json(getSettings());
});

// Update settings (admin only)
router.put('/', authenticate, authorizeRoles('admin'), (req, res) => {
  const { companyName, logo, emailEnabled, smtpHost, smtpPort, smtpUser, smtpPass, smtpFrom, categories } = req.body;
  const current = getSettings();
  const updated = {
    ...current,
    companyName: companyName !== undefined ? companyName : current.companyName,
    logo: logo !== undefined ? logo : current.logo,
    emailEnabled: emailEnabled !== undefined ? emailEnabled : current.emailEnabled,
    smtpHost: smtpHost !== undefined ? smtpHost : current.smtpHost,
    smtpPort: smtpPort !== undefined ? smtpPort : current.smtpPort,
    smtpUser: smtpUser !== undefined ? smtpUser : current.smtpUser,
    smtpPass: smtpPass !== undefined ? smtpPass : current.smtpPass,
    smtpFrom: smtpFrom !== undefined ? smtpFrom : current.smtpFrom,
    categories: categories !== undefined ? categories : current.categories,
  };
  saveSettings(updated);

  // Update environment variables for email service
  process.env.EMAIL_ENABLED = updated.emailEnabled ? 'true' : 'false';
  process.env.SMTP_HOST = updated.smtpHost || 'smtp.office365.com';
  process.env.SMTP_PORT = updated.smtpPort || '587';
  process.env.SMTP_USER = updated.smtpUser || '';
  process.env.SMTP_PASS = updated.smtpPass || '';
  process.env.SMTP_FROM = updated.smtpFrom || '';

  res.json({ message: 'บันทึกการตั้งค่าสำเร็จ', settings: { ...updated, smtpPass: updated.smtpPass ? '****' : '' } });
});

module.exports = router;
