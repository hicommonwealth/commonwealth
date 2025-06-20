import { notifyError, notifySuccess } from 'controllers/app/notifications';
import React, { useState } from 'react';
import { useGetCommunityByIdQuery } from 'state/api/communities';
import { useRerankThreadsMutation } from 'state/api/superAdmin';
import { useDebounce } from 'usehooks-ts';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { CWTextInput } from '../../components/component_kit/new_designs/CWTextInput';
import { openConfirmation } from '../../modals/confirmation_modal';

const RerankThreads = () => {
  const [communityId, setCommunityId] = useState<string>('');
  const debouncedCommunityId = useDebounce<string | undefined>(
    communityId,
    500,
  );
  const { data: community, isLoading: isLoadingCommunity } =
    useGetCommunityByIdQuery({
      id: debouncedCommunityId || '',
      enabled: !!debouncedCommunityId,
    });

  const { mutateAsync: rerankThreads, isPending } = useRerankThreadsMutation();

  const communityNotFound =
    !isLoadingCommunity &&
    !!debouncedCommunityId &&
    Object.keys(community || {})?.length === 0;

  const openConfirmationModal = () => {
    openConfirmation({
      title: 'Rerank Threads',
      description: `Are you sure you want to rerank threads${
        communityId ? ` for community ${communityId}` : ' for all communities'
      }?`,
      buttons: [
        {
          label: 'Rerank',
          buttonType: 'destructive',
          buttonHeight: 'sm',
          onClick: () => {
            rerankThreads({
              community_id: communityId || undefined,
            })
              .then(() => {
                notifySuccess('Threads reranked successfully');
              })
              .catch((e) => {
                notifyError('Error reranking threads');
                console.error(e);
              });
          },
        },
        {
          label: 'Cancel',
          buttonType: 'secondary',
          buttonHeight: 'sm',
        },
      ],
    });
  };

  return (
    <div className="TaskGroup">
      <CWText type="h4">Rerank Threads</CWText>
      <CWText type="caption">
        Reranks threads based on their engagement metrics. This operation can be
        performed for a specific community or for all communities if no
        community ID is provided.
      </CWText>
      <div className="TaskRow">
        <CWTextInput
          value={communityId}
          onInput={(e) => setCommunityId(e?.target?.value?.trim() || '')}
          customError={communityNotFound ? 'Community not found' : ''}
          placeholder="Community ID (optional)"
          fullWidth
        />
        <CWButton
          label="Rerank"
          className="TaskButton"
          disabled={
            (!!debouncedCommunityId &&
              (isLoadingCommunity || communityNotFound)) ||
            isPending
          }
          onClick={openConfirmationModal}
        />
      </div>
    </div>
  );
};

export default RerankThreads;
