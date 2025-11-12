import { logger } from '@hicommonwealth/core';
import { extractMCPMentions } from '@hicommonwealth/model';
import { models } from '@hicommonwealth/model/db';
import {
  buildMCPClientOptions,
  CommonMCPServerWithHeaders,
  withMCPAuthUsername,
} from '@hicommonwealth/model/services';
import {
  CompletionOptions,
  DEFAULT_COMPLETION_MODEL,
} from '@hicommonwealth/shared';
import { Request, Response } from 'express';
import { OpenAI } from 'openai';
import { config } from '../../config';
import { extractOpenRouterError } from './utils';

// Define a more specific type for the structured prompt
interface StructuredPrompt {
  userPrompt: string;
  systemPrompt?: string;
}

// Define a type for the request body that can handle both string and structured prompt
type RequestBody = Omit<CompletionOptions, 'prompt'> & {
  prompt: string | StructuredPrompt;
  contextualMentions?: boolean;
  communityId?: string;
};

const log = logger(import.meta);

/**
 * Gets all community-enabled MCP servers for a community
 * @param communityId The community ID
 * @returns Array of MCP servers with headers
 */
async function getAllMCPServers(
  communityId: string,
): Promise<CommonMCPServerWithHeaders[]> {
  const mcpServers = await models.MCPServer.scope('withPrivateData').findAll({
    include: [
      {
        model: models.MCPServerCommunity,
        where: { community_id: communityId },
        attributes: [], // Don't include the junction table data in results
      },
      {
        model: models.User,
        as: 'AuthUser',
        attributes: ['id', 'profile'],
        required: false,
      },
    ],
  });

  return mcpServers.map((server) => ({
    ...withMCPAuthUsername(server),
    headers: {}, // Add any necessary headers for authentication
  }));
}

/**
 * Finds MCP servers that are mentioned in the text
 * @param text The text to parse
 * @param allServers All available MCP servers for the community
 * @returns Array of mentioned MCP servers
 */
function findMentionedMCPServers(
  text: string,
  allServers: CommonMCPServerWithHeaders[],
): CommonMCPServerWithHeaders[] {
  const extractedMentions = extractMCPMentions(text);

  if (extractedMentions.length === 0) {
    return [];
  }

  // Match extracted mentions with available servers by handle and id
  return allServers.filter((server) =>
    extractedMentions.some(
      (mention) =>
        mention.handle === server.handle && mention.id === String(server.id),
    ),
  );
}

export const aiCompletionHandler = async (req: Request, res: Response) => {
  const requestId = Math.random().toString(36).substr(2, 9);
  log.info(`[${requestId}] AI completion request started`, {
    model: req.body?.model || DEFAULT_COMPLETION_MODEL,
    stream: req.body?.stream !== false,
    userAgent: req.headers['user-agent'],
    contentLength: req.headers['content-length'],
  });

  try {
    const {
      prompt: initialPrompt,
      systemPrompt: initialSystemPrompt,
      model = DEFAULT_COMPLETION_MODEL,
      temperature,
      maxTokens = 1000,
      stream = true,
      useOpenRouter = false,
      useWebSearch = false,
      communityId,
    } = req.body as RequestBody;

    let finalUserPrompt: string;
    let finalSystemPrompt: string | undefined;

    // Check if initialPrompt is an object with userPrompt and systemPrompt properties
    if (
      typeof initialPrompt === 'object' &&
      initialPrompt !== null &&
      typeof (initialPrompt as StructuredPrompt).userPrompt === 'string'
    ) {
      finalUserPrompt = (initialPrompt as StructuredPrompt).userPrompt;
      // Use systemPrompt from the object if available, otherwise fallback to initialSystemPrompt (top-level)
      finalSystemPrompt =
        (initialPrompt as StructuredPrompt).systemPrompt || initialSystemPrompt;
    } else if (typeof initialPrompt === 'string') {
      // This is the originally expected correct case
      finalUserPrompt = initialPrompt;
      finalSystemPrompt = initialSystemPrompt;
    } else {
      return res.status(400).json({
        error:
          'Invalid prompt format. Prompt must be a string or a structured object.',
      });
    }

    // Validate inputs (now using finalUserPrompt)
    if (!finalUserPrompt) {
      return res.status(400).json({
        error: 'User prompt content is required and could not be determined.',
      });
    }

    // Check for MCP mentions and determine if we should use MCP path
    let useMCPPath = false;
    let mentionedMCPServers: CommonMCPServerWithHeaders[] = [];

    if (communityId) {
      try {
        const allServers = await getAllMCPServers(communityId);
        mentionedMCPServers = findMentionedMCPServers(
          finalUserPrompt,
          allServers,
        );
        useMCPPath = mentionedMCPServers.length > 0;

        if (useMCPPath) {
          const extractedMentions = extractMCPMentions(finalUserPrompt);
          log.info(
            `[${requestId}] MCP path enabled with mentions: ${extractedMentions
              .map((m) => `${m.handle}(${m.id})`)
              .join(', ')}`,
          );
        }
      } catch (mcpError) {
        log.error(`[${requestId}] Error checking MCP servers:`, mcpError);
        // Continue with regular path if MCP check fails
      }
    }

    // MCP path only supports OpenAI, not OpenRouter
    if (
      useMCPPath &&
      (useOpenRouter || config.OPENAI.USE_OPENROUTER === 'true')
    ) {
      return res.status(400).json({
        error: 'MCP features are only available with OpenAI, not OpenRouter',
      });
    }

    // Choose between OpenAI and OpenRouter (unless using MCP path)
    const useOR = useMCPPath
      ? false
      : useOpenRouter || config.OPENAI.USE_OPENROUTER === 'true';
    const apiKey = useOR
      ? config.OPENAI.OPENROUTER_API_KEY
      : config.OPENAI.API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: `${useOR ? 'OpenRouter' : 'OpenAI'} API key not configured`,
      });
    }

    // Model selection logic based on useWebSearch flag
    let modelId: string = model;
    let addOpenAiWebSearchOptions = false;

    if (useOR) {
      // OpenRouter: append :online if web search is enabled
      if (useWebSearch) {
        modelId = `${model}:online`;
      } else {
        modelId = model;
      }
    } else {
      // OpenAI: only gpt-4o or gpt-4o-mini support web search
      if (useWebSearch) {
        if (model === 'gpt-4o') {
          modelId = 'gpt-4o-search-preview';
          addOpenAiWebSearchOptions = true;
        } else if (model === 'gpt-4o-mini') {
          modelId = 'gpt-4o-mini-search-preview';
          addOpenAiWebSearchOptions = true;
        } else {
          return res.status(400).json({
            error:
              'Web search is only supported for gpt-4o and gpt-4o-mini with OpenAI',
          });
        }
      } else {
        modelId = model;
        addOpenAiWebSearchOptions = false;
      }
    }

    // Log the final model, provider, and web search status
    log.info(
      `AI completion request:
      \n modelId=${modelId},
      \n provider=${useOR ? 'OpenRouter' : 'OpenAI'},
      \n webSearch=${!!useWebSearch}
      \n contextualMentions=${!!(finalSystemPrompt && finalSystemPrompt.includes('CONTEXTUAL INFORMATION:'))}`,
    );

    // Initialize client
    const openAIConfig = {
      apiKey,
      ...(useOR && { baseURL: 'https://openrouter.ai/api/v1' }),
      ...(config.OPENAI.ORGANIZATION &&
        !useOR && {
          organization: config.OPENAI.ORGANIZATION,
        }),
    };

    const openai = new OpenAI(openAIConfig);

    // Handle MCP path separately with OpenAI responses API
    if (useMCPPath) {
      log.info(
        `[${requestId}] Using MCP path with ${mentionedMCPServers.length} servers`,
      );

      try {
        // Build MCP client options
        const mcpOptions = buildMCPClientOptions(
          finalUserPrompt,
          mentionedMCPServers,
          null, // no previous response ID for now
        );

        // Override any model settings to ensure consistency
        mcpOptions.model = model || DEFAULT_COMPLETION_MODEL;
        // Note: OpenAI Responses API doesn't support temperature or max_tokens
        // These parameters are controlled by the model's default settings

        // Force streaming for MCP path to match expected behavior
        mcpOptions.stream = true;

        log.info(
          `[${requestId}] Creating MCP response with model: ${mcpOptions.model}`,
        );

        if (stream) {
          // Set proper headers for streaming
          res.setHeader('Content-Type', 'text/plain');
          res.setHeader('Cache-Control', 'no-cache');
          res.setHeader('X-Accel-Buffering', 'no');

          const response = await openai.responses.create(mcpOptions);

          let chunkCount = 0;
          let totalContentLength = 0;

          for await (const event of response) {
            chunkCount++;

            if (event.type === 'response.output_text.delta') {
              const contentToStream = event.delta || '';

              if (contentToStream) {
                totalContentLength += contentToStream.length;

                try {
                  res.write(contentToStream);
                  if (res.flush) res.flush();

                  if (chunkCount % 10 === 0) {
                    log.info(`[${requestId}] MCP streaming progress`, {
                      chunkCount,
                      totalContentLength,
                      lastChunkSize: contentToStream.length,
                    });
                  }
                } catch (writeError) {
                  log.error(
                    `[${requestId}] Error writing MCP chunk ${chunkCount}:`,
                    writeError,
                  );
                  throw writeError;
                }
              }
            }
          }

          log.info(`[${requestId}] MCP streaming completed successfully`, {
            totalChunks: chunkCount,
            totalContentLength,
          });

          res.end();
          return;
        } else {
          // For non-streaming MCP requests, we still need to use the streaming API
          // and collect the full response
          const response = await openai.responses.create(mcpOptions);

          let responseText = '';
          for await (const event of response) {
            if (event.type === 'response.output_text.delta') {
              const deltaText = event.delta || '';
              responseText += deltaText;
            }
          }

          const finalResponse =
            responseText ||
            'I apologize, but I was unable to generate a response.';

          res.json({
            completion: finalResponse,
          });
          return;
        }
      } catch (mcpError) {
        log.error(`[${requestId}] Error in MCP path:`, mcpError);

        if (!res.headersSent) {
          const error = mcpError as Error & { status?: number };
          return res.status(error.status || 500).json({
            error: error.message || 'MCP completion failed',
            status: error.status || 500,
          });
        }

        res.write('\nError during MCP processing');
        res.end();
        return;
      }
    }

    if (stream) {
      log.info(`[${requestId}] Setting up streaming response`);

      // Set proper headers for streaming
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('X-Accel-Buffering', 'no');

      log.info(`[${requestId}] Streaming headers set`, {
        headers: {
          'Content-Type': res.getHeader('Content-Type'),
          'Cache-Control': res.getHeader('Cache-Control'),
          'X-Accel-Buffering': res.getHeader('X-Accel-Buffering'),
        },
      });

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
        if (finalSystemPrompt) {
          messages.push({ role: 'system', content: finalSystemPrompt });
        }
        messages.push({ role: 'user', content: finalUserPrompt });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const streamConfig: OpenAI.Chat.ChatCompletionCreateParamsStreaming = {
          model: modelId,
          messages,
          temperature,
          max_tokens: maxTokens,
          stream: true,
          ...(useOR && {
            extra_headers: {
              'HTTP-Referer': 'https://common.xyz',
              'X-Title': 'Common',
            },
          }),
          ...(!useOR &&
            addOpenAiWebSearchOptions && { web_search_options: {} }),
        };

        log.info(`[${requestId}] Starting OpenAI streaming request`, {
          model: streamConfig.model,
          maxTokens: streamConfig.max_tokens,
          messageCount: messages.length,
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const streamResponse =
          await openai.chat.completions.create(streamConfig);

        log.info(`[${requestId}] OpenAI stream created successfully`);

        let chunkCount = 0;
        let totalContentLength = 0;

        for await (const chunk of streamResponse) {
          chunkCount++;
          const choice = chunk.choices?.[0];

          if (choice) {
            let annotationsFoundInChunk = false;
            // Check for annotations on delta (OpenRouter might put them here)
            if (
              choice.delta &&
              (choice.delta as { annotations?: unknown }).annotations
            ) {
              annotationsFoundInChunk = true;
            }
            // Check for annotations directly on the choice object (less common for streaming delta but good to cover)
            if ((choice as { annotations?: unknown }).annotations) {
              annotationsFoundInChunk = true;
            }
            // If OpenRouter nests a full message object within delta, check there too
            if (
              choice.delta &&
              (choice.delta as { message?: { annotations?: unknown } })
                .message &&
              (choice.delta as { message?: { annotations?: unknown } }).message
                ?.annotations
            ) {
              annotationsFoundInChunk = true;
            }

            if (annotationsFoundInChunk) {
              log.info(
                `[${requestId}] Annotations found in chunk ${chunkCount}`,
              );
            }
          }

          const contentToStream = choice?.delta?.content || '';
          if (contentToStream) {
            totalContentLength += contentToStream.length;

            try {
              res.write(contentToStream);
              if (res.flush) res.flush(); // Force flush for immediate client update

              if (chunkCount % 10 === 0) {
                log.info(`[${requestId}] Streaming progress`, {
                  chunkCount,
                  totalContentLength,
                  lastChunkSize: contentToStream.length,
                });
              }
            } catch (writeError) {
              log.error(
                `[${requestId}] Error writing chunk ${chunkCount}:`,
                writeError,
              );
              throw writeError;
            }
          } else if (chunkCount % 20 === 0) {
            log.info(`[${requestId}] Empty chunk ${chunkCount} received`);
          }
        }

        log.info(`[${requestId}] Streaming completed successfully`, {
          totalChunks: chunkCount,
          totalContentLength,
        });

        res.end();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (streamError: unknown) {
        log.error(
          `[${requestId}] Streaming error occurred:`,
          streamError as Error,
        );

        // Check for OpenRouter-specific error format
        const orError = extractOpenRouterError(streamError);
        if (orError) {
          log.error(
            `[${requestId}] OpenRouter error:`,
            new Error(orError.message),
          );

          if (!res.headersSent) {
            return res.status(orError.code || 500).json({
              error: orError.message,
              metadata: orError.metadata,
            });
          }

          res.write(`\nError: ${orError.message}`);
          return res.end();
        }

        // Handle other errors
        if (!res.headersSent) {
          const error = streamError as Error & { status?: number };
          log.error(`[${requestId}] Unhandled streaming error:`, error);

          return res.status(error.status || 500).json({
            error: error.message || 'Streaming failed',
            status: error.status || 500,
          });
        }

        log.error(
          `[${requestId}] Error during streaming with headers already sent`,
        );
        res.write('\nError during streaming');
        res.end();
      }
    } else {
      // Handle regular response
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
        if (finalSystemPrompt) {
          messages.push({ role: 'system', content: finalSystemPrompt });
        }
        messages.push({ role: 'user', content: finalUserPrompt });

        const completion = await openai.chat.completions.create({
          model: modelId,
          messages,
          temperature,
          max_tokens: maxTokens,
          ...(useOR && {
            extra_headers: {
              'HTTP-Referer': 'https://common.xyz',
              'X-Title': 'Common',
            },
          }),
          ...(!useOR &&
            addOpenAiWebSearchOptions && { web_search_options: {} }),
        });

        // Log the entire first choice message object from the AI
        if (
          completion.choices &&
          completion.choices.length > 0 &&
          completion.choices[0].message
        ) {
          const message = completion.choices[0]
            .message as OpenAI.Chat.ChatCompletionMessage & {
            annotations?: unknown;
          };
          if (message.annotations) {
            // Specifically log annotations if present in the non-streaming message
            // Use index signature access to safely access potential custom 'annotations' field
          }
        }

        const responseText = completion.choices[0]?.message?.content || '';
        const messageForResponse = completion.choices[0]
          ?.message as OpenAI.Chat.ChatCompletionMessage & {
          annotations?: unknown;
        };
        const annotations = messageForResponse?.annotations;

        const responsePayload: { completion: string; annotations?: unknown } = {
          completion: responseText,
        };
        if (annotations) {
          responsePayload.annotations = annotations;
        }
        res.json(responsePayload);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (completionError: unknown) {
        // Check for OpenRouter-specific error format
        const orError = extractOpenRouterError(completionError);
        if (orError) {
          return res.status(orError.code || 500).json({
            error: orError.message,
            metadata: orError.metadata,
          });
        }

        // Handle other errors
        const error = completionError as Error & { status?: number };
        return res.status(error.status || 500).json({
          error: error.message || 'Completion failed',
          status: error.status || 500,
        });
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: unknown) {
    // Extract useful information for the client
    const err = error as Error & { status?: number };
    const statusCode = err.status || 500;
    const errorMessage =
      err.message || 'An error occurred while processing your request';

    log.error(`[${requestId}] Top-level error in aiCompletionHandler:`, err);

    if (!res.headersSent) {
      res.status(statusCode).json({
        error: errorMessage,
        status: statusCode,
      });
    } else {
      log.error(
        `[${requestId}] Cannot send error response - headers already sent`,
      );
    }
  } finally {
    log.info(`[${requestId}] AI completion request ended`);
  }
};
