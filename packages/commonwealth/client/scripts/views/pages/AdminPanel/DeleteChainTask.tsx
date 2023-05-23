import { notifySuccess, notifyError } from 'controllers/app/notifications';
import React, { useState } from 'react';
import app from 'state';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWText } from '../../components/component_kit/cw_text';
import { CWTextInput } from '../../components/component_kit/cw_text_input';
import { openConfirmation } from '../../modals/confirmation_modal';
import { deleteChain } from './utils';
import 'pages/AdminPanel.scss';
import { ValidationStatus } from '../../components/component_kit/cw_validation_text';

const DeleteChainTask = () => {
  const [deleteChainValue, setDeleteChainValue] = useState<string>('');
  const [deleteChainValueValidated, setDeleteChainValueValidated] =
    useState<boolean>(false);

  const openConfirmationModal = () => {
    openConfirmation({
      title: 'Delete Community',
      description: `Are you sure you want to delete ${deleteChainValue}? This action cannot be reversed. Note that this will NOT work if there is an admin in the community.`,
      buttons: [
        {
          label: 'Delete',
          buttonType: 'mini-red',
          onClick: async () => {
            try {
              await deleteChain({ id: deleteChainValue });
              setDeleteChainValue('');
              notifySuccess('Community deleted');
            } catch (e) {
              notifyError('Error deleting community');

              console.error(e);
            }
          },
        },
        {
          label: 'Cancel',
          buttonType: 'mini-white',
        },
      ],
    });
  };

  const onInput = (e) => {
    setDeleteChainValue(e.target.value);
    if (e.target.value.length === 0) setDeleteChainValueValidated(false);
  };

  const validationFn = (value: string): [ValidationStatus, string] | [] => {
    if (!app.config.chains.getById(value)) {
      setDeleteChainValueValidated(false);
      return ['failure', 'Community not found'];
    }
    setDeleteChainValueValidated(true);
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
          label="Community Id"
          value={deleteChainValue}
          onInput={onInput}
          inputValidationFn={validationFn}
          placeholder="Enter a community id"
        />
        <CWButton
          label="Delete"
          className="TaskButton"
          disabled={!deleteChainValueValidated}
          onClick={openConfirmationModal}
        />
      </div>
    </div>
  );
};

export default DeleteChainTask;
