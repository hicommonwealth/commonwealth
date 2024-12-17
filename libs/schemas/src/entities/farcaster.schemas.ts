import { z } from 'zod';

export const FarcasterAction = z.object({
  url: z.string().url(),
  interactor: z.object({
    object: z.literal('user'),
    fid: z.number(),
    username: z.string(),
    display_name: z.string(),
    pfp_url: z.string().url(),
    custody_address: z.string(),
    profile: z.object({
      bio: z.object({
        text: z.string(),
      }),
    }),
    follower_count: z.number(),
    following_count: z.number(),
    verifications: z.array(z.string()),
    verified_addresses: z.object({
      eth_addresses: z.array(z.string()),
      sol_addresses: z.array(z.string()),
    }),
    verified_accounts: z.array(z.unknown()),
    power_badge: z.boolean(),
  }),
  tapped_button: z.object({
    index: z.number(),
  }),
  state: z.object({
    serialized: z.string(),
  }),
  cast: z.object({
    object: z.literal('cast'),
    hash: z.string(),
    author: z.object({
      object: z.literal('user'),
      fid: z.number(),
      username: z.string(),
      display_name: z.string(),
      pfp_url: z.string().url(),
      custody_address: z.string(),
      profile: z.object({
        bio: z.object({
          text: z.string(),
        }),
      }),
      follower_count: z.number(),
      following_count: z.number(),
      verifications: z.array(z.string()),
      verified_addresses: z.object({
        eth_addresses: z.array(z.string()),
        sol_addresses: z.array(z.string()),
      }),
      verified_accounts: z.array(z.unknown()),
      power_badge: z.boolean(),
      viewer_context: z.object({
        following: z.boolean(),
        followed_by: z.boolean(),
        blocking: z.boolean(),
        blocked_by: z.boolean(),
      }),
    }),
    thread_hash: z.string(),
    parent_hash: z.string().nullable(),
    parent_url: z.string().nullable(),
    root_parent_url: z.string().nullable(),
    parent_author: z.object({
      fid: z.number().nullable(),
    }),
    text: z.string(),
    timestamp: z.string(),
    embeds: z.array(
      z.object({
        url: z.string(),
        metadata: z.object({
          content_type: z.string(),
          content_length: z.number().nullable(),
          _status: z.string(),
          html: z.object({
            ogImage: z.array(
              z.object({
                url: z.string(),
              }),
            ),
            ogTitle: z.string(),
          }),
        }),
      }),
    ),
    channel: z.string().nullable(),
    reactions: z.object({
      likes_count: z.number(),
      recasts_count: z.number(),
      likes: z.array(z.unknown()),
      recasts: z.array(z.unknown()),
    }),
    replies: z.object({
      count: z.number(),
    }),
    mentioned_profiles: z.array(z.unknown()),
    viewer_context: z.object({
      liked: z.boolean(),
      recasted: z.boolean(),
    }),
  }),
  timestamp: z.string(),
});
