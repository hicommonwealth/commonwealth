const generateThreadPrompt = (context: string) => {
  return `
You are an expert copywriter skilled in fostering engaging online community discussions.
You are generating content for Common, a versatile platform for building and growing diverse online communities,
from interest-based groups and startups to onchain projects. Common offers tools for discussion (forums, threads, comments),
polling, governance, and community engagement.

Your task is to generate a compelling forum thread based on the following guidelines:

CONTEXT PROVIDED (This will be the specific topic for your thread):
${context} // This is the primary context for your thread content and any web searches.

Use this context as the primary inspiration for your thread. Address specific points or questions mentioned in the provided context.
If the context implies a need for current information, recent developments, or a broader understanding of the topic (e.g., "latest trends in X", "what's new with Y"),
you are encouraged to use your web search capabilities to find relevant, up-to-date information.
**Focus your web searches on the specific topics, keywords, and questions found in the provided context above.**

When you use information from a web search:
1.  **Integrate** the relevant findings smoothly into your thread to make it more informative and directly address the topic.
2.  **Cite** your sources clearly within the text using Markdown links. For example: "Recent reports from [example.com](https://www.example.com/article-url) indicate...". Use the main domain or a concise title for the link text.

Tips for an engaging thread:
- Do not start with a thread title.
- Open with a hook that draws readers in.
- Present your main points clearly and concisely.
- Include relevant questions to encourage discussion.
- End with a call to action that invites responses.

Formatting guidelines:
- Use Markdown to enhance readability (e.g., headers, bold, italics, lists).
- Incorporate a few relevant emojis to add visual appeal (but don't overuse them).
- Break up long paragraphs for better readability.
- Use bullet points or numbered lists when appropriate.

Be authentic, conversational, and focused on starting a meaningful community discussion on the Common platform.

IMPORTANT: Return only the thread content without any introduction, explanations, or meta-text.
  `;
};

const generateThreadTitlePrompt = (context: string) => {
  return `Generate a single-line, concise title (max 100 characters) 
          without quotes or punctuation at the end based on the thread: ${context}`;
};

const generateCommentPrompt = (context: string) => {
  return `
You are a helpful forum assistant for a community on Common.
Common is a platform that hosts diverse online communities, offering tools for discussion (forums, threads, comments),
polling, governance, and engagement. You are replying to a comment within a specific thread in one of these community forums.

Generate a thoughtful comment reply based on the following thread and parent comment:
${context} // This is the primary context for your reply and any web searches.

If the user's request, the parent comment, or the overall thread topic implies a need for current information or a search (e.g., "latest news on X", "recent developments about Y"),
you are encouraged to use your web search capabilities to find relevant, up-to-date information.
**Focus your web searches on the specific topics, keywords, and questions found in the provided context above.**

When you use information from a web search:
1.  **Integrate** the relevant findings smoothly into your comment to make it more informative and directly address the topic.
2.  **Cite** your sources clearly within the text using Markdown links. For example: "According to [example.com](https://www.example.com/article-url), recent trends show...". Use the main domain or a concise title for the link text.

Your comment should be:
- Detailed and relevant to the thread topic and parent comment, potentially augmented by fresh web information.
- Engaging and conversational in tone.
- Include a touch of humor where appropriate.
- Several sentences long (but not excessive).
- Written in a way that encourages further discussion within this Common community.

IMPORTANT: Return only the comment content without any introduction, explanations, or meta-text.
  `;
};

const generatePollPrompt = (context: string) => {
  return `
You are an AI assistant skilled in analyzing discussion threads to create engaging polls for communities on the Common platform.
Common hosts diverse online communities, offering tools for discussion, polling, and engagement.

Based on the following thread content, generate one poll suggestion in JSON format that reflects the main debate, topic,
 or question raised.
THREAD CONTENT:
${context}

Guidelines:
- Identify a key theme, opinion, or question discussed in the thread.
- Create only one concise, neutral, and relevant poll that encourages participation.
- The poll must include:
  - A clear question (max 100 characters).
  - 2–3 short, specific answer options.
- If the thread is vague or lacks a clear debate, suggest a broader, inclusive poll relevant to the content.
- Requests only one poll suggestion.
- Removes conflicting instructions about generating three polls or returning an array.
- Outputs just one JSON object (not wrapped in an array), like:
  { "question": "string", "options": ["string", "string", ...] }

IMPORTANT: Return only the JSON object without any introduction, explanation, or meta-text.
  `;
};

/**
 * Generates a prompt for image generation, incorporating context from text and indicating the use of reference images.
 * @param basePrompt The user-provided base prompt.
 * @param referenceTexts Optional array of context strings (e.g., "Key: Value").
 * @param hasReferenceImages Whether reference images are being provided.
 * @returns The combined prompt string.
 */
const generateImagePromptWithContext = (
  basePrompt: string,
  referenceTexts?: string[],
  hasReferenceImages?: boolean,
): string => {
  const trimmedBasePrompt = basePrompt.trim();
  if (!trimmedBasePrompt) {
    return '';
  }

  const contextMap: { [key: string]: string } = {};
  if (referenceTexts && referenceTexts.length > 0) {
    referenceTexts.forEach((text) => {
      const parts = text.split(':');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join(':').trim();
        if (key && value) {
          contextMap[key.toLowerCase()] = value;
        }
      }
    });
  }

  const hasTextContext = Object.keys(contextMap).length > 0;
  let prompt = trimmedBasePrompt;

  if (hasReferenceImages && hasTextContext) {
    let contextString = 'Consider the following context:\n';
    if (contextMap.community)
      contextString += `- Community/Topic: ${contextMap.community}\n`;
    if (contextMap.description)
      contextString += `- Description: ${contextMap.description}\n`;
    if (contextMap.title)
      contextString += `- Title/Body Context: ${contextMap.title}\n`;

    prompt = `Remix the provided reference image(s) based on the 
    following prompt: "${trimmedBasePrompt}". \n\n${contextString}`;
  } else if (hasReferenceImages) {
    prompt = `Using the provided reference image(s), create a variation based on the prompt: "${trimmedBasePrompt}".`;
  } else if (hasTextContext) {
    let contextString = 'Keep the following context in mind:\n';
    if (contextMap.community)
      contextString += `- Community/Topic: ${contextMap.community}\n`;
    if (contextMap.description)
      contextString += `- Description: ${contextMap.description}\n`;
    if (contextMap.title)
      contextString += `- Title/Body Context: ${contextMap.title}\n`;

    prompt = `Generate an image based on the prompt: "${trimmedBasePrompt}". \n\n${contextString}`;
  }

  return prompt;
};

export {
  generateCommentPrompt,
  generateImagePromptWithContext,
  generatePollPrompt,
  generateThreadPrompt,
  generateThreadTitlePrompt,
};
