// run with `pnpm run start-mcp-demo-client`

import {
  CommonMCPServerWithHeaders,
  buildMCPClientOptions,
  config,
} from '@hicommonwealth/model';
import { models } from '@hicommonwealth/model/db';
import OpenAI from 'openai';
import { exit } from 'process';
import * as readline from 'readline';

const demoHelp = `
MCP_DEMO_CLIENT_SERVER_URL must be set to the (ngrok) URL of the MCP server, just the domain.
MCP_KEY_BYPASS must be set to the key of the MCP server in format <address>:<api-key>.

Example:
MCP_DEMO_CLIENT_SERVER_URL=my-mcp-server.ngrok.io
MCP_KEY_BYPASS=0x1234567890:myApiKey
`;

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

const { MCP_DEMO_CLIENT_SERVER_URL, MCP_KEY_BYPASS } = config.MCP;

const client = new OpenAI({
  apiKey: config.OPENAI.API_KEY,
});

export async function getAllServers(): Promise<CommonMCPServerWithHeaders[]> {
  const dbServers = (await models.MCPServer.findAll()).filter(
    (server) => server.id !== 1, // exclude common prod server
  );
  const allServers: CommonMCPServerWithHeaders[] = [
    {
      id: 0,
      name: 'Common MCP Server',
      description: 'Common MCP Server',
      source: 'common',
      server_url: `https://${MCP_DEMO_CLIENT_SERVER_URL}/mcp`,
      handle: 'common',
      headers: {
        Authorization: `Bearer ${MCP_KEY_BYPASS}`,
      },
    },
    ...dbServers,
  ];
  return allServers;
}

async function startChatBot() {
  if (!config.MCP.MCP_DEMO_CLIENT_SERVER_URL || !config.MCP.MCP_KEY_BYPASS) {
    throw new Error(demoHelp);
  }

  console.clear();
  console.log(
    '\n👋 Ask me anything about Common communities, threads, or users!',
  );

  const allServers = await getAllServers();
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
