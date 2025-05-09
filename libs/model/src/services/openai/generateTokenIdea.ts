import { logger } from '@hicommonwealth/core';
import { OpenAI } from 'openai';
import {
  ChatCompletionMessage,
  ChatCompletionUserMessageParam,
} from 'openai/resources/index.mjs';
import { config } from '../../config';
import { models } from '../../database';
import { LaunchpadTokenInstance } from '../../models/token';
import {
  generateImage,
  ImageGenerationErrors,
} from '../../utils/generateImage';

type GenerateTokenIdeaProps = {
  ideaPrompt?: string;
};

type TokenStyle = 'BRAINROT' | 'POLITICAL' | 'STARTUP';
const TOKEN_STYLES: TokenStyle[] = ['BRAINROT', 'POLITICAL', 'STARTUP'];

const styleHistory: TokenStyle[] = [];

const getRandomStyle = (): TokenStyle => {
  let availableStyles = [...TOKEN_STYLES];

  if (styleHistory.length === 2 && styleHistory[0] === styleHistory[1]) {
    const lastStyle = styleHistory[1];
    availableStyles = TOKEN_STYLES.filter((style) => style !== lastStyle);
    // If somehow all styles were filtered (e.g., only one style defined and it was repeated),
    // fall back to the full list to prevent errors, though this is unlikely with 3 styles.
    if (availableStyles.length === 0) {
      availableStyles = [...TOKEN_STYLES];
    }
  }

  const randomIndex = Math.floor(Math.random() * availableStyles.length);
  const selectedStyle = availableStyles[randomIndex];

  // Update history
  styleHistory.push(selectedStyle);
  if (styleHistory.length > 2) {
    styleHistory.shift(); // Keep only the last two
  }

  return selectedStyle;
};

let selectedTokenStyle: TokenStyle = 'BRAINROT';

const TOKEN_AI_PROMPTS_CONFIG = {
  name: (ideaPrompt?: string): string => {
    selectedTokenStyle = getRandomStyle();
    log.info(`Token generation using style: ${selectedTokenStyle}`);

    const prompts: Record<TokenStyle, string> = {
      BRAINROT: `
        Generate a completely nonsensical community name in lowercase. ${ideaPrompt ? `You can loosely incorporate this concept: "${ideaPrompt}" but don't be too literal. ` : ''}
        Think onomatopoeia, weird sounds, gibberish that feels satisfying to say.
        Examples: bingus bongus, skibidi toilet, scrunkly whenthe, weeble wobble, gloppa glup, tralalero tralala, himbo bumbo, florp nation
        Make it sound like gibberish that feels like an inside joke. No logical meaning needed.
        Keep everything lowercase and provide only the community name itself.
      `,
      POLITICAL: `
        Generate a direct, topical political or news-focused community name. ${ideaPrompt ? `You can incorporate this concept: "${ideaPrompt}". ` : ''}
        Consider a slightly witty, satirical, or cleverly understated take on the topic if appropriate, but keep it recognizable.
        Use only the name of a specific country, region, political issue, or current event - avoid modifiers like "defenders" or "watchers".
        Favor topics that encourage broad discussion or relate to public policy and societal well-being over highly divisive or partisan issues.
        Examples: Ukraine, Taiwan, Silicon Valley, Tariff News, Inflation, Fed Rates, Student Debt, Climate Action, Global Health Initiatives, Urban Development, Space Exploration Policy, Digital Privacy
        Keep it direct and to the point. The community name should clearly relate to the political topic, country, or news subject, even if presented with a humorous angle.
        Use proper capitalization appropriate for the topic and provide only the name itself.
      `,
      STARTUP: `
        Generate a startup-style community name with creative capitalization. ${ideaPrompt ? `You can incorporate this concept: "${ideaPrompt}". ` : ''}
        Should sound like an innovative tech company, AI-driven solution, or unique digital utility.
        Examples: DefiDisruptors, NFT Nexus, MetaVerse Makers, TOKEN TITANS, BlockchainBuilders, Alpha.Finders, DEFI_PULSE, TechDAO, CodeSpark, SnapCalorie, VisionCraft, QueryAI
        Use creative capitalization styles common in tech startups (CamelCase, ALL CAPS sections, etc).
        Provide only the community name itself.
      `,
    };

    return prompts[selectedTokenStyle];
  },

  symbol: (): string => {
    const prompts: Record<TokenStyle, string> = {
      BRAINROT: `
        Create a playful and absurd ticker for this nonsensical community (3-6 uppercase letters).
        Should be fun, slightly weird, and memorable - like it was chosen at 3am by someone who finds random things hilarious.
        Examples: BONG, MEOW, OOOO, BLRP, SKBDI, FLOP, BRRR
        Provide only the uppercase letters.
      `,
      POLITICAL: `
        Create a ticker symbol (3-6 uppercase letters) for this political/news community focused on a specific issue, country, or event.
        The symbol should clearly relate to the specific political topic, country, or newsworthy situation.
        Examples: UKRN, TWAN, BRDR, DEBT, VOTE, INFL, RATE, IRAN
        Aim for immediacy and specificity rather than general political concepts.
        Provide only the uppercase letters.
      `,
      STARTUP: `
        Create a tech-focused, innovative ticker for this startup community (3-6 uppercase letters).
        Should sound like a legitimate crypto project or tech stock.
        Examples: META, TOKEN, DEFI, BLOK, WEB3, NFTY, DAPP
        Provide only the uppercase letters.
      `,
    };

    return prompts[selectedTokenStyle];
  },

  description: (): string => {
    const prompts: Record<TokenStyle, string> = {
      BRAINROT: `
        Write an absurdist, nonsensical, brain rot humor description (under 180 chars) for this community coin.
        Examples:
        - "Creating generational wealth through nonsensical cat memes and the inherent value of going pspspsps."
        - "Where every skibidi equals one token and your brain goes brrr while portfolio does the floppa dance."
        - "The official currency of silly little guys who do a scrunkly whenever number go up."
        Make it feel organic, like it developed naturally in a Discord server full of sleep-deprived people.
      `,
      POLITICAL: `
        Write a straightforward yet potentially witty or subtly humorous description (under 180 chars) for this community coin focused on a specific political topic or news story.
        Mention concrete impacts, reference specific countries, elections, policies, or current events.
        The description can gently poke fun at the absurdities or common tropes within politics or news cycles, while remaining grounded in the actual subject. Aim for clever, not silly.
        Focus on providing an objective overview or highlighting the broader societal relevance of the topic. Aim for an informative and balanced perspective, even with a humorous touch.
        Examples:
        - "Crowdsourcing verified reports from Ukraine's frontlines and rewarding accurate on-the-ground journalism when mainstream coverage falls short."
        - "Supporting candidates committed to student loan forgiveness, with tokens weighted by debt burden and policy expertise. Finally, a way to monetize those loans!"
        - "Tracking Beijing's tech regulation in real-time, incentivizing timely analysis of impacts on global markets and supply chains. Because who needs sleep?"
        Be specific about the exact political issue or news topic being addressed, not generic political activities.
      `,
      STARTUP: `
        Write a clear, direct description (under 180 chars) of what this community coin/app does, like a startup pitch.
        Focus on the specific value proposition and what problem it solves in straightforward terms, whether it's a Web3 project or a general tech/AI application.
        Examples:
        - "Building tools that help communities create and own their digital spaces, with rewards for early adopters and contributors."
        - "Access to exclusive developer resources and early product features. The token that turns users into stakeholders."
        - "Simplifying crypto projects for everyday users. One button to launch your community's financial ecosystem."
        - "AI that turns your food photos into instant calorie counts and nutritional insights. Healthy eating, simplified."
        - "Generate functional code snippets from plain English descriptions, accelerating your development workflow."
        Describe it like you would explain the product to someone who's never heard of it before.
      `,
    };

    return prompts[selectedTokenStyle];
  },

  image: (name: string, symbol: string, description: string): string => {
    const prompts: Record<TokenStyle, string> = {
      BRAINROT: `
        Create a colorful image with strong digital influences that visually represents the following absurd idea: "${description}".
        The ticker symbol is "$${symbol}".
        The digital influence could manifest as CGI-style (2D or appearing 3D), or incorporate elements like pixelation, scanlines, or other digital artifacts, including glitch effects if appropriate.
        The key is a distinctly digital aesthetic that feels like it originated from an online or computer-generated source.
        Maintain vibrant colors and aim for a result that evokes the description and ticker within this digital art style.
      `,
      POLITICAL: `
        Create a compelling image that directly represents the political topic or news subject: "${name}".
        The image should be a clear visual depiction of the theme, issue, or event itself.
        For example, if the topic is 'Climate Change', show an impactful image related to environmental changes. If it's about an election, show a scene related to voting or political campaigns.
        Avoid generic logos or abstract political symbols; aim for a literal and evocative representation of "${name}".
      `,
      STARTUP: `
        Create a sleek, professional logo for a cryptocurrency ticker "$${symbol}" or innovative tech app.
        The logo should look modern and innovative, suitable for a cutting-edge tech application or software.
        Use tech-inspired elements like gradients, geometric shapes, or digital motifs. Consider abstract representations of AI, data, connectivity, or user interface elements.
        Design something that looks like a legitimate tech startup logo.
        Use modern design with clean lines, possibly incorporating blue/purple tech gradients or minimal geometric forms.
        Make it instantly recognizable with a contemporary tech/startup aesthetic.
      `,
    };

    return prompts[selectedTokenStyle];
  },
};

const TokenErrors = {
  OpenAINotConfigured: 'OpenAI key not configured',
  OpenAIInitFailed: 'OpenAI initialization failed',
  RequestFailed: 'failed to generate complete token idea',
  IdeaPromptVoilatesSecurityPolicy:
    'provided `ideaPrompt` voilates content security policy',
};

// we have to maintain this to have "conversational" context with OpenAI
const convoHistory: (ChatCompletionMessage | ChatCompletionUserMessageParam)[] =
  [];

const log = logger(import.meta);

const chatWithOpenAI = async (prompt = '', openai: OpenAI) => {
  convoHistory.push({ role: 'user', content: prompt }); // user msg

  const response = await openai.chat.completions.create({
    model: 'gpt-4.1-mini',
    messages: convoHistory,
  });
  convoHistory.push(response.choices[0].message); // assistant msg

  const result = (response.choices[0].message.content || 'NO_RESPONSE').replace(
    /^"|"$/g, // sometimes openAI adds `"` at the start/end of the response + tweaking the prompt also doesn't help
    '',
  );
  return result;
};

const generateTokenIdea = async function* ({
  ideaPrompt,
}: GenerateTokenIdeaProps): AsyncGenerator {
  if (!config.OPENAI.API_KEY) {
    log.error(TokenErrors.OpenAINotConfigured);
    yield { error: TokenErrors.OpenAINotConfigured };
  }

  const openai = new OpenAI({
    organization: config.OPENAI.ORGANIZATION,
    apiKey: config.OPENAI.API_KEY,
  });

  if (!openai) {
    log.error(TokenErrors.OpenAIInitFailed);
    yield { error: TokenErrors.OpenAIInitFailed };
  }

  let tokenName = '';
  try {
    // generate a unique token name
    let foundToken: LaunchpadTokenInstance | boolean | null = true;
    while (foundToken) {
      tokenName = await chatWithOpenAI(
        TOKEN_AI_PROMPTS_CONFIG.name(ideaPrompt),
        openai,
      );

      foundToken = await models.LaunchpadToken.findOne({
        where: {
          name: tokenName,
        },
      });
    }

    log.info(`Generated name: "${tokenName}" (Style: ${selectedTokenStyle})`);
    yield 'event: name\n';
    yield `data: ${tokenName}\n\n`;

    const tokenSymbol = await chatWithOpenAI(
      TOKEN_AI_PROMPTS_CONFIG.symbol(),
      openai,
    );

    log.info(
      `Generated symbol: "${tokenSymbol}" (Style: ${selectedTokenStyle})`,
    );
    yield 'event: symbol\n';
    yield `data: ${tokenSymbol}\n\n`;

    const tokenDescription = await chatWithOpenAI(
      TOKEN_AI_PROMPTS_CONFIG.description(),
      openai,
    );

    log.info(
      `Generated description: "${tokenDescription}" (Style: ${selectedTokenStyle})`,
    );
    yield 'event: description\n';
    yield `data: ${tokenDescription}\n\n`;

    // Log the image prompt before generating
    const imagePrompt = TOKEN_AI_PROMPTS_CONFIG.image(
      tokenName,
      tokenSymbol,
      tokenDescription,
    );
    log.info(
      `Using image prompt (Style: ${selectedTokenStyle}): ${imagePrompt.substring(0, 100)}...`,
    );

    // generate image url and send the generated url to the client (to save time on s3 upload)
    const imageUrl = await generateImage(imagePrompt, openai, {
      model: 'runware:100@1',
    });

    log.info(`Generated image URL: ${imageUrl.substring(0, 50)}...`);
    yield 'event: imageURL\n';
    yield `data: ${imageUrl}\n\n`;
  } catch (e) {
    log.error('Error in generateTokenIdea', e as Error);
    let error = TokenErrors.RequestFailed;

    if (
      e instanceof OpenAI.APIError &&
      e?.code === 'content_policy_violation'
    ) {
      if (ideaPrompt && !tokenName) {
        error = TokenErrors.IdeaPromptVoilatesSecurityPolicy;
      } else {
        error = ImageGenerationErrors.ImageGenerationFailure;
      }
    }

    yield { error };
  }
};

export { generateTokenIdea };
