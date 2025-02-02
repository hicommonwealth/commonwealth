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
        'Welcome to Common! I can help you engage with your community through raids and contests.\n\n' +
          'Use /help to see available commands or tap the menu button below.',
        { reply_markup: this.menu },
      );
    });

    // Help command - shows available commands
    this.bot.command('help', async (ctx) => {
      await ctx.reply(
        'Available commands:\n\n' +
          '/start - Start the bot and show menu\n' +
          '/help - Show this help message\n' +
          '/open - Open the Commonwealth mini app\n' +
          '/url - Show the mini app URL\n' +
          '/raid <link> <likes> <retweets> <replies> <bookmarks> - Start a new raid\n' +
          '/contest <description> <criteria> <splits> <duration> - Start a new contest',
      );
    });

    // Open command - launches the mini app
    this.bot.command('open', async (ctx) => {
      const webAppUrl = envSchema.parse(process.env).MINI_APP_URL;
      await ctx.reply('Open Common', {
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

    // Open command - launches the mini app
    this.bot.command('url', async (ctx) => {
      const webAppUrl = envSchema.parse(process.env).MINI_APP_URL;
      await ctx.reply(`Mini App URL: ${webAppUrl}`);
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
