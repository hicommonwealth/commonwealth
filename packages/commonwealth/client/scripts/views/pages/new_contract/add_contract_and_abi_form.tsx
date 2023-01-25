/* @jsx m */
import m from 'mithril';
import ClassComponent from 'class_component';

import 'pages/new_contract/add_contract_and_abi_form.scss';

import { isAddress } from 'web3-utils';
import { notifyError } from 'controllers/app/notifications';
import { CWButton } from 'views/components/component_kit/cw_button';
import { CWDivider } from 'views/components/component_kit/cw_divider';
import { CWTextInput } from 'views/components/component_kit/cw_text_input';
import { CWTextArea } from 'views/components/component_kit/cw_text_area';
import app from 'state';

class AddContractAndAbiForm extends ClassComponent {
  private saving = false;
  private form = {
    address: '',
    abi: '',
  };

  handleAddContract() {
    const scope = app.customDomainId() || m.route.param('scope');
    try {
      this.saving = true;
      m.route.set(`/${scope}/contracts`);
    } catch (err) {
      notifyError('Failed to add Contract and ABI');
      console.log(err);
    } finally {
      this.saving = false;
    }
  }

  handleCancel() {
    const scope = app.customDomainId() || m.route.param('scope');
    m.route.set(`/${scope}/contracts`);
  }

  view(vnode) {
    const isAddressValid = isAddress(this.form.address);
    const isAbiValid = !!this.form.abi;
    const isAddingDisabled = this.saving || !isAddressValid || !isAbiValid;

    return (
      <div class="AddContractAndAbiForm">
        <div class="form">
          <CWTextInput
            inputValidationFn={() => {
              if (isAddressValid) {
                return [];
              }
              return ['failure', 'Invalid Input'];
            }}
            label="Contract Address"
            value={this.form.address}
            placeholder="Enter contract address"
            oninput={(e) => {
              this.form.address = e.target.value;
            }}
          />

          <CWTextArea
            label="Contract ABI File"
            value={this.form.abi}
            placeholder="Enter contract's ABI file"
            oninput={(e) => {
              this.form.abi = e.target.value;
            }}
          />
        </div>

        <CWDivider className="divider" />

        <div class="buttons">
          <CWButton
            buttonType="mini-white"
            label="Cancel"
            onclick={this.handleCancel}
          />
          <CWButton
            buttonType="mini-black"
            label="Add"
            disabled={isAddingDisabled}
            onclick={this.handleAddContract}
          />
        </div>
      </div>
    );
  }
}

export default AddContractAndAbiForm;
