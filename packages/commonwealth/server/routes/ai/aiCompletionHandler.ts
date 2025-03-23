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

    // Common parameters for both streaming and non-streaming
    const params = {
      model: model || 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: temperature || 0.7,
      max_tokens: maxTokens || 1000,
    };

    if (stream) {
      // Set proper headers for streaming
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('X-Accel-Buffering', 'no'); // Disable Nginx buffering if present

      // Handle streaming response
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const streamResponse = await openai.chat.completions.create({
        ...params,
        stream: true,
      } as any);

      for await (const chunk of streamResponse) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          res.write(content);
          // Force flush the response to prevent buffering
          if (res.flush) res.flush();
        }
      }

      res.end();
    } else {
      // Handle regular response
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const completion = await openai.chat.completions.create(params as any);
      const responseText = completion.choices[0]?.message?.content || '';

      res.json({ completion: responseText });
    }
  } catch (error) {
    console.error('Error calling OpenAI API:', error);

    // Don't expose internal error details to client
    res.status(500).json({
      error: 'An error occurred while processing your request',
    });
  }
};
