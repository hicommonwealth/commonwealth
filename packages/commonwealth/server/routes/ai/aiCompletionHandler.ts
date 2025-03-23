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
    } = req.body as CompletionOptions;

    // Validate inputs
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
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
    const modelId = useOR
      ? model // OpenRouter models already include provider prefix
      : model.includes('/')
        ? model.split('/')[1]
        : model; // Strip provider prefix for OpenAI

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
          model: modelId,
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
        };

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
          model: modelId,
          messages: [{ role: 'user', content: prompt }],
          temperature,
          max_tokens: maxTokens,
          ...(useOR && {
            extra_headers: {
              'HTTP-Referer': 'https://common.xyz',
              'X-Title': 'Common',
            },
          }),
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const completion =
          await openai.chat.completions.create(completionConfig);

        const responseText = completion.choices[0]?.message?.content || '';
        res.json({ completion: responseText });
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
