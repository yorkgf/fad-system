const BLOCKED_HTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>403 Forbidden</title>
<style>body{display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:#f5f7fa;color:#606266;text-align:center}
.card{background:#fff;border-radius:16px;padding:48px 40px;box-shadow:0 4px 24px rgba(0,0,0,.08);max-width:400px}
h1{font-size:64px;margin:0;color:#f56c6c}h2{font-size:18px;margin:12px 0 8px;color:#303133}p{font-size:14px;color:#909399;margin:0}</style>
</head>
<body><div class="card"><h1>403</h1><h2>Access Denied</h2><p>您没有权限访问此页面</p></div></body>
</html>`;

function getClientIP(request) {
  const eo = request.eo;
  if (eo && eo.clientIp) return eo.clientIp;
  const candidates = [
    'x-forwarded-for',
    'x-real-ip',
    'cf-connecting-ip',
    'true-client-ip'
  ];
  for (const header of candidates) {
    const value = request.headers.get(header);
    if (value) return value.split(',')[0].trim();
  }
  return '';
}

function isIPAllowed(clientIP, allowedList) {
  if (!allowedList || allowedList === '') return true;
  const allowed = allowedList.split(',').map(ip => ip.trim()).filter(Boolean);
  if (allowed.length === 0) return true;
  return allowed.includes(clientIP);
}

function applyNocache(headers) {
  headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  headers.set('Pragma', 'no-cache');
  headers.set('Expires', '0');
  headers.set('CDN-Cache-Control', 'no-store');
  return headers;
}

export async function onRequest(context) {
  const clientIP = getClientIP(context.request);
  const allowedIPs = context.env.ALLOWED_IPS || '';

  if (!isIPAllowed(clientIP, allowedIPs)) {
    const headers = new Headers({
      'Content-Type': 'text/html; charset=utf-8'
    });
    applyNocache(headers);
    return new Response(BLOCKED_HTML, { status: 403, headers });
  }

  const response = await context.next();
  const headers = new Headers(response.headers);
  applyNocache(headers);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}
