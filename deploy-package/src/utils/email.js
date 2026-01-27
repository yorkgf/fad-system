const axios = require('axios')

const BREVO_API_KEY = process.env.BREVO_API_KEY || ''
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email'
const SENDER_EMAIL = process.env.SENDER_EMAIL || 'noreply@school.edu.cn'
const SENDER_NAME = process.env.SENDER_NAME || 'FAD管理系统'

async function sendEmail({ to, subject, htmlContent }) {
  if (!BREVO_API_KEY) {
    console.warn('BREVO_API_KEY not configured, skipping email')
    return { success: false, error: 'Email not configured' }
  }

  try {
    const response = await axios.post(
      BREVO_API_URL,
      {
        sender: { email: SENDER_EMAIL, name: SENDER_NAME },
        to: [{ email: to }],
        subject,
        htmlContent
      },
      {
        headers: {
          'api-key': BREVO_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    )

    return { success: true, messageId: response.data.messageId }
  } catch (error) {
    console.error('Send email error:', error.response?.data || error.message)
    return { success: false, error: error.message }
  }
}

// 发送记录通知给班主任
async function sendRecordNotification({ homeTeacherEmail, record }) {
  const subject = `学生记录通知 - ${record.学生} - ${record.记录类型}`
  const htmlContent = `
    <h2>学生记录通知</h2>
    <p><strong>学生：</strong>${record.学生}</p>
    <p><strong>班级：</strong>${record.班级}</p>
    <p><strong>记录类型：</strong>${record.记录类型}</p>
    <p><strong>记录日期：</strong>${record.记录日期}</p>
    <p><strong>记录老师：</strong>${record.记录老师}</p>
    <p><strong>记录事由：</strong>${record.记录事由 || '-'}</p>
  `

  return sendEmail({ to: homeTeacherEmail, subject, htmlContent })
}

// 发送新密码邮件
async function sendPasswordEmail({ to, newPassword }) {
  const subject = 'FAD管理系统 - 密码重置'
  const htmlContent = `
    <h2>密码重置</h2>
    <p>您的新密码是：<strong>${newPassword}</strong></p>
    <p>请登录后及时修改密码。</p>
  `

  return sendEmail({ to, subject, htmlContent })
}

module.exports = {
  sendEmail,
  sendRecordNotification,
  sendPasswordEmail
}
