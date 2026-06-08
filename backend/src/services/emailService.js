const nodemailer = require('nodemailer');
require('dotenv').config();

let transporter = null;

function getTransporter() {
  if (!process.env.EMAIL_ENABLED || process.env.EMAIL_ENABLED !== 'true') {
    return null;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.office365.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false, // true for 465, false for 587
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        ciphers: 'SSLv3',
        rejectUnauthorized: false,
      },
    });
  }
  return transporter;
}

async function sendEmail(to, subject, html) {
  const transport = getTransporter();
  if (!transport) {
    console.log(`[EMAIL DISABLED] To: ${to} | Subject: ${subject}`);
    return false;
  }

  try {
    await transport.sendMail({
      from: `"ระบบแจ้งซ่อม" <${process.env.SMTP_FROM}>`,
      to,
      subject,
      html,
    });
    console.log(`[EMAIL SENT] To: ${to} | Subject: ${subject}`);
    return true;
  } catch (err) {
    console.error(`[EMAIL ERROR] To: ${to} | Error: ${err.message}`);
    return false;
  }
}

// แจ้ง admin เมื่อมีงานซ่อมใหม่
async function notifyNewRequest(request, requesterName) {
  const subject = `[แจ้งซ่อมใหม่] ${request.title}`;
  const html = `
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #166534; color: white; padding: 20px; border-radius: 12px 12px 0 0;">
        <h2 style="margin: 0;">🔧 แจ้งซ่อมใหม่</h2>
      </div>
      <div style="background: #f9f9f9; padding: 20px; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
        <p><strong>หัวข้อ:</strong> ${request.title}</p>
        <p><strong>รายละเอียด:</strong> ${request.description}</p>
        <p><strong>สถานที่:</strong> ${request.location}</p>
        <p><strong>หมวดหมู่:</strong> ${request.category}</p>
        <p><strong>ความเร่งด่วน:</strong> ${request.priority === 'high' ? '🔴 สูง' : request.priority === 'medium' ? '🟡 ปานกลาง' : '🟢 ต่ำ'}</p>
        <p><strong>ผู้แจ้ง:</strong> ${requesterName}</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 15px 0;">
        <p style="color: #6b7280; font-size: 12px;">กรุณาเข้าสู่ระบบเพื่อดำเนินการ</p>
      </div>
    </div>
  `;
  return sendEmail(process.env.SMTP_USER, subject, html);
}

// แจ้งช่างเมื่อได้รับมอบหมายงาน
async function notifyAssigned(technicianEmail, request, technicianName) {
  const subject = `[มอบหมายงาน] ${request.title}`;
  const html = `
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #166534; color: white; padding: 20px; border-radius: 12px 12px 0 0;">
        <h2 style="margin: 0;">📋 คุณได้รับมอบหมายงานซ่อม</h2>
      </div>
      <div style="background: #f9f9f9; padding: 20px; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
        <p>สวัสดีคุณ <strong>${technicianName}</strong></p>
        <p>คุณได้รับมอบหมายงานซ่อมดังนี้:</p>
        <p><strong>หัวข้อ:</strong> ${request.title}</p>
        <p><strong>รายละเอียด:</strong> ${request.description}</p>
        <p><strong>สถานที่:</strong> ${request.location}</p>
        <p><strong>ความเร่งด่วน:</strong> ${request.priority === 'high' ? '🔴 สูง' : request.priority === 'medium' ? '🟡 ปานกลาง' : '🟢 ต่ำ'}</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 15px 0;">
        <p style="color: #6b7280; font-size: 12px;">กรุณาเข้าสู่ระบบเพื่อดำเนินการ</p>
      </div>
    </div>
  `;
  return sendEmail(technicianEmail, subject, html);
}

// แจ้งผู้แจ้งซ่อมเมื่องานเสร็จ
async function notifyCompleted(requesterEmail, request, requesterName) {
  const subject = `[งานเสร็จสิ้น] ${request.title}`;
  const html = `
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #166534; color: white; padding: 20px; border-radius: 12px 12px 0 0;">
        <h2 style="margin: 0;">✅ งานซ่อมเสร็จสิ้น</h2>
      </div>
      <div style="background: #f9f9f9; padding: 20px; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
        <p>สวัสดีคุณ <strong>${requesterName}</strong></p>
        <p>งานซ่อมที่คุณแจ้งได้ดำเนินการเสร็จสิ้นแล้ว:</p>
        <p><strong>หัวข้อ:</strong> ${request.title}</p>
        <p><strong>สถานที่:</strong> ${request.location}</p>
        ${request.notes ? `<p><strong>วิธีการซ่อม:</strong> ${request.notes}</p>` : ''}
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 15px 0;">
        <p style="color: #6b7280; font-size: 12px;">ขอบคุณที่ใช้ระบบแจ้งซ่อม</p>
      </div>
    </div>
  `;
  return sendEmail(requesterEmail, subject, html);
}

module.exports = {
  sendEmail,
  notifyNewRequest,
  notifyAssigned,
  notifyCompleted,
};
