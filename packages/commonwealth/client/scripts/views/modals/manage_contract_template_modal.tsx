import React, { useState } from 'react';

import { notifyError } from '../../controllers/app/notifications';
import { useCommonNavigate } from '../../navigation/helpers';
import app from '../../state';
import { CWDivider } from '../components/component_kit/cw_divider';
import {
  CWDropdown,
  DropdownItemType,
} from '../components/component_kit/cw_dropdown';
import { CWText } from '../components/component_kit/cw_text';
import { CWTextInput } from '../components/component_kit/cw_text_input';
import { CWButton } from '../components/component_kit/new_designs/CWButton';
import {
  CWModalBody,
  CWModalFooter,
  CWModalHeader,
} from '../components/component_kit/new_designs/CWModal';

import '../../../styles/modals/manage_contract_template_modal.scss';

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
      enabled_by: app.user.activeAccount.address,
    };

    try {
      await app.contracts.addCommunityContractTemplate(
        communityContractTemplateAndMetadata,
      );

      onModalClose();
    } catch (err) {
      notifyError(err.message);
    }
  };

  const handleSaveEditingTemplate = async (e) => {
    e.preventDefault();

    const { slug, displayOption, nickname, displayName } = form;

    const editedCommunityContractTemplate = {
      cct_id: template.id.toString(),
      slug,
      nickname,
      display_name: displayName,
      display_options: displayOption,
      contract_id: contractId,
    };

    try {
      await app.contracts.editCommunityContractTemplate(
        editedCommunityContractTemplate,
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
      (t) => t.id === selectedTemplateId,
    );

    setForm((prevState) => ({
      ...prevState,
      templateId: selectedTemplateId,
      displayName: selectedTemplate.name,
    }));
  };

  const isEditMode = !!templateId;
  const modalTitle = isEditMode ? 'Edit action' : 'Enable action';
  const modalSubtitle = 'Select an action template';
  const confirmButtonLabel = isEditMode ? 'Save' : 'Add';

  // disable if at least one input is not filled
  const confirmButtonDisabled = !Object.values(form).every(Boolean);

  const templateOptions = contractTemplates.map(({ id, name }) => ({
    value: String(id),
    label: name,
  }));

  const initialTemplateName = isEditMode
    ? templateOptions.find((option) => +option.value === form.templateId)
    : { label: 'Select action template', value: '' };

  const initialDisplayOption = isEditMode
    ? displayOptions.find((option) => option.value === form.displayOption)
    : { label: 'Select display option', value: '' };

  return (
    <div className="ManageContractTemplateModal">
      <CWModalHeader
        label={modalTitle}
        subheader={!isEditMode ? modalSubtitle : ''}
        onModalClose={onModalClose}
      />
      <CWModalBody>
        <div className="form">
          {!isEditMode ? (
            <>
              <CWText
                type="caption"
                fontWeight="medium"
                className="input-label"
              >
                Action template
              </CWText>
              <CWDropdown
                {...(isEditMode
                  ? { containerClassName: 'disabled-dropdown' }
                  : {})}
                initialValue={initialTemplateName}
                label="Choose an action template to enable this action for your community"
                options={templateOptions}
                onSelect={handleSelectTemplate}
              />
            </>
          ) : (
            <CWTextInput
              containerClassName="input-label"
              disabled
              value={initialTemplateName.label}
              label="Action template"
            />
          )}
          {!isEditMode && (
            <CWText className="create-template-info" type="caption">
              Don't see a template that fits your needs?
              <CWText
                type="caption"
                fontWeight="medium"
                className="cta"
                onClick={handleCreateNewTemplate}
              >
                Create a new action template
              </CWText>
            </CWText>
          )}
          <CWDivider className="divider" />
          <CWText type="h5" className="subtitle" fontWeight="medium">
            Set metadata for action
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
            Action details
          </CWText>
          <CWTextInput
            label="Describe what your community can do with this action template"
            value={form.nickname}
            placeholder="Enter description"
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
            label="Provide a unique identifier for your action template's URL address"
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
            Display option
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
      </CWModalBody>
      <CWModalFooter>
        <CWButton
          buttonType="secondary"
          buttonHeight="sm"
          label="Cancel"
          onClick={handleCancel}
        />
        <CWButton
          buttonType="primary"
          buttonHeight="sm"
          label={confirmButtonLabel}
          disabled={confirmButtonDisabled}
          onClick={(e) =>
            isEditMode ? handleSaveEditingTemplate(e) : handleAddTemplate(e)
          }
        />
      </CWModalFooter>
    </div>
  );
};

export default ManageContractTemplateModal;
