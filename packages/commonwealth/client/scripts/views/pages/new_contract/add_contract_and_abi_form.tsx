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

  async handleAddContract() {
    const scope = app.customDomainId() || m.route.param('scope');

    try {
      this.saving = true;
      const chainNodeId = app.chain.meta.ChainNode.id;

      await app.contracts.addContractAndAbi({
        chain_node_id: chainNodeId,
        abi: this.form.abi,
        address: this.form.address,
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
    const isAddressValid = isAddress(this.form.address);
    const isAddingDisabled = this.saving || !isAddressValid || !this.form.abi;

    return (
      <div class="AddContractAndAbiForm">
        <div class="form">
          <CWTextInput
            inputValidationFn={(value: string) => {
              if (isAddress(value)) {
                return [];
              }
              return ['failure', 'Invalid Input'];
            }}
            label="Contract Address"
            value={this.form.address}
            placeholder="Enter contract address"
            oninput={async (e) => {
              this.form.address = e.target.value;

              if (isAddress(this.form.address)) {
                const fetchedAbi = await app.contracts.getAbiFromEtherscan(
                  this.form.address
                );
                this.form.abi = fetchedAbi;
                m.redraw();
              }
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
            buttonType="secondary-black"
            label="Cancel"
            onclick={this.handleCancel}
          />
          <CWButton
            buttonType="primary-black"
            label="Add"
            disabled={isAddingDisabled}
            onclick={() => this.handleAddContract()}
          />
        </div>
      </div>
    );
  }
}

export default AddContractAndAbiForm;
