import { command, logger } from '@hicommonwealth/core';
import { Comment, Community } from '@hicommonwealth/model';
import { models } from '@hicommonwealth/model/db';
import { systemActor } from '@hicommonwealth/model/middleware';
import {
  AICompletionType,
  buildContextFromEntityIds,
  buildMCPClientOptions,
  CommonMCPServerWithHeaders,
  formatContextForPrompt,
  generateCommentPrompt,
  generatePollPrompt,
  generateThreadPrompt,
  getBotUser,
  StructuredPrompt,
  withMCPAuthUsername,
} from '@hicommonwealth/model/services';
import {
  CompletionModel,
  DEFAULT_COMPLETION_MODEL,
} from '@hicommonwealth/shared';
import { Request, Response } from 'express';
import { OpenAI } from 'openai';
import { config } from '../../config';
import { extractOpenRouterError } from './utils';

const DEFAULT_TOKEN_EXPIRATION_MINUTES = 60; // 1 hour (for audit token record)

interface AICommentCreationResult {
  success: boolean;
  commentId?: number;
  error?: string;
}

/**
 * Creates an AI-generated comment as the bot user
 * This handles: getting bot user, joining community if needed, creating the comment, and storing the token
 */
async function createAIComment(
  userId: number,
  communityId: string,
  threadId: number,
  parentCommentId: number,
  content: string,
): Promise<AICommentCreationResult> {
  try {
    // Calculate expiration time for token record
    const expires_at = new Date();
    expires_at.setMinutes(
      expires_at.getMinutes() + DEFAULT_TOKEN_EXPIRATION_MINUTES,
    );

    // Create the token record first (for audit trail)
    const tokenRecord = await models.AICompletionToken.create({
      user_id: userId,
      community_id: communityId,
      thread_id: threadId,
      parent_comment_id: parentCommentId,
      content,
      expires_at,
    });

    // Get the bot user with address
    const botUserData = await getBotUser();
    if (!botUserData) {
      log.error('Bot user not found for AI comment creation');
      return { success: false, error: 'Bot user not configured' };
    }
    const { user: botUser, address: botUserAddress } = botUserData;

    // Find the bot user's address in the specific community
    let botAddress = await models.Address.findOne({
      where: {
        user_id: botUser.id,
        community_id: communityId,
      },
    });

    if (!botAddress) {
      // Join community using the bot's primary address
      const botActor = systemActor({
        address: botUserAddress.address,
        id: botUser.id!,
        email: botUser.email || 'ai-bot@common.xyz',
      });

      await command(Community.JoinCommunity(), {
        actor: botActor,
        payload: { community_id: communityId },
      });

      // Fetch the newly created address
      botAddress = await models.Address.findOne({
        where: {
          user_id: botUser.id,
          community_id: communityId,
        },
      });

      if (!botAddress) {
        log.error(`Failed to create bot address in community: ${communityId}`);
        return { success: false, error: 'Failed to join community as bot' };
      }
    }

    // Create comment as bot user
    const result = await command(Comment.CreateComment(), {
      actor: {
        user: {
          id: botUser.id!,
          email: botUser.email!,
        },
        address: botAddress.address,
      },
      payload: {
        thread_id: threadId,
        parent_id: parentCommentId,
        body: content,
      },
    });

    // Mark the token as used and store the comment_id
    await models.AICompletionToken.update(
      { used_at: new Date(), comment_id: result!.id },
      { where: { id: tokenRecord.id } },
    );

    log.info('AI comment created successfully', {
      commentId: result!.id,
      tokenId: tokenRecord.id,
    });

    return { success: true, commentId: result!.id };
  } catch (error) {
    log.error('Failed to create AI comment', error as Error);
    return { success: false, error: 'Failed to create AI comment' };
  }
}

/**
 * Request body for AI completion - uses entity IDs for secure context building
 */
interface AICompletionRequestBody {
  // Required
  communityId: string;
  completionType: AICompletionType;

  // Entity IDs for context building (verified server-side)
  // Thread ID is inferred from the parent comment's thread
  parentCommentId?: number;
  topicId?: number;

  // Model configuration
  model?: CompletionModel;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  useOpenRouter?: boolean;
  useWebSearch?: boolean;
}

const log = logger(import.meta);

/**
 * Gets all community-enabled MCP servers for a community
 */
async function getAllMCPServers(
  communityId: string,
): Promise<CommonMCPServerWithHeaders[]> {
  const mcpServers = await models.MCPServer.scope('withPrivateData').findAll({
    include: [
      {
        model: models.MCPServerCommunity,
        where: { community_id: communityId },
        attributes: [],
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
    headers: {},
  }));
}

/**
 * Generates prompt based on completion type and context
 */
function generatePromptForType(
  completionType: AICompletionType,
  contextString: string,
): StructuredPrompt {
  switch (completionType) {
    case AICompletionType.Thread:
      return generateThreadPrompt(contextString);
    case AICompletionType.Comment:
      return generateCommentPrompt(contextString);
    case AICompletionType.Poll:
      return generatePollPrompt(contextString);
    default:
      throw new Error(`Unknown completion type: ${completionType}`);
  }
}

export const aiCompletionHandler = async (req: Request, res: Response) => {
  const requestId = Math.random().toString(36).substr(2, 9);
  log.info(`[${requestId}] AI completion request started`, {
    model: req.body?.model || DEFAULT_COMPLETION_MODEL,
    completionType: req.body?.completionType,
    stream: req.body?.stream !== false,
  });

  try {
    const {
      communityId,
      completionType,
      parentCommentId,
      topicId,
      model = DEFAULT_COMPLETION_MODEL,
      temperature,
      maxTokens = 1000,
      stream = true,
      useOpenRouter = false,
      useWebSearch = false,
    } = req.body as AICompletionRequestBody;

    // Validate required fields
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({
        error: 'User authentication required',
      });
    }

    if (!communityId) {
      return res.status(400).json({
        error: 'communityId is required',
      });
    }
    // Validate completion type (ThreadTitle is not supported - use client-side extraction)
    const validCompletionTypes = [
      AICompletionType.Thread,
      AICompletionType.Comment,
      AICompletionType.Poll,
    ];
    if (!completionType || !validCompletionTypes.includes(completionType)) {
      return res.status(400).json({
        error: `Invalid completionType. Must be one of: ${validCompletionTypes.join(', ')}`,
      });
    }

    // For Comment completions, validate user and parent comment ownership BEFORE streaming
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let parentCommentThreadId: number | undefined;

    if (completionType === AICompletionType.Comment) {
      if (!parentCommentId) {
        return res.status(400).json({
          error: 'parentCommentId is required for Comment completions',
        });
      }

      // Fetch the parent comment to verify ownership
      const parentComment = await models.Comment.findByPk(parentCommentId);
      if (!parentComment) {
        return res.status(404).json({
          error: 'Parent comment not found',
        });
      }

      // Fetch the thread to verify community
      const thread = await models.Thread.findByPk(parentComment.thread_id);
      if (!thread) {
        return res.status(404).json({
          error: 'Thread not found for parent comment',
        });
      }

      // Verify the comment belongs to the specified community
      if (thread.community_id !== communityId) {
        return res.status(400).json({
          error: 'Parent comment does not belong to the specified community',
        });
      }

      // Fetch the comment author's address to verify ownership
      const commentAuthorAddress = await models.Address.findByPk(
        parentComment.address_id,
      );

      if (commentAuthorAddress?.user_id !== userId) {
        return res.status(403).json({
          error: 'Parent comment must be created by the requesting user',
        });
      }

      parentCommentThreadId = parentComment.thread_id;
      log.info(`[${requestId}] Validated parent comment ownership`, {
        parentCommentId,
        userId,
        threadId: parentCommentThreadId,
      });
    }

    // Build context from entity IDs (this verifies they belong to the community)
    // Thread ID is inferred from the parent comment's thread
    let contextData;
    try {
      contextData = await buildContextFromEntityIds(communityId, {
        parentCommentId,
        topicId,
      });
    } catch (contextError) {
      log.error(`[${requestId}] Error building context:`, contextError);
      return res.status(400).json({
        error:
          contextError instanceof Error
            ? contextError.message
            : 'Failed to build context from provided entity IDs',
      });
    }

    // Format context for prompt
    const contextString = formatContextForPrompt(contextData);

    // Generate prompts based on completion type
    const { systemPrompt, userPrompt } = generatePromptForType(
      completionType,
      contextString,
    );

    log.info(`[${requestId}] Generated prompts for ${completionType}`, {
      contextLength: contextString.length,
      systemPromptLength: systemPrompt.length,
      userPromptLength: userPrompt.length,
    });

    // Check for MCP servers in the community (for potential future MCP integration)
    let useMCPPath = false;
    let mentionedMCPServers: CommonMCPServerWithHeaders[] = [];

    // MCP path only supports OpenAI
    if (
      useMCPPath &&
      (useOpenRouter || config.OPENAI.USE_OPENROUTER === 'true')
    ) {
      return res.status(400).json({
        error: 'MCP features are only available with OpenAI, not OpenRouter',
      });
    }

    // Choose between OpenAI and OpenRouter
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
      if (useWebSearch) {
        modelId = `${model}:online`;
      }
    } else {
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
      }
    }

    log.info(`AI completion request:
      \n modelId=${modelId},
      \n provider=${useOR ? 'OpenRouter' : 'OpenAI'},
      \n webSearch=${!!useWebSearch}
      \n completionType=${completionType}`);

    // Initialize OpenAI client
    const openAIConfig = {
      apiKey,
      ...(useOR && { baseURL: 'https://openrouter.ai/api/v1' }),
      ...(config.OPENAI.ORGANIZATION &&
        !useOR && {
          organization: config.OPENAI.ORGANIZATION,
        }),
    };

    const openai = new OpenAI(openAIConfig);

    // Handle MCP path (reserved for future use)
    if (useMCPPath && mentionedMCPServers.length > 0) {
      log.info(
        `[${requestId}] Using MCP path with ${mentionedMCPServers.length} servers`,
      );

      try {
        const mcpOptions = buildMCPClientOptions(
          userPrompt,
          mentionedMCPServers,
          null,
        );

        mcpOptions.model = model || DEFAULT_COMPLETION_MODEL;
        mcpOptions.stream = true;

        log.info(
          `[${requestId}] Creating MCP response with model: ${mcpOptions.model}`,
        );

        if (stream) {
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
                } catch (writeError) {
                  log.error(
                    `[${requestId}] Error writing MCP chunk:`,
                    writeError,
                  );
                  throw writeError;
                }
              }
            }
          }

          log.info(`[${requestId}] MCP streaming completed`, {
            totalChunks: chunkCount,
            totalContentLength,
          });

          res.end();
          return;
        } else {
          const response = await openai.responses.create(mcpOptions);

          let responseText = '';
          for await (const event of response) {
            if (event.type === 'response.output_text.delta') {
              responseText += event.delta || '';
            }
          }

          res.json({
            completion:
              responseText ||
              'I apologize, but I was unable to generate a response.',
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

    // Standard completion path
    if (stream) {
      log.info(`[${requestId}] Setting up streaming response`);

      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('X-Accel-Buffering', 'no');

      try {
        const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
        if (systemPrompt) {
          messages.push({ role: 'system', content: systemPrompt });
        }
        messages.push({ role: 'user', content: userPrompt });

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

        const streamResponse =
          await openai.chat.completions.create(streamConfig);

        let chunkCount = 0;
        let totalContentLength = 0;
        let accumulatedText = '';

        for await (const chunk of streamResponse) {
          chunkCount++;
          const choice = chunk.choices?.[0];
          const contentToStream = choice?.delta?.content || '';

          if (contentToStream) {
            totalContentLength += contentToStream.length;
            accumulatedText += contentToStream;

            try {
              res.write(contentToStream);
              if (res.flush) res.flush();
            } catch (writeError) {
              log.error(
                `[${requestId}] Error writing chunk ${chunkCount}:`,
                writeError,
              );
              throw writeError;
            }
          }
        }

        log.info(`[${requestId}] Streaming completed successfully`, {
          totalChunks: chunkCount,
          totalContentLength,
        });

        // For Comment completions, create the AI comment directly (ownership was validated earlier)
        if (
          completionType === AICompletionType.Comment &&
          parentCommentId &&
          parentCommentThreadId &&
          userId &&
          accumulatedText
        ) {
          const commentResult = await createAIComment(
            userId,
            communityId,
            parentCommentThreadId,
            parentCommentId,
            accumulatedText,
          );

          if (commentResult.success) {
            log.info(`[${requestId}] Created AI comment`, {
              commentId: commentResult.commentId,
            });
          } else {
            log.error(
              `[${requestId}] Failed to create AI comment: ${commentResult.error}`,
            );
          }
        }

        res.end();
      } catch (streamError: unknown) {
        log.error(`[${requestId}] Streaming error:`, streamError as Error);

        const orError = extractOpenRouterError(streamError);
        if (orError) {
          if (!res.headersSent) {
            return res.status(orError.code || 500).json({
              error: orError.message,
              metadata: orError.metadata,
            });
          }
          res.write(`\nError: ${orError.message}`);
          return res.end();
        }

        if (!res.headersSent) {
          const error = streamError as Error & { status?: number };
          return res.status(error.status || 500).json({
            error: error.message || 'Streaming failed',
            status: error.status || 500,
          });
        }

        res.write('\nError during streaming');
        res.end();
      }
    } else {
      // Non-streaming response
      try {
        const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
        if (systemPrompt) {
          messages.push({ role: 'system', content: systemPrompt });
        }
        messages.push({ role: 'user', content: userPrompt });

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

        const responseText = completion.choices[0]?.message?.content || '';
        const messageForResponse = completion.choices[0]
          ?.message as OpenAI.Chat.ChatCompletionMessage & {
          annotations?: unknown;
        };
        const annotations = messageForResponse?.annotations;

        const responsePayload: {
          completion: string;
          annotations?: unknown;
          commentCreated?: boolean;
          commentId?: number;
        } = {
          completion: responseText,
        };
        if (annotations) {
          responsePayload.annotations = annotations;
        }

        // For Comment completions, create the AI comment directly (ownership was validated earlier)
        if (
          completionType === AICompletionType.Comment &&
          parentCommentId &&
          parentCommentThreadId &&
          userId &&
          responseText
        ) {
          const commentResult = await createAIComment(
            userId,
            communityId,
            parentCommentThreadId,
            parentCommentId,
            responseText,
          );

          if (commentResult.success) {
            responsePayload.commentCreated = true;
            responsePayload.commentId = commentResult.commentId;
            log.info(`[${requestId}] Created AI comment`, {
              commentId: commentResult.commentId,
            });
          } else {
            log.error(
              `[${requestId}] Failed to create AI comment: ${commentResult.error}`,
            );
          }
        }

        res.json(responsePayload);
      } catch (completionError: unknown) {
        const orError = extractOpenRouterError(completionError);
        if (orError) {
          return res.status(orError.code || 500).json({
            error: orError.message,
            metadata: orError.metadata,
          });
        }

        const error = completionError as Error & { status?: number };
        return res.status(error.status || 500).json({
          error: error.message || 'Completion failed',
          status: error.status || 500,
        });
      }
    }
  } catch (error: unknown) {
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
    }
  } finally {
    log.info(`[${requestId}] AI completion request ended`);
  }
};
