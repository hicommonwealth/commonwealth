import { trpc } from 'client/scripts/utils/trpcClient';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import React, { useState } from 'react';
import { CWText } from '../../components/component_kit/cw_text';
import { openConfirmation } from '../../modals/confirmation_modal';
import './AdminPanel.scss';
import CommunityFinder from './CommunityFinder';

const DeleteCommunityTask = () => {
  const [componentKey, setComponentKey] = useState(1);
  const { mutateAsync: deleteCommunity } =
    trpc.community.deleteCommunity.useMutation();

  const openConfirmationModal = (communityIdToDelete: string) => {
    openConfirmation({
      title: 'Delete Community',
      description: `
        Are you sure you want to delete ${communityIdToDelete}? 
        This action cannot be reversed. Note that this will NOT work if there is an admin in the community.
      `,
      buttons: [
        {
          label: 'Delete',
          buttonType: 'destructive',
          buttonHeight: 'sm',
          onClick: async () => {
            try {
              await deleteCommunity({ community_id: communityIdToDelete });
              setComponentKey((key) => key + 1);
              notifySuccess('Community deleted');
            } catch (e) {
              notifyError('Error deleting community');
              console.error(e);
            }
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
    <div className="TaskGroup" key={componentKey}>
      <CWText type="h4">Delete Community</CWText>
      <CWText type="caption">
        Removes a CW community (chain) from the DB. This is destructive action
        that cannot be reversed.
      </CWText>
      <CommunityFinder
        ctaLabel="Delete"
        onAction={(communityId) => openConfirmationModal(communityId)}
      />
    </div>
  );
};

export default DeleteCommunityTask;
