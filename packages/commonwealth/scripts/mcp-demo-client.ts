import { config, models } from '@hicommonwealth/model';
import { MCPServer } from '@hicommonwealth/schemas';
import { delay } from '@hicommonwealth/shared';
import inquirer from 'inquirer';
import OpenAI from 'openai';
import { exit } from 'process';
import * as readline from 'readline';
import { z } from 'zod';

// run with `pnpm run start-mcp-demo-client`

const demoHelp = `
MCP_DEMO_CLIENT_SERVER_URL must be set to the (ngrok) URL of the MCP server, just the domain.
MCP_DEMO_CLIENT_KEY must be set to the key of the MCP server in format <address>:<api-key>.

Example:
MCP_DEMO_CLIENT_SERVER_URL=my-mcp-server.ngrok.io
MCP_DEMO_CLIENT_KEY=0x1234567890:myApiKey
`;

const { MCP_DEMO_CLIENT_SERVER_URL, MCP_DEMO_CLIENT_KEY } = config.MCP;

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

// Function to display server selection menu using inquirer
async function selectServers(
  availableServers: z.infer<typeof MCPServer>[],
): Promise<z.infer<typeof MCPServer>[]> {
  console.clear();
  console.log('🤖 Commonwealth AI Chatbot - Server Selection\n');
  const { selectedServers } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'selectedServers',
      message: 'Select one or more servers:',
      choices: availableServers.map((server, idx) => ({
        name: server.name + ' (' + server.server_url + ')',
        value: idx,
        checked: false, // check no servers by default
      })),
      validate: (answer) => {
        console.log('ANSWER');
        if (answer.length === 0) {
          return 'You must select at least one server';
        }
        return true;
      },
    },
  ]);
  return selectedServers.map((idx: number) => availableServers[idx]);
}

let rl: readline.Interface;

async function startChatBot() {
  await delay(1000);

  const availableServers: z.infer<typeof MCPServer>[] = [];

  // add local MCP server if env vars are set
  if (MCP_DEMO_CLIENT_SERVER_URL && MCP_DEMO_CLIENT_KEY) {
    availableServers.push({
      id: 0,
      name: 'Local MCP Server',
      description: 'Local MCP Server',
      source: 'local',
      server_url: `https://${MCP_DEMO_CLIENT_SERVER_URL}/mcp`,
      handle: MCP_DEMO_CLIENT_KEY,
    });
  }

  const dbServers = (await models.MCPServer.findAll()).filter(
    (server) => server.id !== 1, // exclude common prod server
  );
  availableServers.push(...dbServers);

  const selectedServers = await selectServers(availableServers);

  console.clear();
  console.log(
    `🤖 Common AI Chatbot started! Connected to ${selectedServers.length} servers:\n`,
  );
  selectedServers.forEach((server) => {
    console.log(`- ${server.name} (${server.server_url})`);
  });
  console.log(
    '\n\nAsk me anything about Common communities, threads, or users!\n\n',
  );

  rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  while (true) {
    try {
      const userInput = await getUserInput('You: ');

      if (userInput.toLowerCase().trim() === 'exit') {
        console.log('👋 Goodbye!');
        break;
      }

      console.log('\n\n🤔 Thinking...\n\n');

      console.log(JSON.stringify(selectedServers, null, 2));

      const resp = await client.responses.create({
        model: 'gpt-4o-mini',
        tools: selectedServers.map((server) => ({
          type: 'mcp',
          server_label: server.handle!,
          server_url: server.server_url!,
          require_approval: 'never',
          headers:
            server.id === 0
              ? {
                  Authorization: `Bearer ${server.handle || MCP_DEMO_CLIENT_KEY}`,
                }
              : undefined,
        })),
        input: userInput,
        previous_response_id: previousResponseId,
      });

      // Update the previous response ID for next iteration
      previousResponseId = resp.id;

      console.log(`🤖 Assistant: ${resp.output_text || resp.output}\n`);
    } catch (error: unknown) {
      const err = error as Error;
      console.error('❌ Error:', err.message);
      console.log('Please try again.\n');
    }
  }

  rl?.close();
}

startChatBot().catch((error) => {
  console.error('Fatal error:', error);
  rl?.close();
  exit(1);
});
