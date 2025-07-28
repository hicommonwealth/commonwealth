import { z } from 'zod';
import { AuthContext } from '../context';

export const CreateKlavisMCPInstance = {
  input: z.object({
    community_id: z
      .string()
      .describe('The ID of the community to create the MCP server for'),
    serverType: z
      .enum(['Google Sheets'])
      .describe('The type of MCP server to create'),
    original_url: z
      .string()
      .url()
      .describe('The original page URL of the user'),
  }),
  output: z.object({
    serverUrl: z
      .string()
      .describe('The URL of the created MCP server instance'),
    instanceId: z
      .string()
      .describe('The unique identifier for the created instance'),
    oauthUrl: z.string().describe('The OAuth URL for user authentication'),
  }),
  context: AuthContext,
};

export const KlavisOAuthCallback = {
  input: z.object({
    instanceId: z.string().describe('The unique identifier for the instance'),
  }),
  output: z.void(),
};
