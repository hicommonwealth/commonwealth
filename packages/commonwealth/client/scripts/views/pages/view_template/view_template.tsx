/* @jsx m */

import 'pages/new_contract/new_contract_page.scss';
import app from 'state';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import m from 'mithril';
import ClassComponent from 'class_component';

import Sublayout from '../../sublayout';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWDivider } from 'views/components/component_kit/cw_divider';
import { CWBreadcrumbs } from 'views/components/component_kit/cw_breadcrumbs';
import { CWTextArea } from 'views/components/component_kit/cw_text_area';
import isValidJson from 'helpers/validateJson';
import { MessageRow } from 'views/components/component_kit/cw_text_input';

class ViewTemplatePage extends ClassComponent {
  private form = {
    abi: '',
    error: false,
  };

  handleInputChange(e) {
    const value = e.target.value;
    this.form.abi = value;

    try {
      const json = JSON.parse(value);
      const isValid = isValidJson(json);
      console.log('isValid', isValid);
      this.form.error = isValid;
    } catch (err) {
      this.form.error = true;
    }
  }

  view(vnode) {
    const scope = vnode.attrs.scope;

    return (
      <Sublayout>
        <div class="NewContractPage">
          <CWBreadcrumbs
            breadcrumbs={[
              { label: 'Contracts', path: `/${scope}/contracts` },
              { label: 'Add Contract and ABI', path: '' },
            ]}
          />
          <CWText type="h3" className="header">
            Add Contract and ABI
          </CWText>
          <CWText className="subheader" type="b1">
            Add contracts and their corresponding ABI files to your community.
          </CWText>
          <CWDivider className="divider" />

          <div class="AddContractAndAbiForm">
            <div class="form">
              {this.form.error && (
                <MessageRow
                  label="error"
                  hasFeedback
                  validationStatus="failure"
                  statusMessage="message here"
                />
              )}
              <CWTextArea
                label="Contract ABI File"
                value={this.form.abi}
                placeholder="Enter contract's ABI file"
                oninput={(e) => this.handleInputChange(e)}
              />
            </div>
          </div>
        </div>
      </Sublayout>
    );
  }
}

export default ViewTemplatePage;
