import { config } from '@hicommonwealth/model';
import OpenAI from 'openai';
const client = new OpenAI({
  apiKey: config.OPENAI.API_KEY,
});

const resp = await client.responses.create({
  model: 'gpt-4.1',
  tools: [
    {
      type: 'mcp',
      server_label: 'commonwealth',
      server_url: `${process.env.MCP_SERVER_URL}/mcp`,
      require_approval: 'never',
    },
  ],
  input: 'What are the newest 5 communities on Commonwealth?',
});

console.log(JSON.stringify(resp, null, 2));

console.log(resp.output_text);
