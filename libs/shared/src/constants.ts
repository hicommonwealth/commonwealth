export const ALL_COMMUNITIES = 'all_communities';
export const MAX_COMMUNITY_IMAGE_SIZE_KB = 500;

export const MIN_SCHEMA_INT = 0;
export const MAX_SCHEMA_INT = 2147483647;

export const MIN_SCHEMA_BIGINT = BigInt(0);
export const MAX_SCHEMA_BIGINT = BigInt('9223372036854775807');

export const MIN_SCHEMA_ETH = BigInt(0);
export const MAX_SCHEMA_ETH = BigInt(
  '99999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999',
);

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

export const DISCORD_BOT_NAME = 'Discord Bot';
export const DISCORD_BOT_EMAIL = 'discord@common.xyz';
export const DISCORD_BOT_ADDRESS = '0xdiscordbot';

export const DEFAULT_NAME = 'Anonymous';

export const MAX_RECIPIENTS_PER_WORKFLOW_TRIGGER = 1_000;

export const PRODUCTION_DOMAIN = 'common.xyz';

export const BLOG_SUBDOMAIN = `blog.${PRODUCTION_DOMAIN}`;

export const DOCS_SUBDOMAIN = `docs.${PRODUCTION_DOMAIN}`;

export const S3_RAW_ASSET_BUCKET_DOMAIN =
  's3.us-east-1.amazonaws.com/assets.commonwealth.im';
export const S3_ASSET_BUCKET_CDN = 'assets.commonwealth.im';

// The maximum number of characters allowed in 'body' and 'text'
// columns of Threads, Comments, and version history models.
// Full content found by fetching from 'content_url'.
export const MAX_TRUNCATED_CONTENT_LENGTH = 2_000;

export const TEST_BLOCK_INFO_STRING =
  '{"number":1,"hash":"0x0f927bde6fb00940895178da0d32948714ea6e76f6374f03ffbbd7e0787e15bf","timestamp":1665083987891}';

export const MIN_CHARS_TO_SHOW_MORE = 500;

export const MAX_COMMENT_DEPTH = 8;

export const CONTEST_FEE_PERCENT = 10;

export const UNISWAP_CONVENIENCE_FEE_PERCENT = 0.85; // or 85 Basis Points

export const UNISWAP_CONVENIENCE_FEE_RECIPIENT_ADDRESS = `0xD9CC5e4f556F4069618b5BA28033e81efd40F431`;
