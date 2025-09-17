export const BACKEND_HTTP_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export const BACKEND_WS_URL = BACKEND_HTTP_URL.startsWith('https')
  ? BACKEND_HTTP_URL.replace('https', 'wss')
  : BACKEND_HTTP_URL.replace('http', 'ws');


