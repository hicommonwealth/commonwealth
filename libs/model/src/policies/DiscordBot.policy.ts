import { events, Policy } from '@hicommonwealth/core';

const inputs = {
  DiscordThreadCreated: events.DiscordThreadCreated,
  DiscordThreadBodyUpdated: events.DiscordThreadBodyUpdated,
  DiscordThreadTitleUpdated: events.DiscordThreadTitleUpdated,
  DiscordThreadDeleted: events.DiscordThreadDeleted,
  DiscordThreadCommentCreated: events.DiscordThreadCommentCreated,
  DiscordThreadCommentUpdated: events.DiscordThreadCommentUpdated,
  DiscordThreadCommentDeleted: events.DiscordThreadCommentDeleted,
};

export function DiscordBot(): Policy<typeof inputs> {
  return {
    inputs,
    body: {
      DiscordThreadCreated: async ({ payload }) => {},
      DiscordThreadBodyUpdated: async ({ payload }) => {},
      DiscordThreadTitleUpdated: async ({ payload }) => {},
      DiscordThreadDeleted: async ({ payload }) => {},
      DiscordThreadCommentCreated: async ({ payload }) => {},
      DiscordThreadCommentUpdated: async ({ payload }) => {},
      DiscordThreadCommentDeleted: async ({ payload }) => {},
    },
  };
}
