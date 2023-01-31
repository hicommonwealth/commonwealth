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
import {
  CWDropdown,
  DropdownItemType,
} from 'views/components/component_kit/cw_dropdown';
import { notifyError } from 'controllers/app/notifications';

// TODO this should be aligned with display_options
const displayOptions = [
  { value: '2', label: 'In Create Dropdown' },
  { value: '1', label: 'In Create Sidebar' },
  { value: '3', label: 'In Create Dropdown and in Create Sidebar' },
  { value: '0', label: 'Hidden' },
];

// TODO: In the final app, this will come from the /status route
// and be accessible via app.templates or something to that effect
const templates = [
  {
    id: 1,
    title: 'Treasury Spend',
    displayName: 'New Treasury Proposal 1',
    nickname: 'Little Treasures',
    slug: '/whatever-was-here-for-add-template',
    displayOption: 3,
  },
  {
    id: 2,
    title: 'Parameter Change',
    displayName: 'New Treasury Proposal 2',
    nickname: 'Little Treasures 2',
    slug: '/whatever-was-here-for-add-template-2',
    displayOption: 2,
  },
];

type ManageContractTemplateModalAttrs = {
  contractId: number;
  templateId?: number;
};

export class ManageContractTemplateModal extends ClassComponent<ManageContractTemplateModalAttrs> {
  private form = {
    templateId: null,
    displayName: '',
    nickname: '',
    slug: '',
    displayOption: null,
  };

  closeModalOnSuccess(e) {
    $(e.target).trigger('modalcomplete');
    setTimeout(() => {
      $(e.target).trigger('modalexit');
    }, 0);
  }

  handleCreateNewTemplate(e) {
    const scope = app.customDomainId() || m.route.param('scope');

    $(e.target).trigger('modalexit');
    m.route.set(`/${scope}/new/contract_template`);
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
      template_id: templateId,
      contract_id: contractId,
    };

    try {
      await app.contracts.addCommunityContractTemplate(
        communityContractTemplateAndMetadata
      );

      this.closeModalOnSuccess(e);
    } catch (err) {
      notifyError(err.message);
    }
  }

  async handleSaveEditingTemplate(e) {
    e.preventDefault();

    const { slug, displayOption, nickname, displayName, templateId } =
      this.form;

    const editedCommunityContractTemplate = {
      cct_id: templateId,
      slug,
      nickname,
      display_name: displayName,
      display_options: displayOption,
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

  handleSelectTemplate(item: DropdownItemType) {
    const templateId = +item.value;
    const template = templates.find((t) => t.id === templateId);

    this.form.templateId = item.value;
    this.form.nickname = template.nickname;
    this.form.displayName = template.displayName;
  }

  oninit(vnode: m.Vnode<ManageContractTemplateModalAttrs>) {
    const { templateId } = vnode.attrs;
    const isEditMode = !!templateId;
    const template = templates.find((t) => t.id === templateId);

    if (isEditMode) {
      this.form.templateId = templateId;
      this.form.displayName = template.displayName;
      this.form.nickname = template.nickname;
      this.form.slug = template.slug;
      this.form.displayOption = template.displayOption;
    }
  }

  view(vnode: m.Vnode<ManageContractTemplateModalAttrs>) {
    const { contractId, templateId } = vnode.attrs;

    const isEditMode = !!templateId;
    const modalTitle = isEditMode ? 'Edit Template' : 'Add Template';
    const modalSubtitle = isEditMode
      ? 'Change the metadata associated with your template.'
      : 'Add a template to contract for your community to use.';
    const confirmButtonLabel = isEditMode ? 'Save' : 'Add';

    // disable if at least one input is not filled
    const confirmButtonDisabled = !Object.values(this.form).every(Boolean);

    const templateOptions = templates.map((template) => ({
      value: String(template.id),
      label: template.title,
    }));

    const initialTemplateName = isEditMode
      ? templateOptions.find((option) => +option.value === this.form.templateId)
      : { label: 'Select template type ', value: '' };

    const initialDisplayOption = isEditMode
      ? displayOptions.find(
          (option) => +option.value === this.form.displayOption
        )
      : { label: 'Select display option', value: '' };

    return (
      <div class="ManageContractTemplateModal">
        <CWText type="h4">{modalTitle}</CWText>
        <CWText type="b1" className="subtitle">
          {modalSubtitle}
        </CWText>

        <div className="form">
          <CWText type="caption" fontWeight="medium" className="input-label">
            Template
          </CWText>
          <CWDropdown
            {...(isEditMode ? { containerClassName: 'disabled-dropdown' } : {})}
            initialValue={initialTemplateName}
            label="Choose a template for your proposal"
            options={templateOptions}
            onSelect={(item) => this.handleSelectTemplate(item)}
          />
          {isEditMode && (
            <CWText className="create-template-info" type="caption">
              Don’t see a template that fits your needs?
              <CWText
                type="caption"
                fontWeight="medium"
                className="cta"
                onclick={this.handleCreateNewTemplate}
              >
                Create a New Template
              </CWText>
            </CWText>
          )}
          <CWText type="caption" fontWeight="medium" className="input-label">
            Display Name
          </CWText>
          <CWTextInput
            label="An official name to identify this kind of template"
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
            label="A name that your community can easily remember and identify"
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
                ? this.handleSaveEditingTemplate(e)
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
};

export const showManageContractTemplateModal = ({
  contractId,
  templateId,
}: ShowManageContractTemplateModalAttrs) => {
  app.modals.create({
    modal: ManageContractTemplateModal,
    data: {
      className: 'ManageContractTemplateOuterModal',
      contractId,
      templateId,
    },
  });
};
