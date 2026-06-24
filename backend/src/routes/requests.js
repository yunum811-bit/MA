const express = require('express');
const { prepare, saveDb } = require('../database');
const { authenticate, authorizeRoles } = require('../middleware/auth');
const { notifyNewRequest, notifyAssigned, notifyCompleted } = require('../services/emailService');

const router = express.Router();

// Get all requests (admin see all, technician sees assigned, user sees own)
router.get('/', authenticate, (req, res) => {
  let requests;
  if (req.user.role === 'admin') {
    requests = prepare(`
      SELECT r.*, 
        u1.full_name as requester_name, u1.department as requester_department,
        u2.full_name as assigned_name
      FROM repair_requests r
      LEFT JOIN users u1 ON r.requester_id = u1.id
      LEFT JOIN users u2 ON r.assigned_to = u2.id
      ORDER BY r.created_at DESC
    `).all();
  } else if (req.user.role === 'technician') {
    requests = prepare(`
      SELECT r.*, 
        u1.full_name as requester_name, u1.department as requester_department,
        u2.full_name as assigned_name
      FROM repair_requests r
      LEFT JOIN users u1 ON r.requester_id = u1.id
      LEFT JOIN users u2 ON r.assigned_to = u2.id
      WHERE r.assigned_to = ?
      ORDER BY r.created_at DESC
    `).all(req.user.id);
  } else {
    requests = prepare(`
      SELECT r.*, 
        u1.full_name as requester_name, u1.department as requester_department,
        u2.full_name as assigned_name
      FROM repair_requests r
      LEFT JOIN users u1 ON r.requester_id = u1.id
      LEFT JOIN users u2 ON r.assigned_to = u2.id
      WHERE r.requester_id = ?
      ORDER BY r.created_at DESC
    `).all(req.user.id);
  }
  res.json(requests);
});

// Get single request
router.get('/:id', authenticate, (req, res) => {
  const request = prepare(`
    SELECT r.*, 
      u1.full_name as requester_name, u1.department as requester_department, u1.phone as requester_phone,
      u2.full_name as assigned_name
    FROM repair_requests r
    LEFT JOIN users u1 ON r.requester_id = u1.id
    LEFT JOIN users u2 ON r.assigned_to = u2.id
    WHERE r.id = ?
  `).get(parseInt(req.params.id));

  if (!request) {
    return res.status(404).json({ error: 'ไม่พบรายการแจ้งซ่อม' });
  }

  // Get history
  const history = prepare(`
    SELECT h.*, u.full_name as performer_name
    FROM request_history h
    LEFT JOIN users u ON h.performed_by = u.id
    WHERE h.request_id = ?
    ORDER BY h.created_at DESC
  `).all(parseInt(req.params.id));

  res.json({ ...request, history });
});

// Create new request
router.post('/', authenticate, (req, res) => {
  const { title, description, category, location, priority } = req.body;

  if (!title || !description || !category || !location) {
    return res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
  }

  const result = prepare(`
    INSERT INTO repair_requests (title, description, category, location, priority, requester_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(title, description, category, location, priority || 'medium', req.user.id);

  // Add history
  prepare(`
    INSERT INTO request_history (request_id, action, description, performed_by)
    VALUES (?, ?, ?, ?)
  `).run(result.lastInsertRowid, 'created', 'สร้างรายการแจ้งซ่อมใหม่', req.user.id);

  // Send email to admin
  notifyNewRequest({ title, description, location, category, priority }, req.user.full_name).catch(() => {});

  res.status(201).json({ id: result.lastInsertRowid, message: 'สร้างรายการแจ้งซ่อมสำเร็จ' });
});

// Update request status (admin/technician)
router.patch('/:id/status', authenticate, authorizeRoles('admin', 'technician'), (req, res) => {
  const { status, notes } = req.body;
  const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'สถานะไม่ถูกต้อง' });
  }

  const requestId = parseInt(req.params.id);

  if (status === 'completed') {
    const completedAt = new Date().toISOString();
    prepare(`
      UPDATE repair_requests 
      SET status = ?, notes = COALESCE(?, notes), updated_at = CURRENT_TIMESTAMP, completed_at = ?
      WHERE id = ?
    `).run(status, notes || null, completedAt, requestId);
  } else {
    prepare(`
      UPDATE repair_requests 
      SET status = ?, notes = COALESCE(?, notes), updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status, notes || null, requestId);
  }

  const statusText = { pending: 'รอดำเนินการ', in_progress: 'กำลังดำเนินการ', completed: 'เสร็จสิ้น', cancelled: 'ยกเลิก' };
  prepare(`
    INSERT INTO request_history (request_id, action, description, performed_by)
    VALUES (?, ?, ?, ?)
  `).run(requestId, 'status_changed', `เปลี่ยนสถานะเป็น "${statusText[status]}"`, req.user.id);

  // Send email when completed
  if (status === 'completed') {
    const request = prepare(`
      SELECT r.*, u.full_name as requester_name, u.email as requester_email
      FROM repair_requests r
      LEFT JOIN users u ON r.requester_id = u.id
      WHERE r.id = ?
    `).get(requestId);
    if (request && request.requester_email) {
      notifyCompleted(request.requester_email, request, request.requester_name).catch(() => {});
    }
  }

  res.json({ message: 'อัพเดทสถานะสำเร็จ' });
});

// Assign technician (admin only)
router.patch('/:id/assign', authenticate, authorizeRoles('admin'), (req, res) => {
  const { assigned_to } = req.body;

  const technician = prepare("SELECT full_name, email FROM users WHERE id = ? AND role IN ('technician', 'admin')").get(assigned_to);
  if (!technician) {
    return res.status(400).json({ error: 'ไม่พบช่างที่ระบุ' });
  }

  prepare(`
    UPDATE repair_requests 
    SET assigned_to = ?, status = 'in_progress', updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(assigned_to, parseInt(req.params.id));

  prepare(`
    INSERT INTO request_history (request_id, action, description, performed_by)
    VALUES (?, ?, ?, ?)
  `).run(parseInt(req.params.id), 'assigned', `มอบหมายงานให้ "${technician.full_name}"`, req.user.id);

  // Send email to technician
  if (technician.email) {
    const request = prepare('SELECT * FROM repair_requests WHERE id = ?').get(parseInt(req.params.id));
    notifyAssigned(technician.email, request, technician.full_name).catch(() => {});
  }

  res.json({ message: 'มอบหมายงานสำเร็จ' });
});

// Upload images for a request
router.post('/:id/images', authenticate, (req, res) => {
  const { images } = req.body; // array of { data, filename }
  if (!images || !images.length) {
    return res.status(400).json({ error: 'ไม่มีรูปภาพ' });
  }

  const fs = require('fs');
  const path = require('path');
  const uploadsDir = path.resolve(__dirname, '../../uploads');

  // Ensure uploads directory exists
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const requestId = parseInt(req.params.id);
  const savedImages = [];

  for (const img of images) {
    // Extract base64 data
    const matches = img.data.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!matches) continue;

    const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
    const base64Data = matches[2];
    const fileName = `req${requestId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const filePath = path.join(uploadsDir, fileName);

    // Save file
    fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));

    // Save to database (store file path instead of base64)
    prepare(`
      INSERT INTO request_images (request_id, image_data, filename)
      VALUES (?, ?, ?)
    `).run(requestId, `/uploads/${fileName}`, img.filename || fileName);

    savedImages.push(fileName);
  }

  res.status(201).json({ message: `อัพโหลด ${savedImages.length} รูปสำเร็จ` });
});

// Get images for a request
router.get('/:id/images', authenticate, (req, res) => {
  const images = prepare(`
    SELECT id, request_id, image_data, filename, created_at
    FROM request_images
    WHERE request_id = ?
    ORDER BY created_at ASC
  `).all(parseInt(req.params.id));
  res.json(images);
});

// Delete an image
router.delete('/images/:imageId', authenticate, (req, res) => {
  const fs = require('fs');
  const path = require('path');

  const image = prepare('SELECT image_data FROM request_images WHERE id = ?').get(parseInt(req.params.imageId));
  if (image && image.image_data.startsWith('/uploads/')) {
    const filePath = path.resolve(__dirname, '../..', image.image_data.slice(1));
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  prepare('DELETE FROM request_images WHERE id = ?').run(parseInt(req.params.imageId));
  res.json({ message: 'ลบรูปสำเร็จ' });
});

// Delete all requests (admin only)
router.delete('/clear-all', authenticate, authorizeRoles('admin'), (req, res) => {
  prepare('DELETE FROM request_images').run();
  prepare('DELETE FROM request_history').run();
  prepare('DELETE FROM repair_requests').run();
  res.json({ message: 'ลบรายการแจ้งซ่อมทั้งหมดสำเร็จ' });
});

// Delete request (admin only)
router.delete('/:id', authenticate, authorizeRoles('admin'), (req, res) => {
  prepare('DELETE FROM request_images WHERE request_id = ?').run(parseInt(req.params.id));
  prepare('DELETE FROM request_history WHERE request_id = ?').run(parseInt(req.params.id));
  prepare('DELETE FROM repair_requests WHERE id = ?').run(parseInt(req.params.id));
  res.json({ message: 'ลบรายการแจ้งซ่อมสำเร็จ' });
});

module.exports = router;
