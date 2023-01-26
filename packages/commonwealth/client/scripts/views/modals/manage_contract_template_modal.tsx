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
import { CWDropdown } from 'views/components/component_kit/cw_dropdown';

export class ManageContractTemplateModal extends ClassComponent {
  private form = {
    template: '',
    displayName: '',
    nickname: '',
    slug: '',
    displayOption: '',
  };

  handleCreateNewTemplate(e) {
    const scope = app.customDomainId() || m.route.param('scope');

    $(e.target).trigger('modalexit');
    m.route.set(`/${scope}/new/contract_template`);
  }

  handleConfirm(e) {
    e.preventDefault();
    $(e.target).trigger('modalcomplete');
    setTimeout(() => {
      $(e.target).trigger('modalexit');
    }, 0);
  }

  handleCancel(e) {
    e.preventDefault();
    $(e.target).trigger('modalexit');
  }

  view(vnode) {
    const isEditMode = true;
    const modalTitle = isEditMode ? 'Edit Template' : 'Add Template';
    const modalSubtitle = isEditMode
      ? 'Change the metadata associated with your template.'
      : 'Add a template to contract for your community to use.';
    const confirmButtonLabel = isEditMode ? 'Save' : 'Add';
    const templateOptions = [
      { value: '1', label: 'template1' },
      { value: '2', label: 'template2' },
      { value: '3', label: 'template3' },
    ];
    const displayOptions = [
      { value: '1', label: 'display1' },
      { value: '2', label: 'display2' },
      { value: '3', label: 'display3' },
    ];

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
            label="Choose a template for your contract"
            options={templateOptions}
            onSelect={(result) => {
              this.form.displayName = result.value;
            }}
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
            onclick={this.handleConfirm}
          />
        </div>
      </div>
    );
  }
}

export const showManageContractTemplateModal = () => {
  app.modals.create({
    modal: ManageContractTemplateModal,
    data: { className: 'ManageContractTemplateOuterModal' },
  });
};
