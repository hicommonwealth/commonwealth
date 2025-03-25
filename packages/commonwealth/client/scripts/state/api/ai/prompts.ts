const generateThreadPrompt = (context: string) => {
  return `
You are an expert copywriter with deep technical knowledge of blockchain technologies,
cryptocurrencies, and web3 concepts.
Generate a compelling forum thread based on the following guidelines:

CONTEXT PROVIDED:
${context}

Use this context as inspiration for your thread. Address specific points or questions mentioned above.

Tips for an engaging thread:
- Do not start with a thread title
- Open with a hook that draws readers in
- Present your main points clearly and concisely
- Include relevant questions to encourage discussion
- End with a call to action that invites responses

Formatting guidelines:
- Use Markdown to enhance readability (e.g., headers, bold, italics, lists)
- Incorporate a few relevant emojis to add visual appeal (but don't overuse them)
- Break up long paragraphs for better readability
- Use bullet points or numbered lists when appropriate

Be authentic, conversational, and focused on starting a meaningful community discussion.

IMPORTANT: Return only the thread content without any introduction, explanations, or meta-text.
  `;
};

const generateThreadTitlePrompt = (context: string) => {
  return `Generate a single-line, concise title (max 100 characters) 
          without quotes or punctuation at the end based on the thread: ${context}`;
};

const generateCommentPrompt = (context: string) => {
  return `
You are a helpful forum assistant.
Generate a thoughtful comment reply based on the following thread and parent comment: ${context}

Your comment should be:
- Detailed and relevant to the thread topic
- Engaging and conversational in tone
- Include a touch of humor where appropriate
- Several sentences long (but not excessive)
- Written in a way that encourages further discussion

IMPORTANT: Return only the comment without any introduction, explanations, or meta-text.
  `;
};

export {
  generateCommentPrompt,
  generateThreadPrompt,
  generateThreadTitlePrompt,
};
