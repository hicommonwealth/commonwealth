import { conversations } from '@grammyjs/conversations';
import { Menu } from '@grammyjs/menu';
import { Bot, session } from 'grammy';
import { z } from 'zod';
import { CommonStorage } from './storage';

// Environment variables schema
const envSchema = z.object({
  TELEGRAM_BOT_TOKEN: z.string(),
  MINI_APP_URL: z.string().url(),
  GLOBAL_CHANNEL_ID: z.string(),
});

// Command parameter schemas
const raidParamsSchema = z.object({
  link: z.string().url(),
  likes: z.number().min(0),
  retweets: z.number().min(0),
  replies: z.number().min(0),
  bookmarks: z.number().min(0),
});

const contestParamsSchema = z.object({
  description: z.string(),
  criteria: z.string(),
  splits: z.array(z.number()).min(1),
  duration: z.number().min(1),
});

// Define session data type
interface SessionData {
  raidData?: {
    link: string;
    likes: number;
    retweets: number;
    replies: number;
    bookmarks: number;
  };
  contestData?: {
    description: string;
    criteria: string;
    splits: number[];
    duration: number;
  };
}

export class CommonBot {
  private bot: Bot;
  private menu: Menu;
  private storage: CommonStorage;

  constructor() {
    // Validate environment variables
    const env = envSchema.parse(process.env);

    // Initialize storage
    this.storage = new CommonStorage();

    // Initialize bot
    this.bot = new Bot(env.TELEGRAM_BOT_TOKEN);

    // Set the menu button to open the mini app
    this.bot.api
      .setChatMenuButton({
        menu_button: {
          type: 'web_app',
          text: 'Open Common',
          web_app: { url: env.MINI_APP_URL },
        },
      })
      .catch((error) => {
        console.error('Failed to set menu button:', error);
      });

    // Setup session storage with initial data
    this.bot.use(
      session({
        initial: (): SessionData => ({}),
        storage: this.storage,
      }),
    );

    // Enable conversations
    this.bot.use(conversations());

    // Setup menu
    this.menu = new Menu('main-menu')
      .webApp('🚀 Open Mini App', env.MINI_APP_URL)
      .row()
      .text('🎯 Start Raid', (ctx) =>
        ctx.reply('Use /raid to start a new raid'),
      )
      .text('🎨 Start Contest', (ctx) =>
        ctx.reply('Use /contest to start a new contest'),
      );

    this.bot.use(this.menu);

    // Setup commands and middleware
    this.setupCommands();
    this.setupMiddleware();
  }

  private setupCommands(): void {
    // Start command - introduces the bot and shows menu
    this.bot.command('start', async (ctx) => {
      await ctx.reply(
        'Welcome to Common! 👋\n\n' +
          'Use the menu button below to open our mini app and engage with the community.\n\n' +
          'Additional commands:\n' +
          '/raid - Start a new raid\n' +
          '/contest - Start a new contest\n' +
          '/help - Show all commands',
        { reply_markup: this.menu },
      );
    });

    // Help command - shows available commands
    this.bot.command('help', async (ctx) => {
      const commands = [
        '/start - Open the mini app and show menu',
        '/open - Open the Common mini app',
        '/raid <link> <likes> <retweets> <replies> <bookmarks> - Start a new raid',
        '/contest <description> <criteria> <splits> <duration> - Start a new contest',
      ];

      // Only show debug commands in development
      if (process.env.NODE_ENV !== 'production') {
        commands.push('/url - Show mini app URL and debug info');
      }

      await ctx.reply('Available commands:\n\n' + commands.join('\n'));
    });

    // Open command - launches the mini app
    this.bot.command('open', async (ctx) => {
      const webAppUrl = envSchema.parse(process.env).MINI_APP_URL;
      await ctx.reply('Open Common Mini App', {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '🚀 Launch Common',
                web_app: { url: webAppUrl },
              },
            ],
          ],
        },
      });
    });

    // URL command - for debugging (only works in development)
    this.bot.command('url', async (ctx) => {
      if (process.env.NODE_ENV === 'production') {
        await ctx.reply('This command is only available in development mode.');
        return;
      }

      const env = envSchema.parse(process.env);
      await ctx.reply(
        '🔧 Debug Information:\n\n' +
          `Mini App URL: ${env.MINI_APP_URL}\n` +
          `Environment: ${process.env.NODE_ENV || 'development'}\n` +
          `Global Channel: ${env.GLOBAL_CHANNEL_ID}\n` +
          `\nTroubleshooting Tips:\n` +
          `1. Make sure ngrok is running and the URL is up to date in .env\n` +
          `2. Check if the mini app loads outside Telegram first\n` +
          `3. Verify BotFather menu button settings\n` +
          `4. Clear Telegram web app cache if needed\n\n` +
          'Note: This command is only available in development mode.',
      );
    });

    // Raid command
    this.bot.command('raid', async (ctx) => {
      try {
        const params = ctx.message.text.split(' ').slice(1);
        const [link, likes, retweets, replies, bookmarks] = params;

        const raidData = raidParamsSchema.parse({
          link,
          likes: parseInt(likes),
          retweets: parseInt(retweets),
          replies: parseInt(replies),
          bookmarks: parseInt(bookmarks),
        });

        // TODO: Implement raid creation and tracking
        await ctx.reply('Raid created! Tracking will begin shortly...');

        // Post to global channel
        await this.bot.api.sendMessage(
          envSchema.parse(process.env).GLOBAL_CHANNEL_ID,
          `🎯 New Raid Started!\n\nTarget: ${raidData.link}\nGoals:\n` +
            `- Likes: ${raidData.likes}\n` +
            `- Retweets: ${raidData.retweets}\n` +
            `- Replies: ${raidData.replies}\n` +
            `- Bookmarks: ${raidData.bookmarks}`,
        );
      } catch (error) {
        await ctx.reply(
          'Invalid raid parameters. Use format:\n' +
            '/raid <link> <likes> <retweets> <replies> <bookmarks>',
        );
      }
    });

    // Contest command
    this.bot.command('contest', async (ctx) => {
      try {
        const params = ctx.message.text.split(' ').slice(1);
        const [description, criteria, splitsStr, duration] = params;

        const contestData = contestParamsSchema.parse({
          description,
          criteria,
          splits: splitsStr.split('/').map(Number),
          duration: parseInt(duration),
        });

        // TODO: Implement contest creation and management
        await ctx.reply('Contest created! Get ready to submit your memes!');

        // Post to global channel
        await this.bot.api.sendMessage(
          envSchema.parse(process.env).GLOBAL_CHANNEL_ID,
          `🎨 New Contest Started!\n\n${contestData.description}\n\n` +
            `Judging Criteria: ${contestData.criteria}\n` +
            `Prize Split: ${contestData.splits.join('/')}\n` +
            `Duration: ${contestData.duration} hours`,
        );
      } catch (error) {
        await ctx.reply(
          'Invalid contest parameters. Use format:\n' +
            '/contest <description> <criteria> <place1%/place2%/place3%> <duration_hours>',
        );
      }
    });
  }

  private setupMiddleware(): void {
    // Add error handling middleware
    this.bot.catch((err) => {
      console.error('Bot error:', err);
    });
  }

  public async handleUpdate(update: any): Promise<void> {
    await this.bot.handleUpdate(update);
  }

  public async start(): Promise<void> {
    // In production, we don't need to start polling
    if (process.env.NODE_ENV !== 'production') {
      this.bot.start();
      console.log('Common Telegram bot started in polling mode');
    } else {
      console.log('Common Telegram bot ready for webhook updates');
    }
  }

  public async stop(): Promise<void> {
    await this.storage.cleanup();
    this.bot.stop();
    console.log('Common Telegram bot stopped');
  }
}

export default CommonBot;
