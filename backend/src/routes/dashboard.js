const express = require('express');
const { prepare } = require('../database');
const { authenticate, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Get dashboard statistics
router.get('/stats', authenticate, authorizeRoles('admin', 'technician'), (req, res) => {
  const total = prepare('SELECT COUNT(*) as count FROM repair_requests').get().count;
  const pending = prepare("SELECT COUNT(*) as count FROM repair_requests WHERE status = 'pending'").get().count;
  const inProgress = prepare("SELECT COUNT(*) as count FROM repair_requests WHERE status = 'in_progress'").get().count;
  const completed = prepare("SELECT COUNT(*) as count FROM repair_requests WHERE status = 'completed'").get().count;
  const cancelled = prepare("SELECT COUNT(*) as count FROM repair_requests WHERE status = 'cancelled'").get().count;

  // By category
  const byCategory = prepare(`
    SELECT category, COUNT(*) as count 
    FROM repair_requests 
    GROUP BY category 
    ORDER BY count DESC
  `).all();

  // By priority
  const byPriority = prepare(`
    SELECT priority, COUNT(*) as count 
    FROM repair_requests 
    GROUP BY priority
  `).all();

  // Recent requests
  const recent = prepare(`
    SELECT r.*, u.full_name as requester_name
    FROM repair_requests r
    LEFT JOIN users u ON r.requester_id = u.id
    ORDER BY r.created_at DESC
    LIMIT 5
  `).all();

  res.json({
    total,
    pending,
    inProgress,
    completed,
    cancelled,
    byCategory,
    byPriority,
    recent,
  });
});

// Get technicians list
router.get('/technicians', authenticate, authorizeRoles('admin'), (req, res) => {
  const technicians = prepare(`
    SELECT id, full_name, department, phone 
    FROM users 
    WHERE role IN ('technician', 'admin')
  `).all();
  res.json(technicians);
});

module.exports = router;
