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
import isValidJson from '../../../../../shared/validateJson';
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
import Web3 from 'web3';

enum TemplateComponents {
  DIVIDER = 'divider',
  TEXT = 'text',
  INPUT = 'input',
  DROPDOWN = 'dropdown',
  FUNCTIONFORM = 'function',
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
  private params: any = null; // Used for listening to changes in the url params

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
            case TemplateComponents.FUNCTIONFORM:
              this.formState = produce(this.formState, (draft) => {
                draft[field.function.field_ref] = field.function.tx_forms.map(
                  (method) => {
                    // Create a Data structure for each calldata's method params from form
                    const form = {};
                    // Store appropriate ordering of params
                    form['paramRefs'] = method.paramRefs;
                    form['abi'] = method.functionABI;
                    for (const nested_field of method.form) {
                      if (
                        Object.keys(nested_field)[0] == TemplateComponents.INPUT
                      ) {
                        form[nested_field.field_ref] = null;
                      }
                    }
                    return form;
                  }
                );
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
          const paramState = formState[ref];
          if (Array.isArray(paramState)) {
            const calldataSubArr = [];
            paramState.forEach((method) => {
              const params = [];
              method.paramRefs.forEach((param) => {
                params.push(method[param]);
              });
              const w3 = new Web3();
              calldataSubArr.push(
                w3.eth.abi.encodeFunctionCall(method.abi, params)
              );
            });
            outputArr.push(calldataSubArr);
          } else {
            outputArr.push(paramState);
          }
        } else {
          outputArr.push(arg);
        }
      }
    });
    // output an array that will be used in callContactFun
    return outputArr.map((outputVal) => {
      if (Array.isArray(outputVal)) {
        return JSON.stringify(outputVal);
      } else {
        return outputVal;
      }
    });
  }

  constructTxPreview() {
    const functionArgs = this.formatFunctionArgs(this.formState);
    const preview = {};

    preview['method'] = this.json.tx_template?.method;
    preview['args'] = functionArgs;

    return JSON.stringify(preview, null, 4);
  }

  renderTemplate(form_fields, nested_field_ref?, nested_index?) {
    return form_fields.flatMap((field, index) => {
      const [component] = Object.keys(form_fields[index]);

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
                this.formState = produce(this.formState, (draft) => {
                  if (nested_field_ref) {
                    draft[nested_field_ref][nested_index][
                      field[component].field_ref
                    ] = e.target.value;
                  } else {
                    draft[field[component].field_ref] = e.target.value;
                  }
                });
              }}
              inputValidationFn={(val) =>
                validateType(val, field[component].formatter)
              }
            />
          );
        case TemplateComponents.FUNCTIONFORM: {
          const functionComponents = [
            <CWDivider />,
            <CWText type="h3">{field[component].field_label}</CWText>,
          ];
          functionComponents.push(
            ...field[component].tx_forms.flatMap((method, i) => {
              // Recursively call the renderTemplate(this function) funciton for each sub function form
              return this.renderTemplate(
                method.form,
                field[component].field_ref,
                i
              );
            })
          );
          functionComponents.push(<CWDivider />);
          return functionComponents;
        }
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
    });
  }

  oninit() {
    this.params = m.route.param();
  }

  onbeforeupdate(vnode) {
    // Handles when the user navigates to a different contract
    const newParams = m.route.param();
    if (JSON.stringify(newParams) !== JSON.stringify(this.params)) {
      this.params = newParams;
      this.loadData(vnode);
    }
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
                {this.renderTemplate(this.json.form_fields)}
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
