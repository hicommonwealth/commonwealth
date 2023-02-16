/* @jsx m */
import m from 'mithril';
import ClassComponent from 'class_component';

import 'pages/new_contract_template/create_contract_template_form.scss';

import { notifyError } from 'controllers/app/notifications';
import { CWButton } from 'views/components/component_kit/cw_button';
import { CWDivider } from 'views/components/component_kit/cw_divider';
import { CWTextInput } from 'views/components/component_kit/cw_text_input';
import { CWTextArea } from 'views/components/component_kit/cw_text_area';
import { CWText } from 'views/components/component_kit/cw_text';
import app from 'state';
import isValidJson from 'helpers/validateJson';

class CreateContractTemplateForm extends ClassComponent {
  private saving = false;
  private form = {
    displayName: '',
    template: '',
  };

  async createContractTemplate() {
    const scope = app.customDomainId() || m.route.param('scope');
    const contract_id = m.route.param('contract_id');

    try {
      this.saving = true;
      await app.contracts.addTemplate({
        name: this.form.displayName,
        template: this.form.template,
        contract_id,
      });
      m.route.set(`/${scope}/contracts`);
    } catch (err) {
      notifyError(err.message);
      console.log(err);
    } finally {
      this.saving = false;
    }
  }

  handleCancel() {
    const scope = app.customDomainId() || m.route.param('scope');
    m.route.set(`/${scope}/contracts`);
  }

  view() {
    const isCreatingDisabled =
      this.saving || !this.form.displayName || !this.form.template;

    return (
      <div class="CreateContractTemplateForm">
        <div class="form">
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
            JSON Blob
          </CWText>
          <CWTextArea
            value={this.form.template}
            placeholder="Enter relevant JSON Blob"
            oninput={(e) => {
              this.form.template = e.target.value;
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

        <div class="buttons">
          <CWButton
            buttonType="secondary-black"
            label="Cancel"
            onclick={this.handleCancel}
          />
          <CWButton
            buttonType="primary-black"
            label="Create"
            disabled={isCreatingDisabled}
            onclick={() => this.createContractTemplate()}
          />
        </div>
      </div>
    );
  }
}

export default CreateContractTemplateForm;
