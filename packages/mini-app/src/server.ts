import cors from 'cors';
import express from 'express';
import { z } from 'zod';
import CommonBot from './bot';

const envSchema = z.object({
  PORT: z.string().default('3000'),
  NODE_ENV: z.string().default('development'),
});

const env = envSchema.parse(process.env);
const app = express();
const bot = new CommonBot();

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Bot webhook endpoint (for production)
app.post('/bot/webhook', async (req, res) => {
  try {
    await bot.handleUpdate(req.body);
    res.sendStatus(200);
  } catch (error) {
    console.error('Error handling webhook:', error);
    res.sendStatus(500);
  }
});

// Start the server
const port = parseInt(env.PORT);
app.listen(port, () => {
  console.log(`Server running on port ${port}`);

  // Start the bot
  bot.start().catch(console.error);
});
