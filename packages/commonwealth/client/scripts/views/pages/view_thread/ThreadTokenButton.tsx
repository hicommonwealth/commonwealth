import React, { useState } from 'react';
import { useGetThreadToken } from 'state/api/tokens';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import ThreadTokenModal from '../../modals/ThreadTokenModal';

interface ThreadTokenButtonProps {
  threadId: number;
  threadTitle: string;
  communityId: string;
  addressType: string;
  chainNode?: any;
  tokenCommunity?: any;
}

const ThreadTokenButton = ({
  threadId,
  threadTitle,
  communityId,
  addressType,
  chainNode,
  tokenCommunity,
}: ThreadTokenButtonProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: threadToken, isLoading } = useGetThreadToken({
    thread_id: threadId,
    enabled: !!threadId,
  });

  if (!threadToken && !isLoading) {
    return <></>;
  }

  if (isLoading) {
    return (
      <CWButton
        label="Loading..."
        buttonType="secondary"
        buttonWidth="narrow"
        disabled
      />
    );
  }

  return (
    <>
      <CWButton
        label="Trade Thread Token"
        buttonType="primary"
        buttonWidth="narrow"
        onClick={() => setIsModalOpen(true)}
      />

      <ThreadTokenModal
        isOpen={isModalOpen}
        onModalClose={() => setIsModalOpen(false)}
        threadId={threadId}
        communityId={communityId}
        addressType={addressType}
        chainNode={chainNode}
        tokenCommunity={tokenCommunity}
      />
    </>
  );
};

export default ThreadTokenButton;
