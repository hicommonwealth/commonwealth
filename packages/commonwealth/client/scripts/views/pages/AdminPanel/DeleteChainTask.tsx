import { notifyError, notifySuccess } from 'controllers/app/notifications';
import 'pages/AdminPanel.scss';
import React, { useState } from 'react';
import app from 'state';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWText } from '../../components/component_kit/cw_text';
import { CWTextInput } from '../../components/component_kit/cw_text_input';
import { ValidationStatus } from '../../components/component_kit/cw_validation_text';
import { openConfirmation } from '../../modals/confirmation_modal';
import { deleteCommunity } from './utils';

const DeleteCommunityTask = () => {
  const [deleteCommunityValue, setDeleteCommunityValue] = useState<string>('');
  const [deleteCommunityValueValidated, setDeleteCommunityValueValidated] =
    useState<boolean>(false);

  const openConfirmationModal = () => {
    openConfirmation({
      title: 'Delete Community',
      description: `Are you sure you want to delete ${deleteCommunityValue}? This action cannot be reversed. Note that this will NOT work if there is an admin in the community.`,
      buttons: [
        {
          label: 'Delete',
          buttonType: 'destructive',
          buttonHeight: 'sm',
          onClick: async () => {
            try {
              await deleteCommunity({ id: deleteCommunityValue });
              setDeleteCommunityValue('');
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

  const onInput = (e) => {
    setDeleteCommunityValue(e.target.value);
    if (e.target.value.length === 0) setDeleteCommunityValueValidated(false);
  };

  const validationFn = (value: string): [ValidationStatus, string] | [] => {
    if (!app.config.chains.getById(value)) {
      setDeleteCommunityValueValidated(false);
      return ['failure', 'Community not found'];
    }
    setDeleteCommunityValueValidated(true);
    return [];
  };

  return (
    <div className="TaskGroup">
      <CWText type="h4">Delete Community</CWText>
      <CWText type="caption">
        Removes a CW community (chain) from the DB. This is destructive action
        that cannot be reversed.
      </CWText>
      <div className="TaskRow">
        <CWTextInput
          value={deleteCommunityValue}
          onInput={onInput}
          inputValidationFn={validationFn}
          placeholder="Enter a community id"
        />
        <CWButton
          label="Delete"
          className="TaskButton"
          disabled={!deleteCommunityValueValidated}
          onClick={openConfirmationModal}
        />
      </div>
    </div>
  );
};

export default DeleteCommunityTask;
