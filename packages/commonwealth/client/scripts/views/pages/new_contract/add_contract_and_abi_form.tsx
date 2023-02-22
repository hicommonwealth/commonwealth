import React, { useState } from 'react';

import 'pages/new_contract/add_contract_and_abi_form.scss';

import { isAddress } from 'web3-utils';
import { notifyError } from 'controllers/app/notifications';
import { CWButton } from 'views/components/component_kit/cw_button';
import { CWDivider } from '../../components/component_kit/cw_divider';
import { CWTextInput } from 'views/components/component_kit/cw_text_input';
import { CWTextArea } from 'views/components/component_kit/cw_text_area';

const AddContractAndAbiForm = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [address, setAddress] = useState('');
  const [abi, setAbi] = useState('');

  const addContract = () => {
    try {
      console.log(address, abi);
    } catch (err) {
      notifyError('Failed to add Contract and ABI');
      console.log(err);
    }
  };

  const resetForm = () => {
    setAddress('');
    setAbi('');
  };

  const isAddressValid = isAddress(address);
  const isAbiValid = !!abi;
  const isAddingDisabled = saving || loading || !isAddressValid || !isAbiValid;

  return (
    <div className="AddContractAndAbiForm">
      <div className="form">
        <CWTextInput
          inputValidationFn={() => {
            if (isAddressValid) {
              return [];
            }
            return ['failure', 'Invalid Input'];
          }}
          label="Contract Address"
          value={address}
          placeholder="Enter contract address"
          onInput={(e) => {
            setAddress(e.target.value);
          }}
        />

        <CWTextArea
          label="Contract ABI File"
          value={abi}
          placeholder="Enter contract's ABI file"
          onInput={(e) => {
            setAbi(e.target.value);
          }}
        />
      </div>

      <CWDivider className="divider" />

      <div className="buttons">
        <CWButton
          buttonType="mini-white"
          label="Cancel"
          onClick={() => resetForm()}
        />
        <CWButton
          buttonType="mini-black"
          label="Add"
          disabled={isAddingDisabled}
          onClick={() => addContract()}
        />
      </div>
    </div>
  );
};

export default AddContractAndAbiForm;
