export const ALL_COMMUNITIES = 'all_communities';
export const MAX_COMMUNITY_IMAGE_SIZE_KB = 500;

export const MIN_SCHEMA_INT = 0;
export const MAX_SCHEMA_INT = 2147483647;

export const MIN_SCHEMA_BIGINT = BigInt(0);
export const MAX_SCHEMA_BIGINT = BigInt('9223372036854775807');

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

export const DISCORD_BOT_NAME = 'Discord Bot';
export const DISCORD_BOT_EMAIL = 'discord@common.xyz';
export const DISCORD_BOT_ADDRESS = '0xdiscordbot';

export const DEFAULT_NAME = 'Anonymous';

export const MAX_RECIPIENTS_PER_WORKFLOW_TRIGGER = 1_000;

export const S3_RAW_ASSET_BUCKET_DOMAIN =
  's3.us-east-1.amazonaws.com/assets.commonwealth.im';
export const S3_ASSET_BUCKET_CDN = 'assets.commonwealth.im';

// The maximum number of characters allowed in 'body' and 'text'
// columns of Threads, Comments, and version history models.
// Full content found by fetching from 'content_url'.
export const MAX_TRUNCATED_CONTENT_LENGTH = 2_000;
