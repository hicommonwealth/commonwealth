import { config } from '@hicommonwealth/model';
import { delay } from '@hicommonwealth/shared';
import OpenAI from 'openai';
import { exit } from 'process';
import * as readline from 'readline';

// run with `pnpm run start-mcp-demo-client`

const help = `
MCP_DEMO_CLIENT_SERVER_URL must be set to the (ngrok) URL of the MCP server, just the domain.
MCP_DEMO_CLIENT_KEY must be set to the key of the MCP server in format <address>:<api-key>.

Example:
MCP_DEMO_CLIENT_SERVER_URL=my-mcp-server.ngrok.io
MCP_DEMO_CLIENT_KEY=0x1234567890:myApiKey
`;

const { MCP_DEMO_CLIENT_SERVER_URL, MCP_DEMO_CLIENT_KEY } = config.MCP;
if (!MCP_DEMO_CLIENT_SERVER_URL || !MCP_DEMO_CLIENT_KEY) {
  console.log(help);
  exit(1);
}

const serverUrl = `https://${MCP_DEMO_CLIENT_SERVER_URL}/mcp`;

const client = new OpenAI({
  apiKey: config.OPENAI.API_KEY,
});

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
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

// Main chat loop
async function startChatBot() {
  // wait for warning message to be printed
  await delay(1000);

  console.clear();

  console.log('🤖 Commonwealth AI Chatbot started! Type "exit" to quit.\n');
  console.log(
    'Ask me anything about Commonwealth communities, threads, or users!\n',
  );

  while (true) {
    try {
      // Get user input
      const userInput = await getUserInput('You: ');

      // Check for exit condition
      if (userInput.toLowerCase().trim() === 'exit') {
        console.log('👋 Goodbye!');
        break;
      }

      console.log('🤔 Thinking...\n');

      // Make request to OpenAI Responses API with MCP tools
      const resp = await client.responses.create({
        model: 'gpt-4.1',
        tools: [
          {
            type: 'mcp',
            server_label: 'commonwealth',
            server_url: serverUrl,
            require_approval: 'never',
            headers: {
              Authorization: `Bearer ${MCP_DEMO_CLIENT_KEY}`,
            },
          },
        ],
        input: userInput,
        previous_response_id: previousResponseId,
      });

      // Update the previous response ID for next iteration
      previousResponseId = resp.id;

      // Display the response
      console.log(
        `🤖 Assistant: ${(resp as any).output_text || (resp as any).output}\n`,
      );

      // Handle any tool calls if present in the response
      if ((resp as any).items) {
        const toolCalls = (resp as any).items.filter(
          (item: any) => item.type === 'mcp_tool_call',
        );
        if (toolCalls.length > 0) {
          console.log('🔧 Tool calls made:', toolCalls.length);
        }
      }
    } catch (error: any) {
      console.error('❌ Error:', error?.message || error);
      console.log('Please try again.\n');

      // If there's an authentication or server error, show more details
      if (error?.status === 401) {
        console.log('Check your OpenAI API key and MCP server credentials.\n');
      } else if (error?.status === 404) {
        console.log("Check your MCP server URL and ensure it's accessible.\n");
      }
    }
  }

  rl.close();
}

// Start the chatbot
startChatBot().catch((error) => {
  console.error('Fatal error:', error);
  rl.close();
  exit(1);
});
