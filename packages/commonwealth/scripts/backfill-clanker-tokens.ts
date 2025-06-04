import { S3BlobStorage } from '@hicommonwealth/adapters';
import { blobStorage, logger } from '@hicommonwealth/core';
import { emitEvent, models } from '@hicommonwealth/model';
import { ClankerToken, EventPairs } from '@hicommonwealth/schemas';
import { delay } from '@hicommonwealth/shared';
import csv from 'csv-parser';
import fetch from 'node-fetch';
import { exit } from 'process';
import { Transform } from 'stream';
import { z } from 'zod';

const log = logger(import.meta);

blobStorage({
  adapter: S3BlobStorage(),
});

/*
  This script reads clanker tokens from an S3 CSV dump and
  emits ClankerTokenFound events for each token.
  The events will be processed by the CommunityIndexerWorker
  to create communities.
*/

// Custom transform stream to handle backpressure
class BatchProcessor extends Transform {
  private buffer: EventPairs[] = [];
  private readonly batchSize: number;

  constructor(batchSize: number) {
    super({ objectMode: true });
    this.batchSize = batchSize;
  }

  async _transform(
    chunk: Record<string, string>,
    _encoding: string,
    callback: Function,
  ) {
    try {
      const token: z.infer<typeof ClankerToken> = {
        id: parseInt(chunk.id),
        created_at: new Date(chunk.created_at),
        tx_hash: chunk.tx_hash,
        contract_address: chunk.contract_address,
        requestor_fid: parseInt(chunk.requestor_fid),
        name: chunk.name,
        symbol: chunk.symbol,
        img_url: chunk.img_url,
        pool_address: chunk.pool_address,
        cast_hash: chunk.cast_hash,
        type: chunk.type,
        pair: chunk.pair,
        presale_id: chunk.presale_id,
      };

      this.buffer.push({
        event_name: 'ClankerTokenFound',
        event_payload: token,
      });

      if (this.buffer.length >= this.batchSize) {
        await this.flushBuffer();
      }
      callback();
    } catch (err) {
      callback(err);
    }
  }

  async _flush(callback: Function) {
    try {
      if (this.buffer.length > 0) {
        await this.flushBuffer();
      }
      callback();
    } catch (err) {
      callback(err);
    }
  }

  private async flushBuffer() {
    if (this.buffer.length === 0) return;
    await emitEvent(models.Outbox, this.buffer);
    this.buffer = [];
    // delay to prevent clogging outbox
    await delay(5000);
  }
}

async function main() {
  let numTokensFound = 0;
  const BATCH_SIZE = 50;

  // copied from https://github.com/clanker-devco/deployed_clankers
  const csvUrl =
    'https://common-dumps1.s3.us-east-1.amazonaws.com/deployed_clankers_feb12_2025.csv';
  const response = await fetch(csvUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch CSV: ${response.statusText}`);
  }

  await new Promise((resolve, reject) => {
    const batchProcessor = new BatchProcessor(BATCH_SIZE);

    response.body
      .pipe(csv())
      .pipe(batchProcessor)
      .on('data', () => {
        numTokensFound++;
      })
      .on('end', resolve)
      .on('error', reject);
  });

  log.info(`Found and processed ${numTokensFound} tokens`);

  await models.CommunityIndexer.update(
    {
      last_checked: new Date(),
    },
    {
      where: {
        id: 'clanker',
      },
    },
  );
}

main().catch((err) => {
  console.error(err);
  exit(1);
});
