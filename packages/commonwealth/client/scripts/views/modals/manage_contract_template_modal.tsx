import React, { useState } from 'react';

import { CWText } from 'views/components/component_kit/cw_text';
import {
  CWDropdown,
  DropdownItemType,
} from 'views/components/component_kit/cw_dropdown';
import { CWButton } from 'views/components/component_kit/cw_button';
import { CWDivider } from 'views/components/component_kit/cw_divider';
import { CWTextInput } from 'views/components/component_kit/cw_text_input';
import app from 'state';

import 'modals/manage_contract_template_modal.scss';
import { notifyError } from 'controllers/app/notifications';
import { useCommonNavigate } from 'navigation/helpers';

export const displayOptions = [
  { value: '2', label: 'In Create Dropdown' },
  { value: '1', label: 'In Create Sidebar' },
  { value: '3', label: 'In Create Dropdown and in Create Sidebar' },
  { value: '0', label: 'Hidden' },
];

export interface ManageContractTemplateModalProps {
  contractId: number;
  templateId?: number;
  template: {
    id: number;
    title: string;
    displayName: string;
    nickname: string;
    slug: string;
    display: string;
  }; // CCT for this Template
  contractTemplates: Array<{
    id: number;
    abi_id: string;
    template: string;
    name: string;
  }>; // Global Templates
  onModalClose: () => void;
}

const getInitForm = (templateId, template) =>
  templateId
    ? {
        templateId: templateId,
        displayName: template.displayName,
        nickname: template.nickname,
        slug: template.slug,
        displayOption: template.display,
      }
    : {
        templateId: null,
        displayName: '',
        nickname: '',
        slug: '',
        displayOption: null,
      };

const ManageContractTemplateModal = ({
  templateId,
  template,
  contractTemplates,
  contractId,
  onModalClose,
}: ManageContractTemplateModalProps) => {
  const navigate = useCommonNavigate();

  const [form, setForm] = useState(getInitForm(templateId, template));

  const handleCreateNewTemplate = () => {
    navigate(`/new/contract_template/${contractId}`);
  };

  const handleAddTemplate = async (e) => {
    e.preventDefault();

    const communityId = app.activeChainId();
    const {
      slug,
      displayOption,
      nickname,
      displayName,
      templateId: templateIdForm,
    } = form;

    const communityContractTemplateAndMetadata = {
      slug,
      nickname,
      display_name: displayName,
      display_options: displayOption,
      community_id: communityId,
      template_id: templateIdForm,
      contract_id: contractId,
    };

    try {
      await app.contracts.addCommunityContractTemplate(
        communityContractTemplateAndMetadata
      );

      onModalClose();
    } catch (err) {
      notifyError(err.message);
    }
  };

  const handleSaveEditingTemplate = async (e) => {
    e.preventDefault();

    const {
      slug,
      displayOption,
      nickname,
      displayName,
      templateId: templateIdForm,
    } = form;

    const editedCommunityContractTemplate = {
      cct_id: templateIdForm,
      slug,
      nickname,
      display_name: displayName,
      display_options: displayOption,
      contract_id: contractId,
    };

    try {
      await app.contracts.editCommunityContractTemplate(
        editedCommunityContractTemplate
      );

      onModalClose();
    } catch (err) {
      notifyError(err.message);
    }
  };

  const handleCancel = () => {
    onModalClose();
  };

  const handleSelectTemplate = (item: DropdownItemType) => {
    const selectedTemplateId = +item.value;
    const selectedTemplate = contractTemplates.find(
      (t) => t.id === selectedTemplateId
    );

    setForm((prevState) => ({
      ...prevState,
      templateId: selectedTemplateId,
      displayName: selectedTemplate.name,
    }));
  };

  const isEditMode = !!templateId;
  const modalTitle = isEditMode ? 'Edit Template Metadata' : 'Connect Template';
  const modalSubtitle = 'Select a template';
  const confirmButtonLabel = isEditMode ? 'Save' : 'Add';

  // disable if at least one input is not filled
  const confirmButtonDisabled = !Object.values(form).every(Boolean);

  const templateOptions = contractTemplates.map(({ id, name }) => ({
    value: String(id),
    label: name,
  }));

  const initialTemplateName = isEditMode
    ? templateOptions.find((option) => +option.value === form.templateId)
    : { label: 'Select template type ', value: '' };

  const initialDisplayOption = isEditMode
    ? displayOptions.find((option) => option.value === form.displayOption)
    : { label: 'Select display option', value: '' };

  return (
    <div className="ManageContractTemplateModal">
      <CWText type="h4">{modalTitle}</CWText>
      {!isEditMode && (
        <CWText type="b1" className="subtitle">
          {modalSubtitle}
        </CWText>
      )}

      <div className="form">
        {!isEditMode ? (
          <>
            <CWText type="caption" fontWeight="medium" className="input-label">
              Template
            </CWText>
            <CWDropdown
              {...(isEditMode
                ? { containerClassName: 'disabled-dropdown' }
                : {})}
              initialValue={initialTemplateName}
              label="Choose a template to base your proposal on"
              options={templateOptions}
              onSelect={handleSelectTemplate}
            />
          </>
        ) : (
          <CWTextInput
            containerClassName="input-label"
            disabled
            value={initialTemplateName.label}
            label="Template"
          />
        )}
        {!isEditMode && (
          <CWText className="create-template-info" type="caption">
            Don’t see a template that fits your needs?
            <CWText
              type="caption"
              fontWeight="medium"
              className="cta"
              onClick={handleCreateNewTemplate}
            >
              Create a New Template
            </CWText>
          </CWText>
        )}
        <CWDivider className="divider" />
        <CWText type="b1" className="subtitle">
          Set metadata for template instance
        </CWText>
        <CWText type="caption" fontWeight="medium" className="input-label">
          Display Name
        </CWText>
        <CWTextInput
          label="Give your template instance an official new name"
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
          Nickname
        </CWText>
        <CWTextInput
          label="Give your template instance a name that your community can easily identify"
          value={form.nickname}
          placeholder="Enter nickname"
          onInput={(e) => {
            setForm((prevState) => ({
              ...prevState,
              nickname: e.target.value,
            }));
          }}
        />
        <CWText type="caption" fontWeight="medium" className="input-label">
          Slug
        </CWText>
        <CWTextInput
          label="Last part of the URL address that serves as a unique identifier of this template"
          value={form.slug}
          placeholder="/placeholder-is-display-name-without-spaces"
          onInput={(e) => {
            setForm((prevState) => ({
              ...prevState,
              slug: e.target.value,
            }));
          }}
        />
        <CWText type="caption" fontWeight="medium" className="input-label">
          Display Option
        </CWText>
        <CWDropdown
          label="Choose where to display template"
          initialValue={initialDisplayOption}
          options={displayOptions}
          onSelect={(result) => {
            setForm((prevState) => ({
              ...prevState,
              displayOption: result.value,
            }));
          }}
        />
      </div>

      <div className="footer">
        <CWButton
          buttonType="mini-white"
          label="Cancel"
          onClick={handleCancel}
        />
        <CWButton
          buttonType="mini-black"
          label={confirmButtonLabel}
          disabled={confirmButtonDisabled}
          onClick={(e) =>
            isEditMode ? handleSaveEditingTemplate(e) : handleAddTemplate(e)
          }
        />
      </div>
    </div>
  );
};

export default ManageContractTemplateModal;
