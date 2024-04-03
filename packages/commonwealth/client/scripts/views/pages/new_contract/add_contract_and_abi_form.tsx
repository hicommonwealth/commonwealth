import React, { useState } from 'react';

import 'pages/new_contract/add_contract_and_abi_form.scss';

import { notifyError } from 'controllers/app/notifications';
import app from 'state';
import { CWDivider } from 'views/components/component_kit/cw_divider';
import { CWTextArea } from 'views/components/component_kit/cw_text_area';
import { CWTextInput } from 'views/components/component_kit/cw_text_input';
import { CWButton } from 'views/components/component_kit/new_designs/cw_button';
import { isAddress } from 'web3-utils';

import { useCommonNavigate } from 'navigation/helpers';

const AddContractAndAbiForm = () => {
  const navigate = useCommonNavigate();

  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    address: '',
    abi: '',
  });

  const handleAddContract = async () => {
    try {
      setSaving(true);
      const chainNodeId = app.chain.meta.ChainNode.id;

      await app.contracts.addContractAndAbi({
        chain_node_id: chainNodeId,
        abi: form.abi,
        address: form.address,
      });

      navigate(`/contracts`);
    } catch (err) {
      notifyError(err.message);
      console.log(err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(`/contracts`);
  };

  const handleContractInput = async (e) => {
    const newAddress = e.target.value;
    setForm((prevState) => ({ ...prevState, address: newAddress }));

    if (isAddress(newAddress)) {
      const fetchedAbi = await app.contracts.getAbiFromEtherscan(newAddress);
      setForm((prevState) => ({
        ...prevState,
        abi: JSON.stringify(fetchedAbi),
      }));
    }
  };

  const isAddressValid = isAddress(form.address);
  const isAddingDisabled = saving || !isAddressValid || !form.abi;

  return (
    <div className="AddContractAndAbiForm">
      <div className="form">
        <CWTextInput
          inputValidationFn={(value: string) => {
            if (isAddress(value)) {
              return [];
            }
            return ['failure', 'Invalid Input'];
          }}
          label="Contract address"
          value={form.address}
          placeholder="Enter contract address"
          onInput={handleContractInput}
        />

        <CWTextArea
          label="Contract ABI file"
          value={form.abi}
          placeholder="Enter contract's ABI file"
          onInput={(e) =>
            setForm((prevState) => ({
              ...prevState,
              abi: e.target.value,
            }))
          }
        />
      </div>

      <CWDivider className="divider" />

      <div className="buttons">
        <CWButton
          buttonType="secondary"
          label="Cancel"
          onClick={handleCancel}
        />
        <CWButton
          label="Add"
          disabled={isAddingDisabled}
          onClick={handleAddContract}
        />
      </div>
    </div>
  );
};

export default AddContractAndAbiForm;
