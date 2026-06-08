const { ConfidentialClientApplication } = require('@azure/msal-node');
const https = require('https');
require('dotenv').config();

let msalClient = null;

function getMsalClient() {
  const tenantId = process.env.AZURE_TENANT_ID;
  const clientId = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;

  if (!tenantId || !clientId || !clientSecret) return null;

  if (!msalClient) {
    msalClient = new ConfidentialClientApplication({
      auth: {
        clientId,
        clientSecret,
        authority: `https://login.microsoftonline.com/${tenantId}`,
      },
    });
  }
  return msalClient;
}

async function getAccessToken() {
  const client = getMsalClient();
  if (!client) return null;

  const result = await client.acquireTokenByClientCredential({
    scopes: ['https://graph.microsoft.com/.default'],
  });
  return result?.accessToken;
}

async function sendEmail(to, subject, html) {
  if (process.env.EMAIL_ENABLED !== 'true') {
    console.log(`[EMAIL DISABLED] To: ${to} | Subject: ${subject}`);
    return false;
  }

  try {
    const token = await getAccessToken();
    if (!token) {
      console.error('[EMAIL ERROR] ไม่สามารถรับ access token ได้ - ตรวจสอบ AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET');
      return false;
    }

    const senderEmail = process.env.SMTP_FROM || process.env.SMTP_USER;
    const requestBody = JSON.stringify({
      message: {
        subject,
        body: { contentType: 'HTML', content: html },
        toRecipients: [{ emailAddress: { address: to } }],
      },
      saveToSentItems: false,
    });

    return new Promise((resolve) => {
      const options = {
        hostname: 'graph.microsoft.com',
        path: `/v1.0/users/${senderEmail}/sendMail`,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(requestBody),
        },
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode === 202 || res.statusCode === 200) {
            console.log(`[EMAIL SENT] To: ${to} | Subject: ${subject}`);
            resolve(true);
          } else {
            console.error(`[EMAIL ERROR] Status: ${res.statusCode} | To: ${to} | Response: ${data}`);
            resolve(false);
          }
        });
      });

      req.on('error', (err) => {
        console.error(`[EMAIL ERROR] To: ${to} | Error: ${err.message}`);
        resolve(false);
      });

      req.write(requestBody);
      req.end();
    });
  } catch (err) {
    console.error(`[EMAIL ERROR] To: ${to} | Error: ${err.message}`);
    return false;
  }
}

// แจ้ง admin เมื่อมีงานซ่อมใหม่
async function notifyNewRequest(request, requesterName) {
  const adminEmail = process.env.SMTP_FROM || process.env.SMTP_USER;
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
  return sendEmail(adminEmail, subject, html);
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
