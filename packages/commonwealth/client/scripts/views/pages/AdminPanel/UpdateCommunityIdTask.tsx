import { notifyError, notifySuccess } from 'controllers/app/notifications';
import React, { useState } from 'react';
import app from 'state';
import { CWButton } from 'views/components/component_kit/cw_button';
import { CWText } from 'views/components/component_kit/cw_text';
import { ValidationStatus } from 'views/components/component_kit/cw_validation_text';
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

  function validateFn(
    this: { new: boolean },
    value: string,
  ): [ValidationStatus, string] | [] {
    const communityExists = app.config.chains.getById(value);

    if (communityExists && this.new) {
      setNewValueValidated(false);
      return ['failure', 'Community already exists'];
    } else if (!communityExists && !this.new) {
      setOriginalValueValidated(false);
      return ['failure', 'Community not found'];
    }

    if (this.new) setNewValueValidated(true);
    else setOriginalValueValidated(true);
    return [];
  }

  return (
    <div className="TaskGroup">
      <CWText type="h4">Update Community Id</CWText>
      <CWText type="caption">
        Updates a communities url e.g. commonwealth.im/cmn-protocol to
        commonwealth.im/common
      </CWText>
      <div className="TaskRow">
        <CWTextInput
          value={originalCommunityValue}
          onInput={(e) => {
            setOriginalCommunityValue(e.target.value);
            if (e.target.value.length === 0) setOriginalValueValidated(false);
          }}
          inputValidationFn={validateFn.bind({ new: false })}
          placeholder="Enter a community id"
        />
        <CWTextInput
          value={newCommunityValue}
          onInput={(e) => {
            setNewCommunityValue(e.target.value);
            if (e.target.value.length === 0) setNewValueValidated(false);
          }}
          inputValidationFn={validateFn.bind({ new: true })}
          placeholder="Enter a community id"
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
