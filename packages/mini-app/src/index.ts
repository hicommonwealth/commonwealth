import CommonBot from './bot';

const bot = new CommonBot();

// For Vercel serverless deployment
export default async function handler(req: any, res: any) {
  // Start bot if not already running
  if (!bot) {
    await bot.start();
  }

  // Health check endpoint
  if (req.method === 'GET') {
    return res.status(200).json({ status: 'ok' });
  }

  // Handle Telegram webhook updates
  if (req.method === 'POST') {
    try {
      await bot.handleUpdate(req.body);
      return res.status(200).json({ status: 'ok' });
    } catch (error) {
      console.error('Error handling update:', error);
      return res.status(500).json({ error: 'Failed to handle update' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
