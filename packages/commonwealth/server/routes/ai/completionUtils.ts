import {
  AICompletionType,
  generateCommentPrompt,
  generatePollPrompt,
  generateThreadPrompt,
  StructuredPrompt,
} from '@hicommonwealth/model/services';
import { CompletionModel } from '@hicommonwealth/shared';
import { OpenAI } from 'openai';
import { config } from '../../config';

/**
 * Generates prompt based on completion type and context
 */
export function generatePromptForType(
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

export interface ModelSelectionResult {
  modelId: string;
  addOpenAiWebSearchOptions: boolean;
  error?: string;
}

/**
 * Determines the model ID based on configuration and web search requirements
 */
export function selectModel(
  model: CompletionModel,
  useOpenRouter: boolean,
  webSearchEnabled: boolean,
): ModelSelectionResult {
  let modelId: string = model;
  let addOpenAiWebSearchOptions = false;

  if (useOpenRouter) {
    if (webSearchEnabled) {
      modelId = `${model}:online`;
    }
  } else {
    if (webSearchEnabled) {
      if (model === 'gpt-4o') {
        modelId = 'gpt-4o-search-preview';
        addOpenAiWebSearchOptions = true;
      } else if (model === 'gpt-4o-mini') {
        modelId = 'gpt-4o-mini-search-preview';
        addOpenAiWebSearchOptions = true;
      } else {
        return {
          modelId: model,
          addOpenAiWebSearchOptions: false,
          error:
            'Web search is only supported for gpt-4o and gpt-4o-mini with OpenAI',
        };
      }
    }
  }

  return { modelId, addOpenAiWebSearchOptions };
}

export interface OpenAIClientConfig {
  client: OpenAI;
  useOpenRouter: boolean;
}

/**
 * Creates and configures the OpenAI client based on provider selection
 */
export function createOpenAIClient(useOpenRouter: boolean): OpenAI {
  const apiKey = useOpenRouter
    ? config.OPENAI.OPENROUTER_API_KEY
    : config.OPENAI.API_KEY;

  const openAIConfig = {
    apiKey,
    ...(useOpenRouter && { baseURL: 'https://openrouter.ai/api/v1' }),
    ...(config.OPENAI.ORGANIZATION &&
      !useOpenRouter && {
        organization: config.OPENAI.ORGANIZATION,
      }),
  };

  return new OpenAI(openAIConfig);
}

/**
 * Checks if the required API key is configured for the selected provider
 */
export function getApiKey(useOpenRouter: boolean): string | undefined {
  return useOpenRouter
    ? config.OPENAI.OPENROUTER_API_KEY
    : config.OPENAI.API_KEY;
}

/**
 * Determines whether to use OpenRouter based on explicit flag and config
 * MCP servers require OpenAI, so they override this selection
 */
export function shouldUseOpenRouter(
  explicitUseOpenRouter: boolean,
  hasMCPServers: boolean,
): boolean {
  if (hasMCPServers) {
    return false;
  }
  return explicitUseOpenRouter || config.OPENAI.USE_OPENROUTER === 'true';
}

/**
 * Builds extra headers for OpenRouter requests
 */
export function getOpenRouterHeaders(): Record<string, string> {
  return {
    'HTTP-Referer': 'https://common.xyz',
    'X-Title': 'Common',
  };
}
