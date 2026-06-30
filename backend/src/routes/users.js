const express = require('express');
const bcrypt = require('bcryptjs');
const { prepare } = require('../database');
const { authenticate, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Get all users (admin only)
router.get('/', authenticate, authorizeRoles('admin'), (req, res) => {
  const users = prepare(`
    SELECT id, username, full_name, department, role, phone, email, created_at 
    FROM users 
    ORDER BY username ASC
  `).all();
  res.json(users);
});

// Create new user (admin only)
router.post('/', authenticate, authorizeRoles('admin'), (req, res) => {
  const { username, password, full_name, department, role, phone, email } = req.body;

  if (!username || !password || !full_name || !department || !role) {
    return res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
  }

  const existing = prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) {
    return res.status(400).json({ error: 'ชื่อผู้ใช้นี้มีอยู่แล้ว' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const result = prepare(`
    INSERT INTO users (username, password, full_name, department, role, phone, email)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(username, hashedPassword, full_name, department, role, phone || null, email || null);

  res.status(201).json({ id: result.lastInsertRowid, message: 'เพิ่มพนักงานสำเร็จ' });
});

// Update user (admin only)
router.put('/:id', authenticate, authorizeRoles('admin'), (req, res) => {
  const { full_name, department, role, phone, password, email } = req.body;

  if (!full_name || !department || !role) {
    return res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
  }

  if (password) {
    const hashedPassword = bcrypt.hashSync(password, 10);
    prepare(`
      UPDATE users SET full_name = ?, department = ?, role = ?, phone = ?, email = ?, password = ?
      WHERE id = ?
    `).run(full_name, department, role, phone || null, email || null, hashedPassword, parseInt(req.params.id));
  } else {
    prepare(`
      UPDATE users SET full_name = ?, department = ?, role = ?, phone = ?, email = ?
      WHERE id = ?
    `).run(full_name, department, role, phone || null, email || null, parseInt(req.params.id));
  }

  res.json({ message: 'อัพเดทข้อมูลสำเร็จ' });
});

// Delete user (admin only)
router.delete('/:id', authenticate, authorizeRoles('admin'), (req, res) => {
  const userId = parseInt(req.params.id);
  if (userId === req.user.id) {
    return res.status(400).json({ error: 'ไม่สามารถลบตัวเองได้' });
  }
  prepare('DELETE FROM users WHERE id = ?').run(userId);
  res.json({ message: 'ลบพนักงานสำเร็จ' });
});

module.exports = router;
