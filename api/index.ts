import type { IncomingMessage, ServerResponse } from 'node:http';
import { handleApiRequest } from '../src/server/apiRouter.js';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    const handled = await handleApiRequest(req, res);
    if (!handled) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: false, error: 'Endpoint not found' }));
    }
  } catch (err: any) {
    console.error('Vercel API Handler Error:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, error: err?.message || 'Internal Server Error' }));
  }
}
