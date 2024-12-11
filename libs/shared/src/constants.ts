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

<<<<<<< HEAD
=======
export const PRODUCTION_DOMAIN = 'common.xyz';

export const BLOG_SUBDOMAIN = `blog.${PRODUCTION_DOMAIN}`;

export const DOCS_SUBDOMAIN = `docs.${PRODUCTION_DOMAIN}`;

>>>>>>> 02ea3589d0 (update domain constants)
export const S3_RAW_ASSET_BUCKET_DOMAIN =
  's3.us-east-1.amazonaws.com/assets.commonwealth.im';
export const S3_ASSET_BUCKET_CDN = 'assets.commonwealth.im';

// The maximum number of characters allowed in 'body' and 'text'
// columns of Threads, Comments, and version history models.
// Full content found by fetching from 'content_url'.
export const MAX_TRUNCATED_CONTENT_LENGTH = 2_000;
