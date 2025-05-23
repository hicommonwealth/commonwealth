import { CompletionModel } from '@hicommonwealth/shared';
import { AIModelOption } from 'state/ui/user/localAISettings';
import { ModelOption } from 'views/components/AIModelSelector';

const createModelOption = <T extends CompletionModel>(
  value: T,
  label: string,
): ModelOption => ({
  value,
  label,
});

export const getCompletionModelValue = (
  modelOption: ModelOption | AIModelOption | undefined,
  fallback: CompletionModel = 'gpt-4o',
): CompletionModel => {
  if (!modelOption?.value) return fallback;
  return modelOption.value as string as CompletionModel;
};

export const availableModels: ModelOption[] = [
  createModelOption('gpt-4o', 'GPT-4o'),
  createModelOption('gpt-4o-mini', 'GPT-4o Mini'),
  createModelOption('anthropic/claude-3-7-sonnet', 'Claude 3.7 Sonnet'),
  createModelOption('anthropic/claude-3-5-haiku', 'Claude 3.5 Haiku'),
  createModelOption('google/gemini-flash-1.5', 'Gemini Flash 1.5'),
  createModelOption('google/gemini-pro-1.5', 'Gemini Pro 1.5'),
];

export const AI_SELECTOR_TITLE =
  'Select up to 4 models to generate a variety of auto replies';

export const MAX_MODELS_SELECTABLE = 4;
