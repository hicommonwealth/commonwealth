import { logger } from '@hicommonwealth/core';
import { models } from '@hicommonwealth/model/db';
import { QueryTypes } from 'sequelize';
import { config } from '../server/config';

const log = logger(import.meta);

interface DlqSummary {
  consumer: string;
  event_name: string;
  reason: string;
  count: number;
  first_failure: Date;
  last_failure: Date;
}

function formatSlackDate(d: Date): string {
  const ts = Math.floor(new Date(d).getTime() / 1000);
  return `<!date^${ts}^{date_short_pretty}|${d.toISOString().substring(0, 10)}>`;
}

async function sendToSlack(results: DlqSummary[]) {
  // group by consumer
  const grouped = results.reduce<Record<string, DlqSummary[]>>((acc, r) => {
    acc[r.consumer] = acc[r.consumer] || [];
    acc[r.consumer].push(r);
    return acc;
  }, {});

  const allBlocks: any[] = [
    {
      type: 'section',
      text: { type: 'mrkdwn', text: '*DLQ Event Summary*' },
    },
    { type: 'divider' },
  ];

  for (const [consumer, events] of Object.entries(grouped)) {
    // build a table header
    let table = `*${consumer}*\n`;
    table += '```';
    table +=
      '\nEvent                           Count   First           Last            ';
    table +=
      '\n------------------------------------------------------------------------';
    for (const e of events) {
      const first = formatSlackDate(new Date(e.first_failure));
      const last = formatSlackDate(new Date(e.last_failure));
      table += `${e.event_name.padEnd(32)}${String(e.count).padEnd(8)}${first.padEnd(16)} ${last.padEnd(16)}}\n`;
    }
    table += '```';

    allBlocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: table },
    });
    allBlocks.push({ type: 'divider' });
  }

  const webhookUrl = config.SLACK.CHANNELS.ALL_ENG;
  if (!webhookUrl) {
    log.error(
      'SLACK_WEBHOOK_URL_ALL_ENG is not set in the configuration. Cannot send Slack message.',
    );
    return;
  }

  const chunkSize = 25;
  for (let i = 0; i < allBlocks.length; i += chunkSize) {
    const chunk = allBlocks.slice(i, i + chunkSize);
    const payload = {
      text: 'DLQ Event Summary', // fallback
      blocks: chunk,
    };

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        log.info(
          `Successfully sent DLQ summary chunk ${i / chunkSize + 1} to Slack.`,
        );
      } else {
        const responseBody = await response.text();
        log.error(
          `Error sending message to Slack: ${response.statusText} - ${responseBody}`,
        );
      }
    } catch (error) {
      log.error('Error sending message to Slack:', error);
    }
  }
}

async function main() {
  log.info('Analyzing DLQ events...');
  try {
    const sql = `
      SELECT
        consumer,
        event_name,
        reason,
        COUNT(event_id)::int as count,
        MIN(created_at) as first_failure,
        MAX(created_at) as last_failure
      FROM "Dlq"
      GROUP BY consumer, event_name, reason
      ORDER BY count DESC;
    `;

    const results = await models.sequelize.query<DlqSummary>(sql, {
      type: QueryTypes.SELECT,
    });

    if (results.length === 0) {
      log.info('DLQ table is empty.');
      return;
    }

    await sendToSlack(results);
  } catch (error) {
    log.error('Error analyzing DLQ table:', error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    log.error(err);
    process.exit(1);
  });
