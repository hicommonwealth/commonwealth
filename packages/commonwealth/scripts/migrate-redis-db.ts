import { dispose } from '@hicommonwealth/core';
import { createClient, RedisClientType } from 'redis';

interface BackupItem {
  key: string;
  type: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
  ttl: number;
}

class RedisBackupRestore {
  private sourceClient: RedisClientType;
  private targetClient: RedisClientType;

  constructor(sourceUrl: string, targetUrl: string) {
    const socketOptions = {
      tls: true,
      rejectUnauthorized: false,
    } as const;
    this.sourceClient = createClient({
      url: sourceUrl,
      socket: {
        ...(sourceUrl.includes('rediss') ? socketOptions : {}),
      },
    });
    this.targetClient = createClient({
      url: targetUrl,
      socket: {
        ...(targetUrl.includes('rediss') ? socketOptions : {}),
      },
    });
  }

  async connect(): Promise<void> {
    console.log('Connecting to source Redis');
    await this.sourceClient.connect();
    console.log('Connecting to target Redis');
    await this.targetClient.connect();
    console.log('Connected to both Redis instances');
  }

  async disconnect(): Promise<void> {
    await Promise.all([
      this.sourceClient.disconnect(),
      this.targetClient.disconnect(),
    ]);
    console.log('Disconnected from Redis instances');
  }

  async backup(): Promise<BackupItem[]> {
    const backup: BackupItem[] = [];
    let cursor = 0;
    let totalKeys = 0;

    console.log('Starting backup...');

    do {
      // Scan keys in batches
      const result = await this.sourceClient.scan(cursor, {
        COUNT: 100_000,
      });

      cursor = result.cursor;
      const keys = result.keys;

      if (keys.length === 0) continue;

      // Process keys in parallel batches
      const batchPromises = keys.map(async (key) => {
        try {
          // Get key type
          const type = await this.sourceClient.type(key);

          // Get TTL (-1 = no expiry, -2 = key doesn't exist)
          const ttl = await this.sourceClient.ttl(key);

          if (ttl === -2) return null; // Key expired or doesn't exist

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let value: any;

          // Get value based on type
          switch (type) {
            case 'string':
              value = await this.sourceClient.get(key);
              break;

            case 'hash':
              value = await this.sourceClient.hGetAll(key);
              break;

            case 'list':
              value = await this.sourceClient.lRange(key, 0, -1);
              break;

            case 'set':
              value = await this.sourceClient.sMembers(key);
              break;

            case 'zset':
              value = await this.sourceClient.zRangeWithScores(key, 0, -1);
              break;

            default:
              console.warn(`Unsupported key type: ${type} for key: ${key}`);
              return null;
          }

          return {
            key,
            type,
            value,
            ttl: ttl === -1 ? -1 : ttl, // Preserve no-expiry vs actual TTL
          };
        } catch (error) {
          console.error(`Error processing key ${key}:`, error);
          return null;
        }
      });

      const batchResults = await Promise.all(batchPromises);
      const validResults = batchResults.filter(
        (item) => item !== null,
      ) as BackupItem[];

      backup.push(...validResults);
      totalKeys += keys.length;

      console.log(
        `Processed ${totalKeys} keys, backed up ${backup.length} valid keys`,
      );
    } while (cursor !== 0);

    console.log(`Backup complete: ${backup.length} keys`);
    return backup;
  }

  async restore(backup: BackupItem[]): Promise<void> {
    console.log(`Starting restore of ${backup.length} keys...`);

    let restored = 0;
    const batchSize = 2_000_000;

    // Process in batches to avoid overwhelming the server
    for (let i = 0; i < backup.length; i += batchSize) {
      const batch = backup.slice(i, i + batchSize);

      const batchPromises = batch.map(async (item) => {
        try {
          const { key, type, value, ttl } = item;

          // Restore value based on type
          switch (type) {
            case 'string':
              await this.targetClient.set(key, value);
              break;

            case 'hash':
              if (Object.keys(value).length > 0) {
                await this.targetClient.hSet(key, value);
              }
              break;

            case 'list':
              if (value.length > 0) {
                await this.targetClient.rPush(key, value);
              }
              break;

            case 'set':
              if (value.length > 0) {
                await this.targetClient.sAdd(key, value);
              }
              break;

            case 'zset':
              if (value.length > 0) {
                const members = value.map((setItem) => ({
                  score: setItem.score,
                  value: setItem.value,
                }));
                await this.targetClient.zAdd(key, members);
              }
              break;
          }

          // Set TTL if key had expiration
          if (ttl > 0) {
            await this.targetClient.expire(key, ttl);
          }

          restored++;
        } catch (error) {
          console.error(`Error restoring key ${item.key}:`, error);
        }
      });

      await Promise.all(batchPromises);
      console.log(`Restored ${restored}/${backup.length} keys`);
    }

    console.log(`Restore complete: ${restored} keys restored`);
  }

  // Direct backup and restore without file
  async migrate(): Promise<void> {
    const backup = await this.backup();
    await this.restore(backup);
  }
}

async function main() {
  const sourceUrl = process.env.HEROKU_REDIS_URL || 'redis://localhost:6379';
  const targetUrl = process.env.TARGET_REDIS_URL || 'redis://localhost:6380';

  const migrator = new RedisBackupRestore(sourceUrl, targetUrl);

  try {
    await migrator.connect();

    // Option 1: Direct migration
    await migrator.migrate();

    // Option 2: Backup to file, then restore later
    // await migrator.backupToFile('redis-backup.json');
    // await migrator.restoreFromFile('redis-backup.json');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await migrator.disconnect();
  }
}

if (import.meta.url.endsWith(process.argv[1])) {
  main()
    .then(() => {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      dispose()('EXIT', true);
    })
    .catch((err) => {
      console.error(err);
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      dispose()('ERROR', true);
    });
}
