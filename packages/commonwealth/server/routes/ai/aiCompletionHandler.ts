import { CompletionOptions } from '@hicommonwealth/shared';
import { Request, Response } from 'express';
import { OpenAI } from 'openai';
import { config } from '../../config';
import { extractOpenRouterError } from './utils';

export const aiCompletionHandler = async (req: Request, res: Response) => {
  try {
    const {
      prompt,
      model = 'gpt-4o',
      temperature = 0.7,
      maxTokens = 1000,
      stream = true,
      useOpenRouter = false,
      useWebSearch = false,
    } = req.body as CompletionOptions;

    // Validate inputs
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Log the received prompt
    console.log('Received prompt:', prompt);

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
      console.log(`Web search enabled for OpenRouter model.`);
    }

    // Log provider and model information
    console.log(`AI Completion Request:
      - Provider: ${useOR ? 'OpenRouter' : 'OpenAI'}
      - Requested model: ${model}
      - Actual model ID used: ${modelId} 
    `);

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
        const streamConfig: any = {
          model: modelId as any,
          messages: [{ role: 'user', content: prompt }],
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

        console.log('Streaming request messages:', streamConfig.messages); // Log the messages for streaming

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const streamResponse: any =
          await openai.chat.completions.create(streamConfig);

        for await (const chunk of streamResponse) {
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            res.write(content);
            // Force flush the response to prevent buffering
            if (res.flush) res.flush();
          }
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (streamError: any) {
        console.error('Streaming error:', streamError);

        // Check for OpenRouter-specific error format
        const orError = extractOpenRouterError(streamError);
        if (orError) {
          console.error('OpenRouter error details:', orError);

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
          return res.status(500).json({
            error: streamError.message || 'Streaming failed',
            status: streamError.status || 500,
          });
        }

        res.write('\nError during streaming');
        res.end();
      }

      res.end();
    } else {
      // Handle regular response
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const completionConfig: any = {
          model: modelId as any,
          messages: [{ role: 'user', content: prompt }],
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
        };

        console.log('Completion request messages:', completionConfig.messages); // Log the messages for non-streaming

        const completion =
          await openai.chat.completions.create(completionConfig);

        // Log the entire first choice message object from the AI
        if (
          completion.choices &&
          completion.choices.length > 0 &&
          completion.choices[0].message
        ) {
          console.log(
            'Raw AI completion message:',
            JSON.stringify(completion.choices[0].message, null, 2),
          );
          // Specifically log annotations if present in the non-streaming message
          // Use index signature access to safely access potential custom 'annotations' field
          const message = completion.choices[0].message as any; // Cast to any to access potentially custom fields
          if (message.annotations) {
            console.log(
              'Extracted Annotations (non-streaming):',
              JSON.stringify(message.annotations, null, 2),
            );
          }
        } else {
          console.log(
            'Raw AI completion (no message in first choice or no choices):',
            JSON.stringify(completion, null, 2),
          );
        }

        const responseText = completion.choices[0]?.message?.content || '';
        res.json({ completion: responseText });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (completionError: any) {
        console.error('Completion error:', completionError);

        // Check for OpenRouter-specific error format
        const orError = extractOpenRouterError(completionError);
        if (orError) {
          console.error('OpenRouter error details:', orError);
          return res.status(orError.code || 500).json({
            error: orError.message,
            metadata: orError.metadata,
          });
        }

        // Handle other errors
        return res.status(completionError.status || 500).json({
          error: completionError.message || 'Completion failed',
          status: completionError.status || 500,
        });
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Error calling AI API:', error);

    // Extract useful information for the client
    const statusCode = error.status || 500;
    const errorMessage =
      error.message || 'An error occurred while processing your request';

    res.status(statusCode).json({
      error: errorMessage,
      status: statusCode,
    });
  }
};
