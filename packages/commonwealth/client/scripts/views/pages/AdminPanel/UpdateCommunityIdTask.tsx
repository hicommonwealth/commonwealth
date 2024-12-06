import { PRODUCTION_DOMAIN } from '@hicommonwealth/shared';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import React, { useState } from 'react';
import { slugifyPreserveDashes } from 'shared/utils';
import { useGetCommunityByIdQuery } from 'state/api/communities';
import { useDebounce } from 'usehooks-ts';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { updateCommunityId } from 'views/pages/AdminPanel/utils';
import { CWTextInput } from '../../components/component_kit/new_designs/CWTextInput';
import { openConfirmation } from '../../modals/confirmation_modal';

const UpdateCommunityIdTask = () => {
  const openConfirmationModal = () => {
    openConfirmation({
      title: 'Update Community Id',
      description: `Are you sure you want to update ${originalCommunityId} to ${newCommunityId}?`,
      buttons: [
        {
          label: 'Update',
          buttonType: 'destructive',
          buttonHeight: 'sm',
          onClick: async () => {
            try {
              await updateCommunityId({
                community_id: originalCommunityId,
                new_community_id: newCommunityId,
              });
              setOriginalCommunityId('');
              setNewCommunityId('');
              notifySuccess('Community id updated');
            } catch (e) {
              notifyError('Error updating community id');
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

  const [originalCommunityId, setOriginalCommunityId] = useState<string>('');
  const debouncedOriginalCommunityId = useDebounce<string | undefined>(
    originalCommunityId,
    500,
  );
  const { data: originalCommunity, isLoading: isLoadingOriginalCommunity } =
    useGetCommunityByIdQuery({
      id: debouncedOriginalCommunityId || '',
      enabled: !!debouncedOriginalCommunityId,
    });

  const [newCommunityId, setNewCommunityId] = useState<string>('');
  const debouncedNewCommunityId = useDebounce<string | undefined>(
    newCommunityId,
    500,
  );
  const { data: newCommunity, isLoading: isLoadingNewCommunity } =
    useGetCommunityByIdQuery({
      id: debouncedNewCommunityId || '',
      enabled: !!debouncedNewCommunityId,
    });

  const originalCommunityNotFound =
    !isLoadingOriginalCommunity &&
    Object.keys(originalCommunity || {})?.length === 0;
  const newCommunityNameAlreadyExists =
    !isLoadingNewCommunity && Object.keys(newCommunity || {})?.length > 0;
  const isNewCommunityNameValid = slugifyPreserveDashes(newCommunityId || '');

  return (
    <div className="TaskGroup">
      <CWText type="h4">Update Community Id</CWText>
      <CWText type="caption">
        Updates a communities url e.g. ${PRODUCTION_DOMAIN}/cmn-protocol to $
        {PRODUCTION_DOMAIN}/common. This does not update the Community name.
        WARNING: This will set up a redirect from the old community to the new
        community. The old id cannot be used by any other community.
      </CWText>
      <div className="TaskRow">
        <CWTextInput
          value={originalCommunityId}
          onInput={(e) =>
            setOriginalCommunityId(e?.target?.value?.trim() || '')
          }
          customError={originalCommunityNotFound ? 'Community not found' : ''}
          placeholder="Current community id"
          fullWidth
        />
        <CWTextInput
          value={newCommunityId}
          onInput={(e) => setNewCommunityId(e?.target?.value?.trim() || '')}
          customError={
            newCommunityNameAlreadyExists
              ? 'Community name already exists, please use a different name'
              : ''
          }
          placeholder="New community id"
          fullWidth
        />
        <CWButton
          label="Update"
          className="TaskButton"
          disabled={
            isLoadingOriginalCommunity ||
            isLoadingNewCommunity ||
            originalCommunityNotFound ||
            newCommunityNameAlreadyExists ||
            !isNewCommunityNameValid
          }
          onClick={openConfirmationModal}
        />
      </div>
    </div>
  );
};

export default UpdateCommunityIdTask;
