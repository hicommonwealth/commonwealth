import { CompletionOptions } from '@hicommonwealth/shared';
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
};

export const aiCompletionHandler = async (req: Request, res: Response) => {
  try {
    const {
      prompt: initialPrompt,
      systemPrompt: initialSystemPrompt,
      model = 'gpt-4o',
      temperature = 0.7,
      maxTokens = 1000,
      stream = true,
      useOpenRouter = false,
      useWebSearch = false,
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

    // Choose between OpenAI and OpenRouter
    const useOR = useOpenRouter || config.OPENAI.USE_OPENROUTER === 'true';
    const apiKey = useOR
      ? config.OPENAI.OPENROUTER_API_KEY
      : config.OPENAI.API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: `${useOR ? 'OpenRouter' : 'OpenAI'} API key not configured`,
      });
    }

    // Determine actual model ID based on provider
    // OpenRouter needs full model path, OpenAI uses shorter names
    let modelId: string = model; // Start with the original model, explicitly typed as string
    let addOpenAiWebSearchOptions = false;

    if (useOR) {
      // For OpenRouter, append :online if not already present
      if (!model.endsWith(':online')) {
        modelId = `${model}:online`;
      }
    } else {
      // For OpenAI, strip provider prefix and map to search-preview models
      // or use existing -search-preview models
      const baseModel = model.includes('/') ? model.split('/')[1] : model;
      if (baseModel === 'gpt-4o') {
        modelId = 'gpt-4o-search-preview';
        addOpenAiWebSearchOptions = true;
      } else if (baseModel === 'gpt-4o-mini') {
        modelId = 'gpt-4o-mini-search-preview';
        addOpenAiWebSearchOptions = true;
      } else if (baseModel.endsWith('-search-preview')) {
        // If user explicitly passes a search-preview model
        modelId = baseModel;
        addOpenAiWebSearchOptions = true;
      } else {
        modelId = baseModel; // Use the stripped model name if no specific search preview version
      }
    }

    // Append :online suffix if using OpenRouter and web search is enabled
    if (useOR && useWebSearch) {
      // Avoid appending if already present (e.g., if client sent it directly)
      if (!modelId.endsWith(':online')) {
        modelId = `${modelId}:online`;
      }
    }

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

    if (stream) {
      // Set proper headers for streaming
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('X-Accel-Buffering', 'no');

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

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const streamResponse =
          await openai.chat.completions.create(streamConfig);

        for await (const chunk of streamResponse) {
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
              // If annotations are found, you might want to handle them or store them
              // For now, we are just logging them per chunk.
            }
          }

          const contentToStream = choice?.delta?.content || '';
          if (contentToStream) {
            res.write(contentToStream);
            if (res.flush) res.flush(); // Force flush for immediate client update
          }
        }

        res.end();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (streamError: unknown) {
        // Check for OpenRouter-specific error format
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

        // Handle other errors
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

    res.status(statusCode).json({
      error: errorMessage,
      status: statusCode,
    });
  }
};
