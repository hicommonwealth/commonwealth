import { DiscordMetaSchema } from '@hicommonwealth/schemas';
import { AxiosResponse } from 'axios';
import Thread from 'models/Thread';
import type { Topic } from 'models/Topic';
import { ThreadKind, ThreadStage } from 'models/types';
import { z } from 'zod';

type ActivityResponse = {
  thread: {
    id: number;
    body: string;
    title: string;
    numberOfComments: number;
    created_at: string;
    updated_at: string;
    deleted_at?: string;
    archived_at?: string;
    locked_at?: string;
    read_only: boolean;
    has_poll: boolean;
    kind: ThreadKind;
    stage: ThreadStage;
    marked_as_spam_at?: string;
    discord_meta?: z.infer<typeof DiscordMetaSchema>;
    profile_name: string;
    profile_avatar?: string;
    user_id: number;
    user_address: string;
    topic: Topic;
    community_id: string;
  };
  recentcomments?: [];
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function formatActivityResponse(response: AxiosResponse<any, any>) {
  return (response?.data?.result || []).map(
    (x: ActivityResponse) =>
      new Thread({
        id: x.thread.id,
        avatar_url: x.thread.profile_avatar,
        profile_name: x.thread.profile_name,
        community_id: x.thread.community_id,
        kind: x.thread.kind,
        last_edited: x.thread.updated_at,
        marked_as_spam_at: x.thread.marked_as_spam_at,
        recentComments: x.recentcomments,
        stage: x.thread.stage,
        title: x.thread.title,
        created_at: x.thread.created_at,
        updated_at: x.thread.updated_at,
        body: x.thread.body,
        discord_meta: x.thread.discord_meta,
        numberOfComments: x.thread.numberOfComments,
        read_only: x.thread.read_only,
        archived_at: x.thread.archived_at,
        locked_at: x.thread.locked_at,
        has_poll: x.thread.has_poll,
        Address: {
          address: x.thread.user_address,
          community_id: x.thread.community_id,
          ghost_address: false,
          is_banned: false,
          is_user_default: false,
          role: 'member',
        },
        topic: x?.thread?.topic,
        // filler values
        ThreadVersionHistories: [],
        last_commented_on: '',
        address_last_active: '',
        reaction_weights_sum: '0',
        content_url: '',
      }),
  );
}
