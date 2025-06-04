#!/usr/bin/env node

import { dispose, logger } from '@hicommonwealth/core';
import { models } from '@hicommonwealth/model';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListResourceTemplatesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import express, { Request, Response } from 'express';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

const log = logger(import.meta);

const FetchNewCommunitiesSchema = z.object({
  limit: z
    .number()
    .int()
    .max(50)
    .optional()
    .default(10)
    .describe('Number of communities to fetch per page'),
});

enum ToolName {
  FETCH_COMMUNITIES = 'fetch_new_communities',
}

const server = new Server(
  {
    name: 'Common MCP Server',
    version: '0.0.1',
  },
  {
    capabilities: {
      resources: {},
      tools: {
        fetch_new_communities: {
          description: 'Fetch the newest communities on Common',
          inputSchema: zodToJsonSchema(FetchNewCommunitiesSchema) as any,
        },
      },
    },
  },
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  const tools: Tool[] = [
    {
      name: ToolName.FETCH_COMMUNITIES,
      description: 'Fetch communities from Common',
      inputSchema: zodToJsonSchema(FetchNewCommunitiesSchema) as any,
    },
  ];
  return { tools };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === ToolName.FETCH_COMMUNITIES) {
    try {
      const validatedArgs = FetchNewCommunitiesSchema.parse(args);
      log.info('Fetching communities with params:', validatedArgs);

      const communities = await models.Community.findAll({
        limit: validatedArgs.limit || 5,
        order: [['created_at', 'DESC']],
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(communities, null, 2),
          },
        ],
      };
    } catch (error) {
      log.error('Error fetching communities:', error);
      return {
        content: [
          {
            type: 'text',
            text: `Error fetching communities: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  }

  throw new Error(`Unknown tool: ${name}`);
});

server.setRequestHandler(ListResourceTemplatesRequestSchema, async () => {
  return {
    resourceTemplates: [],
  };
});

server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: 'commonwealth://server/info',
        name: 'Server Info',
        description: 'Information about the Commonwealth MCP Server',
        mimeType: 'application/json',
      },
    ],
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri;

  if (uri === 'commonwealth://server/info') {
    return {
      contents: [
        {
          uri: uri,
          text: JSON.stringify(
            {
              name: 'Commonwealth MCP Server',
              version: '1.0.0',
              description:
                'An MCP server that provides access to Commonwealth community data',
              tools: [
                {
                  name: 'fetch_new_communities',
                  description:
                    'Fetch all communities with optional filtering and pagination',
                },
              ],
            },
            null,
            2,
          ),
        },
      ],
    };
  }

  throw new Error(`Unknown resource: ${uri}`);
});

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  next();
});

app.post('/mcp', async (req: Request, res: Response) => {
  try {
    log.info('Received MCP POST request');

    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });

    res.on('close', () => {
      transport.close();
    });

    await server.connect(transport);

    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    log.error('Error handling MCP request:', error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal server error',
        },
        id: null,
      });
    }
  }
});

app.get('/mcp', async (req: Request, res: Response) => {
  res.status(405).json({
    jsonrpc: '2.0',
    error: {
      code: -32000,
      message: 'Method not allowed.',
    },
    id: null,
  });
});

app.delete('/mcp', async (req: Request, res: Response) => {
  res.status(405).json({
    jsonrpc: '2.0',
    error: {
      code: -32000,
      message: 'Method not allowed.',
    },
    id: null,
  });
});

app.get('/health', (req, res) => {
  if (!res.headersSent) {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
    });
  }
});

app.post('/shutdown', (req, res) => {
  if (!res.headersSent) {
    res.status(200).end('Server shutting down');
    setTimeout(() => {
      process.kill(process.pid, 'SIGTERM');
    }, 1000);
  }
});

async function main() {
  try {
    log.info('Starting Commonwealth MCP Server...');

    const PORT = process.env.PORT || 9000;
    app.listen(PORT, () => {
      log.info(
        `Commonwealth MCP Server is running on http://localhost:${PORT}`,
      );
      log.info('/mcp - Main MCP protocol endpoint');
    });
  } catch (error) {
    log.error('Failed to start MCP server:', error);
    throw new Error(
      `Failed to start MCP server: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

process.on('SIGINT', async () => {
  log.info('Received SIGINT, shutting down gracefully...');
  await dispose()('EXIT', true);
  log.info('Server shutdown complete');
});

process.on('SIGTERM', async () => {
  log.info('Received SIGTERM, shutting down gracefully...');
  await dispose()('EXIT', true);
  log.info('Server shutdown complete');
});

process.on('uncaughtException', async (error) => {
  log.error('Uncaught exception:', error);
  await dispose()('ERROR', true);
  throw error;
});

process.on('unhandledRejection', async (reason: unknown) => {
  const error = reason instanceof Error ? reason : new Error(String(reason));
  log.error('Unhandled rejection:', error);
  await dispose()('ERROR', true);
  throw error;
});

main().catch(async (error) => {
  log.error('Failed to start server:', error);
  await dispose()('ERROR', true);
  throw error;
});
