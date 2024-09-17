import { AxiosResponse } from 'axios';
import Thread from 'models/Thread';
import Topic from 'models/Topic';
import { ThreadKind, ThreadStage } from 'models/types';

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
    discord_meta?: string;
    profile_name: string;
    profile_avatar_url?: string;
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
        // @ts-expect-error <StrictNullChecks/>
        avatar_url: x.thread.profile_avatar_url,
        profile_name: x.thread.profile_name,
        community_id: x.thread.community_id,
        kind: x.thread.kind,
        last_edited: x.thread.updated_at,
        // @ts-expect-error <StrictNullChecks/>
        marked_as_spam_at: x.thread.marked_as_spam_at,
        // @ts-expect-error <StrictNullChecks/>
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
        // @ts-expect-error <StrictNullChecks/>
        locked_at: x.thread.locked_at,
        has_poll: x.thread.has_poll,
        Address: {
          address: x.thread.user_address,
          community_id: x.thread.community_id,
        },
        topic: x?.thread?.topic,
        // filler values
        version_history: null,
        last_commented_on: '',
        address_last_active: '',
        reaction_weights_sum: 0,
      }),
  );
}
