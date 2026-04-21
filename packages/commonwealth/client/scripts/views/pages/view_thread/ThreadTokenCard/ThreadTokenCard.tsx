import { useFlag } from 'client/scripts/hooks/useFlag';
import type Thread from 'client/scripts/models/Thread';
import app from 'client/scripts/state';
import useGetThreadToken from 'client/scripts/state/api/tokens/getThreadToken';
import Permissions from 'client/scripts/utils/Permissions';
import React from 'react';
import { ThreadTokenWidget } from 'views/components/NewThreadForm/ToketWidget';
import { CreateThreadToken } from './CreateThreadToken';

export type ThreadTokenCardProps = {
  thread: Thread;
  onLaunchClick: () => void;
};

export const ThreadTokenCard = ({
  thread,
  onLaunchClick,
}: ThreadTokenCardProps) => {
  const tokenizedThreadsEnabled = useFlag('tokenizedThreads');
  const communityId = app.activeChainId() || '';

  const isAdmin = Permissions.isSiteAdmin() || Permissions.isCommunityAdmin();
  const isAdminOrMod = isAdmin || Permissions.isCommunityModerator();

  const { data: threadToken } = useGetThreadToken({
    thread_id: thread.id,
    enabled: !!thread.id && !!communityId && tokenizedThreadsEnabled,
  });

  const showAdminPromo =
    isAdminOrMod && tokenizedThreadsEnabled && !threadToken?.token_address;

  if (!tokenizedThreadsEnabled) {
    return null;
  }

  return (
    <>
      {showAdminPromo && <CreateThreadToken onLaunchClick={onLaunchClick} />}
      {!!threadToken?.token_address && (
        <div className="cards-column">
          <ThreadTokenWidget
            tokenizedThreadsEnabled={tokenizedThreadsEnabled}
            threadId={thread.id}
            addressType={app.chain?.base || 'ethereum'}
            tokenCommunity={app.chain?.meta}
          />
        </div>
      )}
    </>
  );
};
