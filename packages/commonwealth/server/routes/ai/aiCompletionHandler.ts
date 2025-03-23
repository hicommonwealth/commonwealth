import { Request, Response } from 'express';
import { OpenAI } from 'openai';
import { config } from '../../config';

export const aiCompletionHandler = async (req: Request, res: Response) => {
  try {
    const {
      prompt,
      model = 'gpt-4',
      temperature = 0.7,
      maxTokens = 1000,
      stream = true,
    } = req.body;

    // Validate inputs
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const apiKey = config.OPENAI.API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    // Initialize OpenAI client
    const openAIConfig = {
      apiKey,
      ...(config.OPENAI.ORGANIZATION && {
        organization: config.OPENAI.ORGANIZATION,
      }),
    };

    const openai = new OpenAI(openAIConfig);

    if (stream) {
      // Set proper headers for streaming
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('X-Accel-Buffering', 'no'); // Disable Nginx buffering if present

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const streamConfig: any = {
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature,
          max_tokens: maxTokens,
          stream: true,
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
      } catch (streamError) {
        console.error('Streaming error:', streamError);
        if (!res.headersSent) {
          return res.status(500).json({ error: 'Streaming failed' });
        }
        res.write('\nError during streaming');
      }

      res.end();
    } else {
      // Handle regular response
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const completionConfig: any = {
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature,
          max_tokens: maxTokens,
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const completion =
          await openai.chat.completions.create(completionConfig);

        const responseText = completion.choices[0]?.message?.content || '';
        res.json({ completion: responseText });
      } catch (completionError) {
        console.error('Completion error:', completionError);
        return res.status(500).json({ error: 'Completion failed' });
      }
    }
  } catch (error) {
    console.error('Error calling OpenAI API:', error);

    // Don't expose internal error details to client
    res.status(500).json({
      error: 'An error occurred while processing your request',
    });
  }
};
