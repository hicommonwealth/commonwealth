import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import { Configuration, OpenAIApi } from 'openai';
import fetch from 'node-fetch';

import type { TypedRequestBody, TypedResponse } from '../types';
import { success } from '../types';
import type { DB } from '../models';
import { AppError } from '../../../common-common/src/errors';

const configuration = new Configuration({
  organization: 'org-D0ty00TJDApqHYlrn1gge2Ql',
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

type generateTextReq = {
  content: string;
};

type generateTextResp = {
  completion: string;
};

const generateText = async (
  models: DB,
  req: TypedRequestBody<generateTextReq>,
  res: TypedResponse<generateTextResp>
) => {
  const { content } = req.body;

  if (!content) {
    throw new AppError('No content provided');
  }

  let completion;
  const SYSTEM_PROMPT = `You are ChatGPT, a large language model trained by OpenAI. 
    Follow the user's instructions carefully. Respond using markdown.`;
  try {
    const response = await openai.createChatCompletion({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: content },
      ],
      max_tokens: 1500,
      temperature: 0.7,
      stop: ['\n'],
    });

    completion = response.data.choices[0].message.content;
    console.log(completion);
  } catch (e) {
    console.log(e);
    throw new AppError('Problem generating text');
  }

  return success(res, { completion });
};

export default generateText;
