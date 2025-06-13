import { config, models } from '@hicommonwealth/model';
import { MCPServer } from '@hicommonwealth/schemas';
import OpenAI from 'openai';
import { exit } from 'process';
import * as readline from 'readline';
import { z } from 'zod';

// run with `pnpm run start-mcp-demo-client`

type Server = z.infer<typeof MCPServer> & {
  headers?: Record<string, string>;
};

const demoHelp = `
MCP_DEMO_CLIENT_SERVER_URL must be set to the (ngrok) URL of the MCP server, just the domain.
MCP_KEY_BYPASS must be set to the key of the MCP server in format <address>:<api-key>.

Example:
MCP_DEMO_CLIENT_SERVER_URL=my-mcp-server.ngrok.io
MCP_KEY_BYPASS=0x1234567890:myApiKey
`;

const { MCP_DEMO_CLIENT_SERVER_URL, MCP_KEY_BYPASS } = config.MCP;

const client = new OpenAI({
  apiKey: config.OPENAI.API_KEY,
});

// Conversation history - using OpenAI's Responses API format
let previousResponseId: string | undefined = undefined;

// Function to get user input
function getUserInput(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer);
    });
  });
}

let rl: readline.Interface;

async function getAllServers(): Promise<Server[]> {
  const dbServers = (await models.MCPServer.findAll()).filter(
    (server) => server.id !== 1, // exclude common prod server
  );
  const allServers: Server[] = [
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
  // add local MCP server if env vars are set
  if (!MCP_DEMO_CLIENT_SERVER_URL || !MCP_KEY_BYPASS) {
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

  rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  while (true) {
    try {
      const userInput = await getUserInput('➡️  You: ');

      if (userInput.toLowerCase().trim() === 'exit') {
        console.log('👋 Goodbye!');
        break;
      }

      // Create system prompt explaining MCP server handles
      const systemPrompt = `You are an AI assistant with access to MCP (Model Context Protocol) servers that provide tools for interacting with Commonwealth communities, threads, users and more.

Available MCP servers and their mention handles:
${allServers.map((server) => `- @${server.handle}: ${server.name} - ${server.description}`).join('\n')}

When a user mentions a server handle prefixed with @ (e.g., @common), you should use the MCP tools from that specific server to help answer their question. Multiple servers can be mentioned in a single message.

If no specific server is mentioned, you can provide general assistance based on your knowledge, but you won't have access to real-time data from the MCP servers.

Always use the appropriate MCP tools when available to provide accurate, up-to-date information about Commonwealth communities, threads, users, and other relevant data.`;

      const resp = await client.responses.create({
        model: 'gpt-4o-mini',
        instructions: systemPrompt,
        tools: allServers.map((server) => ({
          type: 'mcp',
          server_label: server.handle!,
          server_url: server.server_url!,
          require_approval: 'never',
          headers: server.headers,
        })),
        input: userInput,
        previous_response_id: previousResponseId,
        stream: true,
      });

      // Handle streaming response
      process.stdout.write('✅ Assistant: ');
      let fullOutput = '';
      let responseId = '';

      for await (const event of resp) {
        if (event.type === 'response.output_text.delta') {
          const deltaText = event.delta || '';
          process.stdout.write(deltaText);
          fullOutput += deltaText;
        } else if (event.type === 'response.completed') {
          responseId = event.response?.id || '';
        }
      }

      // Update the previous response ID for next iteration
      previousResponseId = responseId;
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
