import React, { useState } from 'react';
import { useParams } from 'react-router-dom';

import 'new_contract_template/create_contract_template_form.scss';

import { notifyError } from 'controllers/app/notifications';
import { CWButton } from 'views/components/component_kit/cw_button';
import { CWDivider } from 'views/components/component_kit/cw_divider';
import { CWTextInput } from 'views/components/component_kit/cw_text_input';
import { CWTextArea } from 'views/components/component_kit/cw_text_area';
import { CWText } from 'views/components/component_kit/cw_text';
import app from 'state';
import isValidJson from '../../../../../shared/validateJson';
import { useCommonNavigate } from 'navigation/helpers';

const CreateContractTemplateForm = () => {
  const navigate = useCommonNavigate();
  const { contract_id } = useParams();

  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    displayName: '',
    template: '',
    description: '',
  });

  const createContractTemplate = async () => {
    try {
      setSaving(true);

      await app.contracts.addTemplate({
        name: form.displayName,
        template: form.template,
        description: form.description,
        contract_id,
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

  const isCreatingDisabled = saving || !form.displayName || !form.template;

  return (
    <div className="CreateContractTemplateForm">
      <div className="form">
        <CWText type="caption" fontWeight="medium" className="input-label">
          Template Name
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
          Action details
        </CWText>
        <CWTextInput
          value={form.description}
          placeholder="Briefly describe the action your template enables"
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
          placeholder="Enter relevant JSON Blob"
          onInput={(e) => {
            setForm((prevState) => ({
              ...prevState,
              template: e.target.value,
            }));
          }}
          inputValidationFn={(value: string) => {
            try {
              const jsonValid = isValidJson(
                JSON.parse(value.replace(/\s/g, ''))
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
          buttonType="secondary-black"
          label="Cancel"
          onClick={handleCancel}
        />
        <CWButton
          buttonType="primary-black"
          label="Create"
          disabled={isCreatingDisabled}
          onClick={createContractTemplate}
        />
      </div>
    </div>
  );
};

export default CreateContractTemplateForm;
