// run with `pnpm run start-mcp-demo-client`
//
// Required env vars (same as production):
//   SERVER_URL       – public URL of the MCP server (e.g. https://<ngrok>.ngrok.io)
//   MCP_AUTH_TOKEN   – <verified_address>:<secret>

import { config } from '@hicommonwealth/model';
import { models } from '@hicommonwealth/model/db';
import {
  buildMCPClientOptions,
  enrichCommonMCPServer,
  filterServersWithWhitelist,
  withMCPAuthUsername,
  type CommonMCPServerWithHeaders,
} from '@hicommonwealth/model/services';
import OpenAI from 'openai';
import { exit } from 'process';
import * as readline from 'readline';

let rl: readline.Interface | undefined;

function getUserInput(prompt: string): Promise<string> {
  if (!rl) {
    rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }
  return new Promise((resolve) => {
    rl!.question(prompt, (answer) => {
      resolve(answer);
    });
  });
}

const client = new OpenAI({
  apiKey: config.OPENAI.API_KEY,
});

async function getAllServers(): Promise<CommonMCPServerWithHeaders[]> {
  const mcpServers = await models.MCPServer.scope('withPrivateData').findAll({
    include: [
      {
        model: models.User,
        as: 'AuthUser',
        attributes: ['id', 'profile'],
        required: false,
      },
    ],
  });

  const dbServers = mcpServers.map((server) =>
    enrichCommonMCPServer({ ...withMCPAuthUsername(server), headers: {} }),
  );

  // Handle duplicate handles by adding number suffixes
  const handleCounts: Map<string, number> = new Map();
  return dbServers.map((server) => {
    const originalHandle = server.handle;
    const count = handleCounts.get(originalHandle) || 0;
    handleCounts.set(originalHandle, count + 1);
    const finalHandle =
      count > 0 ? `${originalHandle}${count}` : originalHandle;
    return { ...server, handle: finalHandle };
  });
}

async function startChatBot() {
  if (!config.MCP.MCP_AUTH_TOKEN) {
    throw new Error(
      'MCP_AUTH_TOKEN must be set (format: <verified_address>:<api_key>).\n' +
        'The api_key must be a real key from CreateApiKey (not an arbitrary secret).\n' +
        'SERVER_URL must point to the MCP server (e.g. https://<ngrok>.ngrok.io).',
    );
  }

  console.clear();
  console.log(
    '\n👋 Ask me anything about Common communities, threads, or users!',
  );

  const allServers = filterServersWithWhitelist(await getAllServers());
  console.log(`\nAvailable servers:`);
  allServers.forEach((server) => {
    console.log(
      `⭐️ @${server.handle} (${server.name}) => ${server.server_url}\n`,
    );
  });

  let previousResponseId: string | null = null;

  while (true) {
    try {
      const userInput = await getUserInput('➡️  You: ');

      if (userInput.toLowerCase().trim() === 'exit') {
        console.log('👋 Goodbye!');
        break;
      }

      const options = buildMCPClientOptions(
        userInput,
        allServers,
        previousResponseId,
      );
      const resp = await client.responses.create(options);

      process.stdout.write('✅ Assistant: ');

      for await (const event of resp) {
        if (event.type === 'response.output_text.delta') {
          const deltaText = event.delta || '';
          process.stdout.write(deltaText);
        } else if (event.type === 'response.completed') {
          previousResponseId = event.response?.id || null;
        }
      }

      console.log('');
    } catch (error: unknown) {
      const err = error as Error;
      console.error('❌ Error:', err.message);
    }
  }

  rl?.close();
}

startChatBot().catch((error) => {
  console.error('Fatal error:', error);
  rl?.close();
  exit(1);
});
