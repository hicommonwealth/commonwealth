/* @jsx m */

import 'pages/view_template/view_template.scss';
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
import {
  CWTextInput,
  MessageRow,
} from 'views/components/component_kit/cw_text_input';
import produce from 'immer';
import { CWDropdown } from '../../components/component_kit/cw_dropdown';

const jsonExample = {
  form_fields: [
    {
      text: {
        field_name: 'title',
        field_type: 'h1',
        field_value: 'Create a New Treasury Spend Proposal',
      },
    },
    {
      input: {
        field_name: 'name',
        field_label: 'Enter a name for your (beer related) proposal',
        field_ref: 'name-ref',
        formatter: 'string',
      },
    },
    {
      input: {
        field_name: 'description',
        field_label: 'Enter a short description for your proposal',
        field_ref: 'description-ref',
      },
    },
    {
      divider: {
        field_name: 'divider',
      },
    },
    {
      dropdown: {
        field_name: 'treasury dropdown',
        field_label: 'Select which Treasury to spend from',
        field_options: [
          { label: 'Treasury1', value: '0x123' },
          { label: "Rhys' Wallet", value: '0xRhys' },
        ],
        formatter: 'address',
        field_ref: 'treasury-select-ref',
      },
    },
    {
      text: {
        field_name: 'subtitle',
        field_type: 'h2',
        field_value: 'Treasury Spend',
      },
    },
    {
      input: {
        field_name: 'address',
        field_label: "Who's the recipient?",
        field_ref: 'address-ref',
        formatter: 'address',
      },
    },
    {
      input: {
        field_name: 'amount',
        field_label: 'How much are they getting for beer?',
        field_ref: 'amount-ref',
        formatter: 'token',
      },
    },
  ],
  tx_template: {
    method: 'propose',
    args: {
      target: ['0x0urdaotrez'],
      calldata: ['sendTo'],
      values: [['$address-ref', '$amount-ref']],
      description: '$description-ref',
    },
  },
};

enum TemplateComponents {
  DIVIDER = 'divider',
  TEXT = 'text',
  INPUT = 'input',
  DROPDOWN = 'dropdown',
}

class ViewTemplatePage extends ClassComponent {
  private form = {
    abi: '',
    error: false,
  };
  private formState = {};
  private json = { form_fields: [], tx_template: {} };

  handleInputChange(e) {
    const value = e.target.value;
    // this.form.abi = value;

    try {
      const json = JSON.parse(value);
      this.form.error = !isValidJson(json);
    } catch (err) {
      console.log('err', err);
      this.form.error = true;
    }
  }

  oncreate() {
    // this.form.abi = JSON.stringify(jsonExample, null, 2); UNCLEAR IF NEEDED

    try {
      this.json = JSON.parse(JSON.stringify(jsonExample, null, 2));
    } catch (err) {
      console.log('err');

      // TODO: Handle errors here- probably have to send some kind of error message to the view
      return (
        <div>
          <h1>Parsing JSON failed!</h1>
          <code>{JSON.stringify(err, Object.getOwnPropertyNames(err))}</code>
        </div>
      );
    }

    for (const field of this.json.form_fields) {
      switch (Object.keys(field)[0]) {
        case TemplateComponents.INPUT:
          // This is using a small package that makes working with immutable state
          // much easier to reason about
          this.formState = produce(this.formState, (draft) => {
            draft[field.input.field_ref] = null;
          });
          break;
        case TemplateComponents.DROPDOWN:
          this.formState = produce(this.formState, (draft) => {
            // Use the default value of the dropdown as the initial state
            draft[field.dropdown.field_ref] =
              field.dropdown.field_options[0].value;
          });
          break;
        default:
          break;
      }
    }
  }

  view(vnode) {
    const scope = vnode.attrs.scope;

    console.log('this is the current state: ', this.formState);

    return (
      <Sublayout>
        <div class="ViewTemplatePage">
          <CWBreadcrumbs
            breadcrumbs={[
              { label: 'Contracts', path: `/${scope}/contracts` },
              { label: 'Add Contract and ABI', path: '' },
            ]}
          />
          <CWText type="h3" className="header">
            View Template Page
          </CWText>
          <CWDivider className="divider" />

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

            <div className="template">
              {/* Render this here so it has easy access to the state object */}
              {this.json.form_fields.map((field, index) => {
                const [component] = Object.keys(this.json.form_fields[index]);

                switch (component) {
                  case TemplateComponents.DIVIDER:
                    return <CWDivider />;
                  case TemplateComponents.TEXT:
                    return (
                      <CWText fontStyle={field[component].field_type}>
                        {field[component].field_value}
                      </CWText>
                    );
                  case TemplateComponents.INPUT:
                    return (
                      <CWTextInput
                        label={field[component].field_label}
                        value={this.formState[field[component].field_ref]}
                        oninput={(e) => {
                          this.formState = produce(this.formState, (draft) => {
                            draft[field[component].field_ref] = e.target.value;
                          });
                        }}
                      />
                    );
                  case TemplateComponents.DROPDOWN:
                    return (
                      <CWDropdown
                        label={field[component].field_label}
                        options={field[component].field_options}
                        onSelect={(item) => {
                          this.formState = produce(this.formState, (draft) => {
                            draft[field[component].field_ref] = item.value;
                          });
                        }}
                      />
                    );
                  default:
                    return null;
                }
              })}
            </div>
          </div>
        </div>
      </Sublayout>
    );
  }
}

export default ViewTemplatePage;
