import { logger } from '@hicommonwealth/core';
import { models } from '@hicommonwealth/model/db';
import {
  AICompletionType,
  buildContextFromEntityIds,
  buildMCPClientOptions,
  CommonMCPServerWithHeaders,
  formatContextForPrompt,
} from '@hicommonwealth/model/services';
import {
  CompletionModel,
  DEFAULT_COMPLETION_MODEL,
} from '@hicommonwealth/shared';
import { Request, Response } from 'express';
import { OpenAI } from 'openai';
import {
  createOpenAIClient,
  generatePromptForType,
  getApiKey,
  getOpenRouterHeaders,
  selectModel,
  shouldUseOpenRouter,
} from './completionUtils';
import { createAIComment } from './createAIComment';
import { getMentionedMCPServers } from './mcpUtils';
import { extractOpenRouterError } from './utils';

const log = logger(import.meta);

/**
 * Request body for AI completion - uses entity IDs for secure context building
 */
interface AICompletionRequestBody {
  communityId: string;
  completionType: AICompletionType;
  parentCommentId?: number;
  topicId?: number;
  model?: CompletionModel;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  useOpenRouter?: boolean;
  useWebSearch?: boolean;
}

/**
 * Validates the request body and returns parsed values or an error response
 */
async function validateRequest(
  req: Request,
  res: Response,
): Promise<
  | {
      valid: false;
    }
  | {
      valid: true;
      userId: number;
      communityId: string;
      completionType: AICompletionType;
      parentCommentId?: number;
      parentCommentThreadId?: number;
      parentCommentBody?: string;
      topicId?: number;
      model: CompletionModel;
      temperature?: number;
      maxTokens: number;
      stream: boolean;
      useOpenRouter: boolean;
      useWebSearch: boolean;
    }
> {
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

  // Validate user authentication
  const userId = (req.user as { id?: number })?.id;
  if (!userId) {
    res.status(401).json({ error: 'User authentication required' });
    return { valid: false };
  }

  // Validate community ID
  if (!communityId) {
    res.status(400).json({ error: 'communityId is required' });
    return { valid: false };
  }

  // Validate completion type
  const validCompletionTypes = [
    AICompletionType.Thread,
    AICompletionType.Comment,
    AICompletionType.Poll,
  ];
  if (!completionType || !validCompletionTypes.includes(completionType)) {
    res.status(400).json({
      error: `Invalid completionType. Must be one of: ${validCompletionTypes.join(', ')}`,
    });
    return { valid: false };
  }

  // For Comment completions, validate parent comment ownership
  let parentCommentThreadId: number | undefined;
  let parentCommentBody: string | undefined;

  if (completionType === AICompletionType.Comment) {
    if (!parentCommentId) {
      res.status(400).json({
        error: 'parentCommentId is required for Comment completions',
      });
      return { valid: false };
    }

    const parentComment = await models.Comment.findByPk(parentCommentId);
    if (!parentComment) {
      res.status(404).json({ error: 'Parent comment not found' });
      return { valid: false };
    }

    const thread = await models.Thread.findByPk(parentComment.thread_id);
    if (!thread) {
      res.status(404).json({ error: 'Thread not found for parent comment' });
      return { valid: false };
    }

    if (thread.community_id !== communityId) {
      res.status(400).json({
        error: 'Parent comment does not belong to the specified community',
      });
      return { valid: false };
    }

    const commentAuthorAddress = await models.Address.findByPk(
      parentComment.address_id,
    );
    if (commentAuthorAddress?.user_id !== userId) {
      res.status(403).json({
        error: 'Parent comment must be created by the requesting user',
      });
      return { valid: false };
    }

    parentCommentThreadId = parentComment.thread_id;
    parentCommentBody = parentComment.body;
  }

  return {
    valid: true,
    userId,
    communityId,
    completionType,
    parentCommentId,
    parentCommentThreadId,
    parentCommentBody,
    topicId,
    model,
    temperature,
    maxTokens,
    stream,
    useOpenRouter,
    useWebSearch,
  };
}

/**
 * Handles MCP-based completion (streaming and non-streaming)
 */
async function handleMCPCompletion(
  requestId: string,
  res: Response,
  openai: OpenAI,
  mcpServers: CommonMCPServerWithHeaders[],
  userPrompt: string,
  model: CompletionModel,
  stream: boolean,
  completionType: AICompletionType,
  userId: number,
  communityId: string,
  parentCommentId?: number,
  parentCommentThreadId?: number,
): Promise<void> {
  const mcpOptions = buildMCPClientOptions(userPrompt, mcpServers, null);
  mcpOptions.model = model;
  mcpOptions.stream = true;

  log.info(
    `[${requestId}] Creating MCP response with model: ${mcpOptions.model}`,
  );

  if (stream) {
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('X-Accel-Buffering', 'no');

    console.log(
      '[aiCompletionHandler] MCP options',
      JSON.stringify(mcpOptions, null, 2),
    );

    const response = await openai.responses.create(mcpOptions);
    let chunkCount = 0;
    let totalContentLength = 0;
    let accumulatedText = '';

    for await (const event of response) {
      chunkCount++;
      if (event.type === 'response.output_text.delta') {
        const contentToStream = event.delta || '';
        if (contentToStream) {
          totalContentLength += contentToStream.length;
          accumulatedText += contentToStream;
          res.write(contentToStream);
          if (res.flush) res.flush();
        }
      }
    }

    log.info(`[${requestId}] MCP streaming completed`, {
      totalChunks: chunkCount,
      totalContentLength,
    });

    // Create AI comment for Comment completions
    if (
      completionType === AICompletionType.Comment &&
      parentCommentId &&
      parentCommentThreadId &&
      accumulatedText
    ) {
      const commentResult = await createAIComment(
        userId,
        communityId,
        parentCommentThreadId,
        parentCommentId,
        accumulatedText,
      );

      if (commentResult.success && commentResult.comment) {
        log.info(`[${requestId}] Created AI comment via MCP path`, {
          commentId: commentResult.commentId,
        });
        res.write('\n__COMMENT_PAYLOAD__\n');
        res.write(JSON.stringify(commentResult.comment));
      } else {
        log.error(
          `[${requestId}] Failed to create AI comment via MCP path: ${commentResult.error}`,
        );
      }
    }

    res.end();
  } else {
    const response = await openai.responses.create(mcpOptions);
    let responseText = '';

    for await (const event of response) {
      if (event.type === 'response.output_text.delta') {
        responseText += event.delta || '';
      }
    }

    const responsePayload: {
      completion: string;
      commentCreated?: boolean;
      commentId?: number;
    } = {
      completion:
        responseText || 'I apologize, but I was unable to generate a response.',
    };

    if (
      completionType === AICompletionType.Comment &&
      parentCommentId &&
      parentCommentThreadId &&
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
        log.info(`[${requestId}] Created AI comment via MCP path`, {
          commentId: commentResult.commentId,
        });
      } else {
        log.error(
          `[${requestId}] Failed to create AI comment via MCP path: ${commentResult.error}`,
        );
      }
    }

    res.json(responsePayload);
  }
}

/**
 * Handles standard streaming completion
 */
async function handleStreamingCompletion(
  requestId: string,
  res: Response,
  openai: OpenAI,
  modelId: string,
  systemPrompt: string,
  userPrompt: string,
  temperature: number | undefined,
  maxTokens: number,
  useOpenRouter: boolean,
  addOpenAiWebSearchOptions: boolean,
  completionType: AICompletionType,
  userId: number,
  communityId: string,
  parentCommentId?: number,
  parentCommentThreadId?: number,
): Promise<void> {
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('X-Accel-Buffering', 'no');

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
    ...(useOpenRouter && { extra_headers: getOpenRouterHeaders() }),
    ...(!useOpenRouter &&
      addOpenAiWebSearchOptions && { web_search_options: {} }),
  };

  log.info(`[${requestId}] Starting OpenAI streaming request`, {
    model: streamConfig.model,
    maxTokens: streamConfig.max_tokens,
    messageCount: messages.length,
  });

  const streamResponse = await openai.chat.completions.create(streamConfig);

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
      res.write(contentToStream);
      if (res.flush) res.flush();
    }
  }

  log.info(`[${requestId}] Streaming completed successfully`, {
    totalChunks: chunkCount,
    totalContentLength,
  });

  // Create AI comment for Comment completions
  if (
    completionType === AICompletionType.Comment &&
    parentCommentId &&
    parentCommentThreadId &&
    accumulatedText
  ) {
    const commentResult = await createAIComment(
      userId,
      communityId,
      parentCommentThreadId,
      parentCommentId,
      accumulatedText,
    );

    if (commentResult.success && commentResult.comment) {
      log.info(`[${requestId}] Created AI comment`, {
        commentId: commentResult.commentId,
      });
      res.write('\n__COMMENT_PAYLOAD__\n');
      res.write(JSON.stringify(commentResult.comment));
    } else {
      log.error(
        `[${requestId}] Failed to create AI comment: ${commentResult.error}`,
      );
    }
  }

  res.end();
}

/**
 * Handles standard non-streaming completion
 */
async function handleNonStreamingCompletion(
  requestId: string,
  res: Response,
  openai: OpenAI,
  modelId: string,
  systemPrompt: string,
  userPrompt: string,
  temperature: number | undefined,
  maxTokens: number,
  useOpenRouter: boolean,
  addOpenAiWebSearchOptions: boolean,
  completionType: AICompletionType,
  userId: number,
  communityId: string,
  parentCommentId?: number,
  parentCommentThreadId?: number,
): Promise<void> {
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
    ...(useOpenRouter && { extra_headers: getOpenRouterHeaders() }),
    ...(!useOpenRouter &&
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

  // Create AI comment for Comment completions
  if (
    completionType === AICompletionType.Comment &&
    parentCommentId &&
    parentCommentThreadId &&
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
}

/**
 * Main AI completion handler
 */
export const aiCompletionHandler = async (req: Request, res: Response) => {
  const requestId = Math.random().toString(36).substr(2, 9);
  log.info(`[${requestId}] AI completion request started`, {
    model: req.body?.model || DEFAULT_COMPLETION_MODEL,
    completionType: req.body?.completionType,
    stream: req.body?.stream !== false,
  });

  try {
    // Validate request
    const validation = await validateRequest(req, res);
    if (!validation.valid) {
      return;
    }

    const {
      userId,
      communityId,
      completionType,
      parentCommentId,
      parentCommentThreadId,
      parentCommentBody,
      topicId,
      model,
      temperature,
      maxTokens,
      stream,
      useOpenRouter,
      useWebSearch,
    } = validation;

    log.info(`[${requestId}] Validated parent comment ownership`, {
      parentCommentId,
      userId,
      threadId: parentCommentThreadId,
    });

    // Build context from entity IDs
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

    // Generate prompts
    const contextString = formatContextForPrompt(contextData);
    const { systemPrompt, userPrompt } = generatePromptForType(
      completionType,
      contextString,
    );

    log.info(`[${requestId}] Generated prompts for ${completionType}`, {
      contextLength: contextString.length,
      systemPromptLength: systemPrompt.length,
      userPromptLength: userPrompt.length,
    });

    // Check for MCP server mentions
    const mentionedMCPServers = await getMentionedMCPServers(
      communityId,
      parentCommentBody,
      requestId,
    );

    // Determine provider (MCP requires OpenAI)
    const useOR = shouldUseOpenRouter(
      useOpenRouter,
      mentionedMCPServers.length > 0,
    );

    // MCP path only supports OpenAI
    if (mentionedMCPServers.length > 0 && useOR) {
      return res.status(400).json({
        error: 'MCP features are only available with OpenAI, not OpenRouter',
      });
    }

    // Validate API key
    const apiKey = getApiKey(useOR);
    if (!apiKey) {
      return res.status(500).json({
        error: `${useOR ? 'OpenRouter' : 'OpenAI'} API key not configured`,
      });
    }

    // Select model based on configuration
    const modelSelection = selectModel(model, useOR, useWebSearch);
    if (modelSelection.error) {
      return res.status(400).json({ error: modelSelection.error });
    }

    const { modelId, addOpenAiWebSearchOptions } = modelSelection;

    log.info(`AI completion request:
      \n modelId=${modelId},
      \n provider=${useOR ? 'OpenRouter' : 'OpenAI'},
      \n webSearch=${!!useWebSearch}
      \n completionType=${completionType}`);

    // Create OpenAI client
    const openai = createOpenAIClient(useOR);

    // Handle MCP path
    if (mentionedMCPServers.length > 0) {
      log.info(
        `[${requestId}] Using MCP path with ${mentionedMCPServers.length} servers`,
      );

      try {
        await handleMCPCompletion(
          requestId,
          res,
          openai,
          mentionedMCPServers,
          userPrompt,
          model,
          stream,
          completionType,
          userId,
          communityId,
          parentCommentId,
          parentCommentThreadId,
        );
        return;
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

      try {
        await handleStreamingCompletion(
          requestId,
          res,
          openai,
          modelId,
          systemPrompt,
          userPrompt,
          temperature,
          maxTokens,
          useOR,
          addOpenAiWebSearchOptions,
          completionType,
          userId,
          communityId,
          parentCommentId,
          parentCommentThreadId,
        );
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
      try {
        await handleNonStreamingCompletion(
          requestId,
          res,
          openai,
          modelId,
          systemPrompt,
          userPrompt,
          temperature,
          maxTokens,
          useOR,
          addOpenAiWebSearchOptions,
          completionType,
          userId,
          communityId,
          parentCommentId,
          parentCommentThreadId,
        );
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
