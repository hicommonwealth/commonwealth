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
import isValidJson from 'helpers/validateJson';
import {
  CWTextInput,
  MessageRow,
} from 'views/components/component_kit/cw_text_input';
import produce from 'immer';
import { CWDropdown } from '../../components/component_kit/cw_dropdown';
import { CWButton } from '../../components/component_kit/cw_button';
import { showConfirmationModal } from '../../modals/confirmation_modal';
import type Contract from 'client/scripts/models/Contract';
import { callContractFunction } from 'controllers/chain/ethereum/callContractFunction';
import { parseFunctionFromABI } from 'abi_utils';
import validateType from 'helpers/validateTypes';

enum TemplateComponents {
  DIVIDER = 'divider',
  TEXT = 'text',
  INPUT = 'input',
  DROPDOWN = 'dropdown',
}

class ViewTemplatePage extends ClassComponent {
  private formState = {};
  private json: {
    form_fields: any[]; // TODO type this or import from somewhere
    tx_template: {
      method: string;
      args: {
        target: string[];
        calldata: string[];
        values: string[][];
        description: string;
      };
    };
  };
  private isLoaded;
  private templateNickname = '';
  private templateError = true;
  private hasValidationErrors = false;
  private txReady = false;
  private currentContract: Contract | null = null;

  loadData(vnode) {
    // this.form.abi = JSON.stringify(jsonExample, null, 2); UNCLEAR IF NEEDED
    const contract_address = vnode.attrs.contract_address;
    const slug = vnode.attrs.slug;

    if (Object.keys(app.contracts.store._storeAddress).length < 1) {
      return;
    }
    // Make sure this contract and slug exists in the store
    const contractInStore = app.contracts.getByAddress(contract_address);
    const templateMetadata = contractInStore?.ccts?.find((cct) => {
      return cct.cctmd.slug === slug || cct.cctmd.slug === `/${slug}`;
    });

    if (!contractInStore || !templateMetadata) {
      m.route.set('/404');
    }

    this.currentContract = contractInStore;
    this.templateNickname = templateMetadata.cctmd.nickname;

    app.contracts
      .getTemplatesForContract(contractInStore.id)
      .then((templates) => {
        const template = templates.find((t) => {
          return t.id === templateMetadata.templateId;
        });

        try {
          this.json = JSON.parse(template.template);
          this.templateError = !isValidJson(this.json);
        } catch (err) {
          console.log('err', err);
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

        this.isLoaded = true;
        m.redraw();
      });
  }

  formatFunctionArgs(formState) {
    const { tx_template } = this.json;

    const outputArr = [];

    Object.keys(tx_template.args).forEach((key) => {
      const arg = tx_template.args[key];

      // Formats the args for the function call
      if (Array.isArray(arg)) {
        const subArr = [];
        arg.forEach((a) => {
          if (Array.isArray(a)) {
            const subSubArr = [];
            a.forEach((subA) => {
              if (subA.startsWith('$')) {
                const ref = subA.slice(1);
                subSubArr.push(formState[ref]);
              } else {
                subSubArr.push(subA);
              }
            });
            subArr.push(subSubArr);
          } else {
            if (a.startsWith('$')) {
              const ref = a.slice(1);
              subArr.push(formState[ref]);
            } else {
              subArr.push(a);
            }
          }
        });

        outputArr.push(subArr);
      } else {
        if (arg.startsWith('$')) {
          const ref = arg.slice(1);
          outputArr.push(formState[ref]);
        } else {
          outputArr.push(arg);
        }
      }
    });
    // output an array that will be used in callContactFun
    return outputArr.map((outputVal) => {
      return JSON.stringify(outputVal);
    });
  }

  constructTxPreview() {
    const functionArgs = this.formatFunctionArgs(this.formState);
    const preview = {};

    preview['method'] = this.json.tx_template?.method;
    preview['args'] = functionArgs;

    return JSON.stringify(preview, null, 4);
  }

  view(vnode) {
    const scope = vnode.attrs.scope;

    if (!this.isLoaded) {
      this.loadData(vnode);
      return;
    }

    this.txReady =
      !this.hasValidationErrors &&
      Object.values(this.formState).every((val) => {
        return val !== null && val !== '';
      });

    return (
      <Sublayout>
        <div class="ViewTemplatePage">
          <CWBreadcrumbs
            breadcrumbs={[
              { label: 'Contracts', path: `/${scope}/contracts` },
              { label: 'Create Proposal', path: '' },
            ]}
          />
          <CWText type="h3" className="header">
            {this.templateNickname}
          </CWText>

          <div class="form">
            <CWDivider className="divider" />

            {!this.templateError ? (
              <div className="template">
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
                          placeholder={field[component].field_name}
                          oninput={(e) => {
                            this.formState = produce(
                              this.formState,
                              (draft) => {
                                draft[field[component].field_ref] =
                                  e.target.value;
                              }
                            );
                          }}
                          inputValidationFn={(val) =>
                            validateType(val, field[component].formatter)
                          }
                        />
                      );
                    case TemplateComponents.DROPDOWN:
                      return (
                        <CWDropdown
                          label={field[component].field_label}
                          options={field[component].field_options}
                          onSelect={(item) => {
                            this.formState = produce(
                              this.formState,
                              (draft) => {
                                draft[field[component].field_ref] = item.value;
                              }
                            );
                          }}
                        />
                      );
                    default:
                      return null;
                  }
                })}
              </div>
            ) : (
              <MessageRow
                label="error"
                hasFeedback
                validationStatus="failure"
                statusMessage="invalid template format"
              />
            )}
            <CWDivider />
            <div className="bottom-row">
              <CWButton label="Cancel" buttonType="secondary-black" />
              <CWButton
                label="Create"
                buttonType="primary-black"
                disabled={!this.txReady}
                onclick={() => {
                  showConfirmationModal({
                    title: 'Attempt this transaction?',
                    description: this.constructTxPreview(), // TODO: Replace with some preview we like
                    confirmButton: {
                      type: 'primary-black',
                      label: 'confirm',
                      onConfirm: async () => {
                        try {
                          const functionAbi = parseFunctionFromABI(
                            this.currentContract.abi,
                            this.json.tx_template?.method as string
                          );

                          const functionArgs = this.formatFunctionArgs(
                            this.formState
                          );

                          await callContractFunction({
                            contract: this.currentContract,
                            fn: functionAbi,
                            inputArgs: functionArgs,
                          });
                        } catch (e) {
                          console.log(e);
                        }
                      },
                    },
                    cancelButton: {
                      type: 'secondary-black',
                      label: 'cancel',
                      onCancel: () => {
                        console.log('hi');
                      },
                    },
                  });
                }}
              />
            </div>
          </div>
        </div>
      </Sublayout>
    );
  }
}

export default ViewTemplatePage;
