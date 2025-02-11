import { config } from '@hicommonwealth/model';
import { OpenAI } from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { ChatCompletionDeveloperMessageParam } from 'openai/resources/index.mjs';
import { z } from 'zod';

const MomBotDatingPoolCreation = z.object({
  createDatingPool: z.boolean(),
  preferences: z.array(z.string()),
});

const developerPrompt: ChatCompletionDeveloperMessageParam = {
  role: 'developer',
  content: `
    You are a data extraction system that extracts information from the user.
    
    The user will ask you to "create" a dating pool or "help them find a date".
    
    Extract the dating preferences of the user. This may include a gender, age,
    interests, hobbies, etc.
    
    Example: "Hey @mombot, create a dating pool for me. I like women in crypto"
    Expected Output:
    {
      createDatingPool: true,
      preferences: ["women", "crypto"]
    }
  `,
};

// https://platform.openai.com/docs/guides/structured-outputs?lang=node.js&example=structured-data
export const parseMomBotMention = async (
  text: string,
): Promise<z.infer<typeof MomBotDatingPoolCreation> | null> => {
  const openai = new OpenAI({
    organization: config.OPENAI.ORGANIZATION,
    apiKey: config.OPENAI.API_KEY,
  });

  const completion = await openai.beta.chat.completions.parse({
    model: 'o3-mini',
    messages: [developerPrompt, { role: 'user', content: text }],
    response_format: zodResponseFormat(
      MomBotDatingPoolCreation,
      'dating_pool_creation_extraction',
    ),
    store: false,
  });

  const message = completion.choices[0].message;

  if (message.refusal) {
    // failed
    return null;
  }

  return message.parsed;
};
