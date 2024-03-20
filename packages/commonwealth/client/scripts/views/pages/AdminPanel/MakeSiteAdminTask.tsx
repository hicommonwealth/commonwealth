import { notifyError, notifySuccess } from 'controllers/app/notifications';
import 'pages/AdminPanel.scss';
import React, { useState } from 'react';
import { isAddress } from 'web3-utils';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWText } from '../../components/component_kit/cw_text';
import { CWTextInput } from '../../components/component_kit/cw_text_input';
import { ValidationStatus } from '../../components/component_kit/cw_validation_text';
import { openConfirmation } from '../../modals/confirmation_modal';
import { updateSiteAdmin } from './utils';

const MakeSiteAdminTask = () => {
  const [address, setAddress] = useState<string>('');
  const [addressValidated, setAddressValidated] = useState<boolean>(false);

  const onInput = (e) => {
    setAddress(e.target.value);
    if (e.target.value.length === 0) setAddressValidated(false);
  };

  const onPromote = () => {
    openConfirmation({
      title: 'Promote to Site Admin',
      description: `Are you sure you want promote ${address} to super admin? The apotheosis of a user is not to be taken lightly.`,
      buttons: [
        {
          label: 'promote',
          buttonType: 'primary',
          buttonHeight: 'sm',
          onClick: async () => {
            try {
              await updateSiteAdmin({
                address: address,
                siteAdmin: true,
              });
              setAddress('');
              notifySuccess('Address promoted');
            } catch (e) {
              notifyError('Error promoting address');

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

  const validationFn = (value: string): [ValidationStatus, string] | [] => {
    if (!isAddress(value)) {
      setAddressValidated(false);
      return ['failure', 'Not an address'];
    }
    setAddressValidated(true);
    return [];
  };

  return (
    <div className="TaskGroup">
      <CWText type="h4">Make Site Admin</CWText>
      <CWText type="caption">
        Makes a user (corresponding to a specified address) a site-wide admin.
        Don&apos;t do this unless you know what you&apos;re doing.
      </CWText>
      <div className="TaskRow">
        <CWTextInput
          value={address}
          onInput={onInput}
          inputValidationFn={validationFn}
          placeholder="Enter an address to promote to site admin"
        />
        <CWButton
          label="Promote"
          className="TaskButton"
          disabled={!addressValidated}
          onClick={onPromote}
        />
      </div>
    </div>
  );
};

export default MakeSiteAdminTask;
