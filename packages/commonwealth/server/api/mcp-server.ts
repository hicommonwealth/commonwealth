import { Actor, logger } from '@hicommonwealth/core';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListResourceTemplatesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import cors from 'cors';
import express, { Request, Response } from 'express';
import { IncomingMessage } from 'http';
import { z, ZodType } from 'zod';
import {
  api as externalApi,
  trpcRouter as externalTrpcRouter,
} from './external-router';
import { apiKeyAuthMiddleware } from './external-router-middleware';

const log = logger(import.meta);

type CommonMCPTool<T extends z.ZodType = z.ZodType> = {
  name: string;
  description: string;
  inputSchema: T;
  outputSchema?: z.ZodType;
  fn: (token: string | null, input: z.infer<T>) => Promise<unknown>;
};

// map external trpc router procedures to MCP tools
export const buildMCPTools = (): Array<CommonMCPTool> => {
  const procedures = Object.keys(externalApi) as Array<
    keyof typeof externalApi
  >;
  const tools = procedures.map((key) => {
    const procedure = externalApi[key];
    const inputSchema = procedure._def.inputs[0] as ZodType;
    if (!inputSchema) {
      throw new Error(`No input schema for ${key}`);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const outputSchema = (procedure._def as any).output as ZodType | undefined;
    return {
      name: key,
      description: inputSchema.description || '',
      inputSchema,
      outputSchema,
      fn: async (token: string | null, input: z.infer<typeof inputSchema>) => {
        const [address, apiKey] = token?.split(':') || [];

        if (!address || !apiKey) {
          throw new Error(
            'MCP tool auth requires Authorization header with Bearer <address>:<apiKey>',
          );
        }

        // build request and response objects to pass to the middleware
        const req = {
          headers: {
            address,
            'x-api-key': apiKey,
          },
          path: `/${key}`,
        } as unknown as Request;

        const res = {} as Response;

        // authenticate via real API key — no bypass
        let err: Error | null = null;
        await apiKeyAuthMiddleware(req, res, (error?: unknown) => {
          if (error) {
            err = error as Error;
          }
        });
        if (err) {
          log.error(`MCP tool auth failed for ${key}:`, err);
          throw err;
        }

        if (!req.user) {
          throw new Error('User not authenticated');
        }

        // trigger trpc procedure pipeline
        const trpcCaller = externalTrpcRouter.createCaller({
          req,
          res,
          actor: {
            user: req.user as Actor['user'],
            address: req.headers['address'] as string,
          },
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return await (trpcCaller as any)[key](input);
      },
    };
  });

  // Per-tool MCP overrides: strip fields that shouldn't be exposed to LLM callers
  const getThreadsTool = tools.find((t) => t.name === 'getThreads');
  if (getThreadsTool) {
    getThreadsTool.inputSchema = (
      getThreadsTool.inputSchema as z.ZodObject<z.ZodRawShape>
    )
      .omit({ stage: true, contestAddress: true, status: true })
      .describe(
        'Search and list threads in a community with filtering and sorting.',
      );
    getThreadsTool.description = getThreadsTool.inputSchema.description || '';
  }

  return tools;
};

const createMCPServer = (tools: CommonMCPTool[]): Server => {
  const toolsMap = tools.reduce(
    (acc, tool) => {
      acc[tool.name] = tool;
      return acc;
    },
    {} as Record<string, CommonMCPTool>,
  );

  const mcpServer = new Server(
    {
      name: 'Common MCP Server',
      version: '0.0.1',
    },
    {
      capabilities: {
        resources: {},
        tools: {},
      },
    },
  );

  const toJsonSchema = (schema: z.ZodType) =>
    z.toJSONSchema(schema, {
      unrepresentable: 'any',
      override: ({ zodSchema, jsonSchema }) => {
        if (zodSchema instanceof z.ZodDate) {
          jsonSchema.type = 'string';
        }
      },
    });

  mcpServer.setRequestHandler(ListToolsRequestSchema, () => {
    return {
      tools: tools.map((tool) => {
        let outputSchema: Record<string, unknown> | undefined;
        if (tool.outputSchema) {
          const json = toJsonSchema(tool.outputSchema);
          // MCP protocol requires outputSchema to have type "object"
          if (json.type === 'object') {
            outputSchema = json;
          }
        }
        return {
          name: tool.name,
          description: tool.description,
          inputSchema: toJsonSchema(tool.inputSchema),
          ...(outputSchema ? { outputSchema } : {}),
        };
      }),
    };
  });

  mcpServer.setRequestHandler(CallToolRequestSchema, async (request, extra) => {
    const { name, arguments: args } = request.params;

    if (!(name in toolsMap)) {
      return {
        content: [
          {
            type: 'text',
            text: `Unknown tool: ${name}`,
          },
        ],
        isError: true,
      };
    }

    try {
      const validatedArgs = toolsMap[name].inputSchema.parse(args);
      const result = await toolsMap[name].fn(
        extra?.authInfo?.token || null,
        validatedArgs,
      );
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      log.error(`Error executing tool ${name}:`, error);
      return {
        content: [
          {
            type: 'text',
            text: `Error executing tool ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  });

  mcpServer.setRequestHandler(ListResourceTemplatesRequestSchema, () => {
    return {
      resourceTemplates: [],
    };
  });

  mcpServer.setRequestHandler(ListResourcesRequestSchema, () => {
    return {
      resources: [],
    };
  });

  mcpServer.setRequestHandler(ReadResourceRequestSchema, (request) => {
    throw new Error(`Unknown resource: ${request.params.uri}`);
  });

  return mcpServer;
};

const unsupportedMethodHandler = (req: Request, res: Response) => {
  res.status(405).json({
    jsonrpc: '2.0',
    error: {
      code: -32000,
      message: 'Method not allowed.',
    },
    id: null,
  });
};

export function buildMCPRouter() {
  const tools = buildMCPTools();

  log.info(`Initializing MCP server with ${tools.length} tools`);

  const mcpServer = createMCPServer(tools);

  const router = express.Router();

  // allow all origins
  router.use(
    cors({
      origin: '*',
      methods: ['GET', 'POST', 'DELETE'],
      allowedHeaders: ['Authorization'],
    }),
  );

  // Handle MCP requests (POST for JSON-RPC, GET for SSE streams)
  const handleMCPRequest = async (req: Request, res: Response) => {
    try {
      const authHeader =
        req.headers['authorization'] || req.headers['Authorization'];
      const authToken = authHeader?.toString().split(' ')[1] ?? null;

      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
      });

      // eslint-disable-next-line
      res.on('close', async () => {
        await transport.close();
      });
      await mcpServer.connect(transport);

      if (authToken) {
        (req as IncomingMessage & { auth?: { token: string } }).auth = {
          token: authToken,
        };
      }
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
  };

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  router.post('/', handleMCPRequest);
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  router.get('/', handleMCPRequest);

  // handle unsupported methods
  router.put('/', unsupportedMethodHandler);
  router.delete('/', unsupportedMethodHandler);

  return router;
}

const PATH = '/mcp';
const router = buildMCPRouter();

export { PATH, router };
