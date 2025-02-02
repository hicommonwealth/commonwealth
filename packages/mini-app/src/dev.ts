import dotenv from 'dotenv';
import CommonBot from './bot';

// Load environment variables
dotenv.config();

async function main() {
  try {
    const bot = new CommonBot();

    // Handle graceful shutdown
    process.once('SIGINT', () => bot.stop());
    process.once('SIGTERM', () => bot.stop());

    await bot.start();
    console.log('Bot is running in development mode. Press Ctrl+C to stop.');
  } catch (error) {
    console.error('Failed to start bot:', error);
    process.exit(1);
  }
}

main();
