import { CompletionOptions } from '@hicommonwealth/shared';
import { Request, Response } from 'express';
import { OpenAI } from 'openai';
import { config } from '../../config';
import { extractOpenRouterError } from './utils';

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
    } = req.body as CompletionOptions;

    let finalUserPrompt: string;
    let finalSystemPrompt: string | undefined;

    // Check if initialPrompt is an object with userPrompt and systemPrompt properties
    if (
      typeof initialPrompt === 'object' &&
      initialPrompt !== null &&
      typeof (initialPrompt as any).userPrompt === 'string'
    ) {
      finalUserPrompt = (initialPrompt as any).userPrompt;
      // Use systemPrompt from the object if available, otherwise fallback to initialSystemPrompt (top-level)
      finalSystemPrompt =
        (initialPrompt as any).systemPrompt || initialSystemPrompt;
      console.log('Interpreting structured prompt from initialPrompt field:');
      console.log('  User Prompt (from object): ', finalUserPrompt);
      if ((initialPrompt as any).systemPrompt) {
        console.log(
          '  System Prompt (from object): ',
          (initialPrompt as any).systemPrompt,
        );
      }
      if (initialSystemPrompt && !(initialPrompt as any).systemPrompt) {
        console.log(
          '  System Prompt (from top-level, as object did not have one): ',
          initialSystemPrompt,
        );
      }
    } else if (typeof initialPrompt === 'string') {
      // This is the originally expected correct case
      finalUserPrompt = initialPrompt;
      finalSystemPrompt = initialSystemPrompt;
      console.log('Interpreting flat prompt fields:');
      console.log('  User Prompt: ', finalUserPrompt);
      if (finalSystemPrompt) {
        console.log('  System Prompt: ', finalSystemPrompt);
      }
    } else {
      console.error('Invalid initialPrompt structure received:', initialPrompt);
      return res
        .status(400)
        .json({
          error:
            'Invalid prompt format. Prompt must be a string or a structured object.',
        });
    }

    // Validate inputs (now using finalUserPrompt)
    if (!finalUserPrompt) {
      return res
        .status(400)
        .json({
          error: 'User prompt content is required and could not be determined.',
        });
    }

    // Log the received prompt - now logging the determined final prompts
    console.log('Final User Prompt for AI:', finalUserPrompt);
    if (finalSystemPrompt) {
      console.log('Final System Prompt for AI:', finalSystemPrompt);
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
        const messages: any[] = [];
        if (finalSystemPrompt) {
          messages.push({ role: 'system', content: finalSystemPrompt });
        }
        messages.push({ role: 'user', content: finalUserPrompt });

        console.log('Constructed messages for AI:', messages);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const streamConfig: any = {
          model: modelId as any,
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

        console.log('Streaming request messages:', streamConfig.messages); // Log the messages for streaming

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const streamResponse: any =
          await openai.chat.completions.create(streamConfig);

        for await (const chunk of streamResponse) {
          // Log the entire raw chunk from the AI
          console.log('Raw AI stream chunk:', JSON.stringify(chunk, null, 2));

          const choice = chunk.choices?.[0];
          if (choice) {
            let annotationsFoundInChunk = false;
            // Check for annotations on delta (OpenRouter might put them here)
            if (choice.delta && (choice.delta as any).annotations) {
              console.log(
                'Annotations in chunk (from delta.annotations):',
                JSON.stringify((choice.delta as any).annotations, null, 2),
              );
              annotationsFoundInChunk = true;
            }
            // Check for annotations directly on the choice object (less common for streaming delta but good to cover)
            if ((choice as any).annotations) {
              console.log(
                'Annotations in chunk (from choice.annotations):',
                JSON.stringify((choice as any).annotations, null, 2),
              );
              annotationsFoundInChunk = true;
            }
            // If OpenRouter nests a full message object within delta, check there too
            if (
              choice.delta &&
              (choice.delta as any).message &&
              (choice.delta as any).message.annotations
            ) {
              console.log(
                'Annotations in chunk (from delta.message.annotations):',
                JSON.stringify(
                  (choice.delta as any).message.annotations,
                  null,
                  2,
                ),
              );
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
    } else {
      // Handle regular response
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const messages: any[] = [];
        if (finalSystemPrompt) {
          messages.push({ role: 'system', content: finalSystemPrompt });
        }
        messages.push({ role: 'user', content: finalUserPrompt });

        console.log('Constructed messages for AI (non-streaming):', messages);

        const completion = await openai.chat.completions.create({
          model: modelId as any,
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
        const messageForResponse = completion.choices[0]?.message as any;
        const annotations = messageForResponse?.annotations;

        const responsePayload: { completion: string; annotations?: any } = {
          completion: responseText,
        };
        if (annotations) {
          responsePayload.annotations = annotations;
        }
        res.json(responsePayload);
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
