// Direct OpenAI models (without provider prefix)
export type OpenAIModel =
  | 'gpt-4o'
  | 'gpt-4o-mini'
  | 'gpt-4-turbo'
  | 'gpt-3.5-turbo'
  | 'o1'
  | 'o1-mini';

// OpenRouter models (with provider prefixes)
export type OpenRouterModel =
  // OpenAI models with provider prefix
  | 'openai/gpt-4o'
  | 'openai/gpt-4o-mini'
  | 'openai/gpt-4-turbo'
  | 'openai/gpt-3.5-turbo'
  | 'openai/o1'
  | 'openai/o1-mini'

  // Anthropic models
  | 'anthropic/claude-3-5-sonnet'
  | 'anthropic/claude-3-5-haiku'
  | 'anthropic/claude-3-opus'
  | 'anthropic/claude-3-sonnet'
  | 'anthropic/claude-3-haiku'
  | 'anthropic/claude-3-7-sonnet'

  // Meta models
  | 'meta-llama/llama-3-70b-instruct'
  | 'meta-llama/llama-3-8b-instruct'
  | 'meta-llama/llama-3-1-70b-instruct'

  // Google models
  | 'google/gemini-pro'
  | 'google/gemini-pro-1.5'
  | 'google/gemini-flash-1.5'

  // Mistral models
  | 'mistralai/mistral-large'
  | 'mistralai/mistral-medium'
  | 'mistralai/mistral-small'
  | 'mistralai/mixtral-8x22b-instruct'

  // Other notable models
  | 'cohere/command-r-plus'
  | 'cohere/command-r'
  | 'microsoft/phi-3-medium-128k-instruct'
  | 'qwen/qwen-2-72b-instruct';

// Union type that includes both OpenAI and OpenRouter models
export type CompletionModel = OpenAIModel | OpenRouterModel;

// Supported image generation models
export type ImageGenerationModel = 'gpt-image-1' | 'runware:100@1';

export interface CompletionOptions {
  prompt: string;
  systemPrompt?: string;
  model?: CompletionModel;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  useOpenRouter?: boolean;
  useWebSearch?: boolean;
  /** Optional MCP server URL to direct the completion request */
  mcpServerUrl?: string;
}

export interface CompletionResponse {
  completion: string;
  error?: string;
  status?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: any;
}
