/**
 * Frontend AI Prompt Utilities
 *
 * Note: Text completion prompts (thread, comment, poll) are now generated
 * server-side only to prevent prompt poisoning. The frontend sends entity IDs
 * and the backend builds the context and prompts securely.
 *
 * This file only contains utilities for image generation which has different
 * requirements (user-provided prompt input is acceptable for images).
 */

/**
 * Context for image generation prompts
 */
export interface ImagePromptContext {
  /** The community name */
  communityName?: string;
  /** A description of the community or content */
  communityDescription?: string;
  /** The thread title */
  threadTitle?: string;
  /** The thread body content */
  threadBody?: string;
}

/**
 * Options for generating image prompts
 */
export interface GenerateImagePromptOptions {
  /** The user-provided base prompt */
  basePrompt: string;
  /** Optional context to enhance the prompt */
  context?: ImagePromptContext;
  /** Whether reference images are being provided */
  hasReferenceImages?: boolean;
}

/**
 * Parses an array of "key: value" strings into a structured ImagePromptContext.
 * Used for backward compatibility with components that pass context as string arrays.
 *
 * @param referenceTexts - Array of strings in "Key: Value" format
 * @returns Structured ImagePromptContext or undefined if no valid context
 *
 * @example
 * parseReferenceTextsToContext([
 *   "Community: Ethereum Developers",
 *   "Description: A community for blockchain developers"
 * ]);
 * // Returns: { communityName: "Ethereum Developers", communityDescription: "A community for blockchain developers" }
 */
export function parseReferenceTextsToContext(
  referenceTexts?: string[],
): ImagePromptContext | undefined {
  if (!referenceTexts || referenceTexts.length === 0) {
    return undefined;
  }

  const context: ImagePromptContext = {};

  for (const text of referenceTexts) {
    const colonIndex = text.indexOf(':');
    if (colonIndex === -1) continue;

    const key = text.slice(0, colonIndex).trim().toLowerCase();
    const value = text.slice(colonIndex + 1).trim();

    if (!key || !value) continue;

    switch (key) {
      case 'community':
        context.communityName = value;
        break;
      case 'description':
        context.communityDescription = value;
        break;
      case 'title':
        context.threadTitle = value;
        break;
      case 'body':
        context.threadBody = value;
        break;
    }
  }

  return Object.keys(context).length > 0 ? context : undefined;
}

/**
 * Generates a prompt for image generation, incorporating context and reference images.
 *
 * @param options - The options for generating the image prompt
 * @returns The combined prompt string
 *
 * @example
 * // Basic usage
 * generateImagePromptWithContext({ basePrompt: "A sunset landscape" });
 *
 * @example
 * // With typed context
 * generateImagePromptWithContext({
 *   basePrompt: "Community logo",
 *   context: {
 *     communityName: "Ethereum Developers",
 *     communityDescription: "A community for blockchain developers"
 *   }
 * });
 *
 * @example
 * // With reference images
 * generateImagePromptWithContext({
 *   basePrompt: "Similar style but with mountains",
 *   hasReferenceImages: true,
 *   context: { communityName: "Nature Photography" }
 * });
 */
export function generateImagePromptWithContext({
  basePrompt,
  context,
  hasReferenceImages,
}: GenerateImagePromptOptions): string {
  const trimmedBasePrompt = basePrompt.trim();
  if (!trimmedBasePrompt) {
    return '';
  }

  const hasContext = context && Object.values(context).some(Boolean);
  let prompt = trimmedBasePrompt;

  if (hasReferenceImages && hasContext) {
    const contextString = buildContextString(context);
    prompt =
      `Remix the provided reference image(s) based on the following prompt: ` +
      `"${trimmedBasePrompt}".\n\n${contextString}`;
  } else if (hasReferenceImages) {
    prompt = `Using the provided reference image(s), create a variation based on the prompt: "${trimmedBasePrompt}".`;
  } else if (hasContext) {
    const contextString = buildContextString(context);
    prompt = `Generate an image based on the prompt: "${trimmedBasePrompt}".\n\n${contextString}`;
  }

  return prompt;
}

/**
 * Convenience wrapper that accepts legacy string array format for reference texts.
 *
 * @param basePrompt - The user-provided base prompt
 * @param referenceTexts - Array of "key: value" strings (legacy format)
 * @param hasReferenceImages - Whether reference images are being provided
 * @returns The combined prompt string
 */
export function generateImagePromptFromReferenceTexts(
  basePrompt: string,
  referenceTexts?: string[],
  hasReferenceImages?: boolean,
): string {
  return generateImagePromptWithContext({
    basePrompt,
    context: parseReferenceTextsToContext(referenceTexts),
    hasReferenceImages,
  });
}

/**
 * Builds a formatted context string from context properties
 */
function buildContextString(context: ImagePromptContext): string {
  const lines: string[] = ['Consider the following context:'];

  if (context.communityName) {
    lines.push(`- Community: ${context.communityName}`);
  }
  if (context.communityDescription) {
    lines.push(`- Description: ${context.communityDescription}`);
  }
  if (context.threadTitle) {
    lines.push(`- Thread Title: ${context.threadTitle}`);
  }
  if (context.threadBody) {
    // Truncate body if too long for context
    const maxBodyLength = 200;
    const truncatedBody =
      context.threadBody.length > maxBodyLength
        ? context.threadBody.slice(0, maxBodyLength) + '...'
        : context.threadBody;
    lines.push(`- Thread Content: ${truncatedBody}`);
  }

  return lines.join('\n');
}
