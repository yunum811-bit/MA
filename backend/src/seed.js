const bcrypt = require('bcryptjs');
require('dotenv').config();

const { getDb, prepare, saveDb } = require('./database');

async function seed() {
  await getDb();

  // Seed users
  const users = [
    { username: 'admin', password: 'admin123', full_name: 'ผู้ดูแลระบบ', department: 'IT', role: 'admin', phone: '081-111-1111' },
    { username: 'technician1', password: 'tech123', full_name: 'ช่างสมชาย', department: 'ซ่อมบำรุง', role: 'technician', phone: '081-222-2222' },
    { username: 'technician2', password: 'tech123', full_name: 'ช่างสมหญิง', department: 'ซ่อมบำรุง', role: 'technician', phone: '081-333-3333' },
    { username: 'user1', password: 'user123', full_name: 'สมศักดิ์ แก้วใจ', department: 'บัญชี', role: 'user', phone: '081-444-4444' },
    { username: 'user2', password: 'user123', full_name: 'สมหมาย รักดี', department: 'การตลาด', role: 'user', phone: '081-555-5555' },
  ];

  for (const user of users) {
    const exists = prepare('SELECT id FROM users WHERE username = ?').get(user.username);
    if (!exists) {
      const hashedPassword = bcrypt.hashSync(user.password, 10);
      prepare(`
        INSERT INTO users (username, password, full_name, department, role, phone)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(user.username, hashedPassword, user.full_name, user.department, user.role, user.phone);
    }
  }

  // Seed repair requests
  const requests = [
    { title: 'แอร์ไม่เย็น', description: 'แอร์ห้องประชุมชั้น 3 ไม่เย็น มีเสียงดังผิดปกติ', category: 'ไฟฟ้า/แอร์', location: 'ห้องประชุม ชั้น 3', priority: 'high', status: 'in_progress', requester_id: 4, assigned_to: 2 },
    { title: 'ก๊อกน้ำรั่ว', description: 'ก๊อกน้ำในห้องน้ำชายชั้น 2 รั่ว', category: 'ประปา', location: 'ห้องน้ำชาย ชั้น 2', priority: 'medium', status: 'pending', requester_id: 5, assigned_to: null },
    { title: 'คอมพิวเตอร์เปิดไม่ติด', description: 'คอมพิวเตอร์โต๊ะทำงานเปิดไม่ติด กดปุ่มแล้วไม่มีไฟ', category: 'IT/คอมพิวเตอร์', location: 'ฝ่ายบัญชี ชั้น 1', priority: 'high', status: 'completed', requester_id: 4, assigned_to: 2 },
    { title: 'หลอดไฟเสีย', description: 'หลอดไฟทางเดินชั้น 4 ดับ 3 หลอด', category: 'ไฟฟ้า/แอร์', location: 'ทางเดิน ชั้น 4', priority: 'low', status: 'pending', requester_id: 5, assigned_to: null },
    { title: 'ประตูปิดไม่สนิท', description: 'ประตูห้องเก็บของปิดไม่สนิท บานพับหลวม', category: 'อาคาร/สถานที่', location: 'ห้องเก็บของ ชั้น 1', priority: 'medium', status: 'in_progress', requester_id: 4, assigned_to: 3 },
    { title: 'เครื่องปริ้นเตอร์กระดาษติด', description: 'เครื่องปริ้นเตอร์ห้องการตลาดกระดาษติดบ่อย', category: 'IT/คอมพิวเตอร์', location: 'ฝ่ายการตลาด ชั้น 2', priority: 'medium', status: 'completed', requester_id: 5, assigned_to: 2 },
  ];

  const existingCount = prepare('SELECT COUNT(*) as count FROM repair_requests').get().count;
  if (existingCount === 0) {
    // No sample requests - start fresh
  }

  console.log('✅ Seed data inserted successfully!');
  console.log('📋 Users created:');
  users.forEach(u => console.log(`   - ${u.username} / ${u.password} (${u.role})`));
  console.log('\n🗑️  ไม่มีรายการแจ้งซ่อมตัวอย่าง - พร้อมใส่งานจริง');
  process.exit(0);
}

seed().catch(console.error);
