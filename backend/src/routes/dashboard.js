const express = require('express');
const { prepare } = require('../database');
const { authenticate, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Get dashboard statistics
router.get('/stats', authenticate, authorizeRoles('admin', 'technician'), (req, res) => {
  const { month } = req.query; // format: "2026-06" (optional)
  
  let dateFilter = '';
  let dateParams = [];
  if (month) {
    dateFilter = "WHERE r.created_at LIKE ?";
    dateParams = [`${month}%`];
  }

  const totalQ = month 
    ? prepare(`SELECT COUNT(*) as count FROM repair_requests r ${dateFilter}`).get(...dateParams).count
    : prepare('SELECT COUNT(*) as count FROM repair_requests').get().count;
  const pendingQ = month
    ? prepare(`SELECT COUNT(*) as count FROM repair_requests r ${dateFilter} AND status = 'pending'`).get(...dateParams).count
    : prepare("SELECT COUNT(*) as count FROM repair_requests WHERE status = 'pending'").get().count;
  const inProgressQ = month
    ? prepare(`SELECT COUNT(*) as count FROM repair_requests r ${dateFilter} AND status = 'in_progress'`).get(...dateParams).count
    : prepare("SELECT COUNT(*) as count FROM repair_requests WHERE status = 'in_progress'").get().count;
  const completedQ = month
    ? prepare(`SELECT COUNT(*) as count FROM repair_requests r ${dateFilter} AND status = 'completed'`).get(...dateParams).count
    : prepare("SELECT COUNT(*) as count FROM repair_requests WHERE status = 'completed'").get().count;
  const cancelledQ = month
    ? prepare(`SELECT COUNT(*) as count FROM repair_requests r ${dateFilter} AND status = 'cancelled'`).get(...dateParams).count
    : prepare("SELECT COUNT(*) as count FROM repair_requests WHERE status = 'cancelled'").get().count;

  // By category
  const byCategory = month
    ? prepare(`SELECT category, COUNT(*) as count FROM repair_requests r ${dateFilter} GROUP BY category ORDER BY count DESC`).all(...dateParams)
    : prepare(`SELECT category, COUNT(*) as count FROM repair_requests GROUP BY category ORDER BY count DESC`).all();

  // By priority
  const byPriority = month
    ? prepare(`SELECT priority, COUNT(*) as count FROM repair_requests r ${dateFilter} GROUP BY priority`).all(...dateParams)
    : prepare(`SELECT priority, COUNT(*) as count FROM repair_requests GROUP BY priority`).all();

  // Recent requests
  const recent = month
    ? prepare(`SELECT r.*, u.full_name as requester_name FROM repair_requests r LEFT JOIN users u ON r.requester_id = u.id ${dateFilter} ORDER BY r.created_at DESC LIMIT 5`).all(...dateParams)
    : prepare(`SELECT r.*, u.full_name as requester_name FROM repair_requests r LEFT JOIN users u ON r.requester_id = u.id ORDER BY r.created_at DESC LIMIT 5`).all();

  // Monthly summary (last 12 months)
  const monthly = prepare(`
    SELECT 
      substr(created_at, 1, 7) as month,
      COUNT(*) as total,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress
    FROM repair_requests
    GROUP BY substr(created_at, 1, 7)
    ORDER BY month DESC
    LIMIT 12
  `).all().reverse();

  res.json({
    total: totalQ,
    pending: pendingQ,
    inProgress: inProgressQ,
    completed: completedQ,
    cancelled: cancelledQ,
    byCategory,
    byPriority,
    recent,
    monthly,
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
