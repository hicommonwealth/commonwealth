import React, { useState } from 'react';
import { useParams } from 'react-router-dom';

import 'new_contract_template/create_contract_template_form.scss';

import { notifyError } from 'controllers/app/notifications';
import { useCommonNavigate } from 'navigation/helpers';
import app from 'state';
import { CWDivider } from 'views/components/component_kit/cw_divider';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWTextArea } from 'views/components/component_kit/cw_text_area';
import { CWTextInput } from 'views/components/component_kit/cw_text_input';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import isValidJson from '../../../../../shared/validateJson';
import { CWDropdown } from '../../components/component_kit/cw_dropdown';

const CreateContractTemplateForm = () => {
  const navigate = useCommonNavigate();
  const { contract_id } = useParams();

  const [stagedContractId, setStagedContractId] = useState(contract_id);
  const contracts = app.contracts.getCommunityContracts();

  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    displayName: '',
    template: '',
    description: '',
  });

  const createContractTemplate = async () => {
    try {
      setSaving(true);

      console.log({ stagedContractId });

      await app.contracts.addTemplate({
        name: form.displayName,
        template: form.template,
        description: form.description,
        contract_id: stagedContractId,
        community: app.activeChainId(),
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

  const isCreatingDisabled =
    saving ||
    !form.displayName ||
    !form.template ||
    stagedContractId === 'blank';

  return (
    <div className="CreateContractTemplateForm">
      <div className="form">
        <div className="ContractDropdown">
          <CWText type="caption" fontWeight="medium" className="input-label">
            Contract
          </CWText>
          <CWDropdown
            containerClassName="DropdownInput"
            label="Select the contract you want your template to built on"
            initialValue={
              contract_id !== 'blank'
                ? {
                    label: app.contracts.getByIdentifier(contract_id).address,
                    value: contract_id,
                  }
                : { label: 'Select contract address', value: '' }
            }
            options={contracts.map((contract) => {
              return { label: contract.address, value: contract.id.toString() };
            })}
            onSelect={(item) => {
              setStagedContractId(item.value);
            }}
            disabled={contract_id !== 'blank'}
          />
        </div>

        <CWText type="caption" fontWeight="medium" className="input-label">
          Template name
        </CWText>
        <CWTextInput
          value={form.displayName}
          placeholder="Enter display name"
          onInput={(e) => {
            setForm((prevState) => ({
              ...prevState,
              displayName: e.target.value,
            }));
          }}
        />
        <CWText type="caption" fontWeight="medium" className="input-label">
          Template action details
        </CWText>
        <CWTextInput
          label="Describe the action this template enables your community to execute"
          value={form.description}
          placeholder="Enter action details"
          onInput={(e) => {
            setForm((prevState) => ({
              ...prevState,
              description: e.target.value,
            }));
          }}
        />
        <CWText type="caption" fontWeight="medium" className="input-label">
          JSON Blob
        </CWText>
        <CWTextArea
          value={form.template}
          placeholder="Enter code"
          onInput={(e) => {
            setForm((prevState) => ({
              ...prevState,
              template: e.target.value,
            }));
          }}
          inputValidationFn={(value: string) => {
            try {
              const jsonValid = isValidJson(
                JSON.parse(value.replace(/\s/g, '')),
              );
              if (jsonValid) {
                return [];
              }
            } catch (e) {
              return ['failure', 'Invalid Input JSON'];
            }
          }}
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
          label="Create"
          disabled={isCreatingDisabled}
          onClick={createContractTemplate}
        />
      </div>
    </div>
  );
};

export default CreateContractTemplateForm;
