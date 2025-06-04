import { logger } from '@hicommonwealth/core';
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

export function buildMCPRouter() {
  // Input validation schema for fetching communities
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

  // Initialize the MCP server
  const mcpServer = new Server(
    {
      name: 'Commonwealth MCP Server',
      version: '0.0.1',
    },
    {
      capabilities: {
        resources: {},
        tools: {
          fetch_new_communities: {
            description: 'Fetch the newest communities on Commonwealth',
            inputSchema: zodToJsonSchema(FetchNewCommunitiesSchema) as any,
          },
        },
      },
    },
  );

  // Handle tool listing requests
  mcpServer.setRequestHandler(ListToolsRequestSchema, async () => {
    const tools: Tool[] = [
      {
        name: ToolName.FETCH_COMMUNITIES,
        description: 'Fetch communities from Commonwealth',
        inputSchema: zodToJsonSchema(FetchNewCommunitiesSchema) as any,
      },
    ];
    return { tools };
  });

  // Handle tool execution requests
  mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    if (name === ToolName.FETCH_COMMUNITIES) {
      try {
        const validatedArgs = FetchNewCommunitiesSchema.parse(args);
        log.info('Fetching communities with params:', validatedArgs);

        const communities = await models.Community.findAll({
          limit: validatedArgs.limit || 10,
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

  // Handle resource template listing
  mcpServer.setRequestHandler(ListResourceTemplatesRequestSchema, async () => {
    return {
      resourceTemplates: [],
    };
  });

  // Handle resource listing
  mcpServer.setRequestHandler(ListResourcesRequestSchema, async () => {
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

  // Handle resource reading
  mcpServer.setRequestHandler(ReadResourceRequestSchema, async (request) => {
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

  const router = express.Router();

  // allow all origins
  router.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }
    next();
  });

  // handle post requests
  router.post('/', async (req: Request, res: Response) => {
    try {
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
      });
      res.on('close', () => {
        transport.close();
      });
      await mcpServer.connect(transport);
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

  // handle unsupported methods
  router.get('/', async (req: Request, res: Response) => {
    res.status(405).json({
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: 'Method not allowed.',
      },
      id: null,
    });
  });

  // handle delete requests
  router.delete('/', async (req: Request, res: Response) => {
    res.status(405).json({
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: 'Method not allowed.',
      },
      id: null,
    });
  });

  return router;
}

const PATH = '/mcp';
const router = buildMCPRouter();

export { PATH, router };
