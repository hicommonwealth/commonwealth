import { notifyError } from 'controllers/app/notifications';
import { useCommonNavigate } from 'navigation/helpers';

import 'new_contract_template/create_contract_template_form.scss';
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import app from 'state';
import { CWButton } from 'views/components/component_kit/cw_button';
import { CWDivider } from 'views/components/component_kit/cw_divider';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWTextArea } from 'views/components/component_kit/cw_text_area';
import { CWTextInput } from 'views/components/component_kit/cw_text_input';
import isValidJson from '../../../../../shared/validateJson';

const CreateContractTemplateForm = () => {
  const navigate = useCommonNavigate();
  const { contract_id } = useParams();

  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    displayName: '',
    template: '',
  });

  const createContractTemplate = async () => {
    try {
      setSaving(true);

      await app.contracts.addTemplate({
        name: form.displayName,
        template: form.template,
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
          Display Name
        </CWText>
        <CWTextInput
          label="An official name to identify this kind of template"
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
