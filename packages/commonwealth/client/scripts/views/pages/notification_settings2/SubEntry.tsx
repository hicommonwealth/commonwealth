import { ThreadSubscription } from '@hicommonwealth/schemas';
import { getThreadUrl } from '@hicommonwealth/shared';
import { getRelativeTimestamp } from 'helpers/dates';
import React, { useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCommunityUrl } from 'utils';
import { trpc } from 'utils/trpcClient';
import { CWCommunityAvatar } from 'views/components/component_kit/cw_community_avatar';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWThreadAction } from 'views/components/component_kit/new_designs/cw_thread_action';
import { User } from 'views/components/user/user';
import { z } from 'zod';

interface SubscriptionEntryProps {
  readonly thread: z.infer<typeof ThreadSubscription>['Thread'];
}

export const SubEntry = (props: SubscriptionEntryProps) => {
  const { thread } = props;
  const thread_id = thread.id;

  const threadUrl = getThreadUrl(
    {
      chain: thread.community_id,
      id: thread.id,
      title: thread.title,
    },
    undefined,
    true,
  );

  const navigate = useNavigate();

  const handleComment = useCallback(() => {
    navigate(threadUrl);
  }, [navigate, threadUrl]);

  const hasSubscriptionRef = useRef<boolean>(true);

  const createThreadSubscriptionMutation =
    trpc.subscription.createThreadSubscription.useMutation();

  const deleteThreadSubscriptionMutation =
    trpc.subscription.deleteThreadSubscription.useMutation();

  const deleteThreadSubscription = useCallback(() => {
    deleteThreadSubscriptionMutation.mutate({ thread_id });
  }, [deleteThreadSubscriptionMutation]);

  const createThreadSubscription = useCallback(() => {
    createThreadSubscriptionMutation.mutate({ thread_id });
  }, [createThreadSubscriptionMutation]);

  const toggleSubscription = useCallback(() => {
    if (hasSubscriptionRef.current) {
      deleteThreadSubscription();
    } else {
      createThreadSubscription();
    }

    hasSubscriptionRef.current = !hasSubscriptionRef.current;
  }, [createThreadSubscription, deleteThreadSubscription]);

  return (
    <div className="SubEntry">
      <div className="SubHeader">
        <div>
          <CWCommunityAvatar
            community={{
              iconUrl: thread.Community.icon_url,
              name: thread.Community.name,
            }}
            size="small"
          />
        </div>
        <div style={{ marginLeft: '8px' }}>
          <Link to={getCommunityUrl(thread.Community.name)}>
            <CWText fontWeight="semiBold">{thread.Community.name}</CWText>
          </Link>
        </div>

        <div style={{ marginLeft: '8px', marginRight: '8px' }}>•</div>

        <div>
          <User
            userAddress={thread.Address.address}
            userCommunityId={thread.Community.id}
          />
        </div>

        <div style={{ marginLeft: '8px', marginRight: '8px' }}>•</div>

        <div>{getRelativeTimestamp(thread.created_at.getTime())}</div>
      </div>
      <div>
        <CWText type="h4" fontWeight="semiBold">
          <Link to={threadUrl}>
            <CWText type="h4">{decodeURIComponent(thread.title)}</CWText>
          </Link>
        </CWText>
      </div>

      <div className="SubFooter">
        <CWThreadAction
          label={`${thread.comment_count}`}
          action="comment"
          onClick={(e) => {
            e.preventDefault();
            handleComment();
          }}
        />
      </div>
    </div>
  );
};
