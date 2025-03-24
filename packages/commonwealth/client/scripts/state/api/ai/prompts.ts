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

Be authentic, conversational, and focused on starting a meaningful community discussion.

IMPORTANT: Return only the thread content without any introduction, explanations, or meta-text.
  `;
};

const generateTitlePrompt = (context: string) => {
  return `Generate a single-line, concise title (max 100 characters) 
          without quotes or punctuation at the end based on the thread: ${context}`;
};

export { generateThreadPrompt, generateTitlePrompt };
