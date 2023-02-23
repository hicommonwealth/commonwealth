/* @jsx m */
import 'modals/manage_contract_template_modal.scss';
import ClassComponent from 'class_component';
import $ from 'jquery';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import m from 'mithril';
import app from 'state';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/cw_button';
import { CWTextInput } from 'views/components/component_kit/cw_text_input';
import type { DropdownItemType } from 'views/components/component_kit/cw_dropdown';
import { CWDropdown } from 'views/components/component_kit/cw_dropdown';
import { notifyError } from 'controllers/app/notifications';
import { CWDivider } from '../components/component_kit/cw_divider';

export const displayOptions = [
  { value: '2', label: 'In Create Dropdown' },
  { value: '1', label: 'In Create Sidebar' },
  { value: '3', label: 'In Create Dropdown and in Create Sidebar' },
  { value: '0', label: 'Hidden' },
];

type ManageContractTemplateModalAttrs = {
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
  templates: Array<{
    id: number;
    abi_id: string;
    template: string;
    name: string;
  }>; // Global Templates
};

export class ManageContractTemplateModal extends ClassComponent<ManageContractTemplateModalAttrs> {
  private form = {
    templateId: null,
    displayName: '',
    nickname: '',
    slug: '',
    displayOption: null,
  };
  private contractTemplates = [];

  closeModalOnSuccess(e) {
    $(e.target).trigger('modalcomplete');
    setTimeout(() => {
      $(e.target).trigger('modalexit');
    }, 0);
  }

  handleCreateNewTemplate(e, contractId: number) {
    const scope = app.customDomainId() || m.route.param('scope');

    $(e.target).trigger('modalexit');
    m.route.set(`/${scope}/new/contract_template/${contractId}`);
  }

  async handleAddTemplate(e, contractId: number) {
    e.preventDefault();

    const communityId = app.activeChainId();
    const { slug, displayOption, nickname, displayName, templateId } =
      this.form;

    const communityContractTemplateAndMetadata = {
      slug,
      nickname,
      display_name: displayName,
      display_options: displayOption,
      community_id: communityId,
      template_id: parseInt(templateId),
      contract_id: contractId,
    };

    try {
      await app.contracts.addCommunityContractTemplate(
        communityContractTemplateAndMetadata
      );

      this.closeModalOnSuccess(e);
      console.log(app.contracts.store);
      m.redraw();
    } catch (err) {
      notifyError(err.message);
    }
  }

  async handleSaveEditingTemplate(e, contractId: number) {
    e.preventDefault();

    const { slug, displayOption, nickname, displayName, templateId } =
      this.form;

    const editedCommunityContractTemplate = {
      cct_id: templateId,
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

      this.closeModalOnSuccess(e);
    } catch (err) {
      notifyError(err.message);
    }
  }

  handleCancel(e) {
    e.preventDefault();
    $(e.target).trigger('modalexit');
  }

  handleSelectTemplate(item: DropdownItemType, templates) {
    const templateId = +item.value;
    const template = templates.find((t) => t.id === templateId);

    this.form.templateId = item.value;
    this.form.displayName = template.name;
  }

  oninit(vnode: m.Vnode<ManageContractTemplateModalAttrs>) {
    const { templateId, template, templates } = vnode.attrs;
    const isEditMode = !!templateId;

    if (isEditMode) {
      this.form.templateId = templateId;
      this.form.displayName = template.displayName;
      this.form.nickname = template.nickname;
      this.form.slug = template.slug;
      this.form.displayOption = template.display;
    }
    this.contractTemplates = templates;
  }

  view(vnode: m.Vnode<ManageContractTemplateModalAttrs>) {
    const { contractId, templateId } = vnode.attrs;

    const isEditMode = !!templateId;
    const modalTitle = isEditMode
      ? 'Edit Template Metadata'
      : 'Connect Template';
    const modalSubtitle = 'Select a template';
    const confirmButtonLabel = isEditMode ? 'Save' : 'Add';

    // disable if at least one input is not filled
    const confirmButtonDisabled = !Object.values(this.form).every(Boolean);

    const templateOptions = this.contractTemplates.map((template) => ({
      value: String(template.id),
      label: template.name,
    }));

    const initialTemplateName = isEditMode
      ? templateOptions.find((option) => +option.value === this.form.templateId)
      : { label: 'Select template type ', value: '' };

    const initialDisplayOption = isEditMode
      ? displayOptions.find(
          (option) => option.value === this.form.displayOption
        )
      : { label: 'Select display option', value: '' };

    return (
      <div class="ManageContractTemplateModal">
        <CWText type="h4">{modalTitle}</CWText>
        {!isEditMode && (
          <CWText type="b1" className="subtitle">
            {modalSubtitle}
          </CWText>
        )}

        <div className="form">
          {!isEditMode ? (
            <>
              <CWText
                type="caption"
                fontWeight="medium"
                className="input-label"
              >
                Template
              </CWText>
              <CWDropdown
                {...(isEditMode
                  ? { containerClassName: 'disabled-dropdown' }
                  : {})}
                initialValue={initialTemplateName}
                label="Choose a template to base your proposal on"
                options={templateOptions}
                onSelect={(item) =>
                  this.handleSelectTemplate(item, this.contractTemplates)
                }
              />
            </>
          ) : (
            <CWTextInput
              containerClassNamee="input-label"
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
                onclick={(e) => this.handleCreateNewTemplate(e, contractId)}
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
            value={this.form.displayName}
            placeholder="Enter display name"
            oninput={(e) => {
              this.form.displayName = e.target.value;
            }}
          />
          <CWText type="caption" fontWeight="medium" className="input-label">
            Nickname
          </CWText>
          <CWTextInput
            label="Give your template instance a name that your community can easily identify"
            value={this.form.nickname}
            placeholder="Enter nickname"
            oninput={(e) => {
              this.form.nickname = e.target.value;
            }}
          />
          <CWText type="caption" fontWeight="medium" className="input-label">
            Slug
          </CWText>
          <CWTextInput
            label="Last part of the URL address that serves as a unique identifier of this template"
            value={this.form.slug}
            placeholder="/placeholder-is-display-name-without-spaces"
            oninput={(e) => {
              this.form.slug = e.target.value;
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
              this.form.displayOption = result.value;
            }}
          />
        </div>

        <div className="footer">
          <CWButton
            buttonType="mini-white"
            label="Cancel"
            onclick={this.handleCancel}
          />
          <CWButton
            buttonType="mini-black"
            label={confirmButtonLabel}
            disabled={confirmButtonDisabled}
            onclick={(e) =>
              isEditMode
                ? this.handleSaveEditingTemplate(e, contractId)
                : this.handleAddTemplate(e, contractId)
            }
          />
        </div>
      </div>
    );
  }
}

type ShowManageContractTemplateModalAttrs = {
  contractId: number;
  templateId?: number;
  template: {
    id: number;
    title: string;
    displayName: string;
    nickname: string;
    slug: string;
    display: string;
  };
  templates: Array<{
    id: number;
    abi_id: string;
    template: string;
    name: string;
  }>; // Global Templates
};

export const showManageContractTemplateModal = ({
  contractId,
  templateId,
  template,
  templates,
}: ShowManageContractTemplateModalAttrs) => {
  app.modals.create({
    modal: ManageContractTemplateModal,
    data: {
      className: 'ManageContractTemplateOuterModal',
      contractId,
      templateId,
      template,
      templates,
    },
  });
};
