import { notifyError, notifySuccess } from 'controllers/app/notifications';
import React, { useState } from 'react';
import app from 'state';
import { slugifyPreserveDashes } from 'utils';
import { CWText } from 'views/components/component_kit/cw_text';
import { ValidationStatus } from 'views/components/component_kit/cw_validation_text';
import { CWButton } from 'views/components/component_kit/new_designs/cw_button';
import { updateCommunityId } from 'views/pages/AdminPanel/utils';
import { CWTextInput } from '../../components/component_kit/cw_text_input';
import { openConfirmation } from '../../modals/confirmation_modal';

const UpdateCommunityIdTask = () => {
  const [originalCommunityValue, setOriginalCommunityValue] =
    useState<string>('');
  const [originalValueValidated, setOriginalValueValidated] =
    useState<boolean>(false);

  const [newCommunityValue, setNewCommunityValue] = useState<string>('');
  const [newValueValidated, setNewValueValidated] = useState<boolean>(false);

  const openConfirmationModal = () => {
    openConfirmation({
      title: 'Update Community Id',
      description: `Are you sure you want to update ${originalCommunityValue} to ${newCommunityValue}?`,
      buttons: [
        {
          label: 'Update',
          buttonType: 'destructive',
          buttonHeight: 'sm',
          onClick: async () => {
            try {
              await updateCommunityId({
                community_id: originalCommunityValue,
                new_community_id: newCommunityValue,
              });
              setOriginalCommunityValue('');
              setNewCommunityValue('');
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

  const validateFn = (
    value: string,
    isNewCommunityId: boolean,
  ): [ValidationStatus, string] | [] => {
    const communityExists = app.config.chains.getById(value);

    if (communityExists && isNewCommunityId) {
      setNewValueValidated(false);
      return ['failure', 'Community already exists'];
    } else if (!communityExists && !isNewCommunityId) {
      setOriginalValueValidated(false);
      return ['failure', 'Community not found'];
    } else if (isNewCommunityId && value !== slugifyPreserveDashes(value)) {
      setNewValueValidated(false);
      return ['failure', 'Incorrect format.'];
    } else if (!isNewCommunityId && value !== slugifyPreserveDashes(value)) {
      setOriginalValueValidated(false);
      return ['failure', 'Incorrect format'];
    }

    if (isNewCommunityId) {
      setNewValueValidated(true);
    } else setOriginalValueValidated(true);
    return [];
  };

  return (
    <div className="TaskGroup">
      <CWText type="h4">Update Community Id</CWText>
      <CWText type="caption">
        Updates a communities url e.g. commonwealth.im/cmn-protocol to
        commonwealth.im/common. This does not update the Community name.
        WARNING: This will set up a redirect from the old community to the new
        community. The old id cannot be used by any other community.
      </CWText>
      <div className="TaskRow">
        <CWTextInput
          value={originalCommunityValue}
          onInput={(e) => {
            setOriginalCommunityValue(e.target.value);
            if (e.target.value.length === 0) setOriginalValueValidated(false);
          }}
          inputValidationFn={(value) => validateFn(value, false)}
          placeholder="Current community id"
        />
        <CWTextInput
          value={newCommunityValue}
          onInput={(e) => {
            setNewCommunityValue(e.target.value);
            if (e.target.value.length === 0) setNewValueValidated(false);
          }}
          inputValidationFn={(value) => validateFn(value, true)}
          placeholder="New community id"
        />
        <CWButton
          label="Update"
          className="TaskButton"
          disabled={!newValueValidated || !originalValueValidated}
          onClick={openConfirmationModal}
        />
      </div>
    </div>
  );
};

export default UpdateCommunityIdTask;
