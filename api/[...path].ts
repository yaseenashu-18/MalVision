import type { IncomingMessage, ServerResponse } from 'node:http';
import { handleApiRequest } from '../src/server/apiRouter.js';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    const handled = await handleApiRequest(req, res);
    if (!handled) {
      res.statusCode = 404;
      res.end(JSON.stringify({ success: false, error: 'Endpoint not found' }));
    }
  } catch (err) {
    console.error('Vercel API Handler Error:', err);
    res.statusCode = 500;
    res.end(JSON.stringify({ success: false, error: 'Internal Server Error' }));
  }
}
