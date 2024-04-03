import { parseFunctionFromABI } from 'abi_utils';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { callContractFunction } from 'controllers/chain/ethereum/callContractFunction';
import validateType from 'helpers/validateTypes';
import type Contract from 'models/Contract';
import { useCommonNavigate } from 'navigation/helpers';
import React, { useCallback, useEffect, useState } from 'react';
import app from 'state';
import 'view_template/view_template.scss';
import { CWDivider } from 'views/components/component_kit/cw_divider';
import { CWText } from 'views/components/component_kit/cw_text';
import {
  CWTextInput,
  MessageRow,
} from 'views/components/component_kit/cw_text_input';
import { openConfirmation } from 'views/modals/confirmation_modal';
import Web3 from 'web3';
import isValidJson from '../../../../../shared/validateJson';
import { CWDropdown } from '../../components/component_kit/cw_dropdown';
import { CWButton } from '../../components/component_kit/new_designs/cw_button';

export enum TemplateComponents {
  DIVIDER = 'divider',
  TEXT = 'text',
  INPUT = 'input',
  DROPDOWN = 'dropdown',
  FUNCTIONFORM = 'function',
  STRUCTFORM = 'struct',
}

type Json = {
  form_fields: any[]; // TODO type this or import from somewhere
  tx_template: {
    method: string;
    args: {
      target: string[];
      calldata: string[];
      values: string[][];
      description: string;
    };
    tx_params: {
      value: string;
      gas: string;
      gasPrice: string;
    };
  };
};

type ViewTemplateFormProps = {
  contract_address?: string;
  slug?: string;
  isForm?: boolean;
  setTemplateNickname(name: string): any;
};

const ViewTemplatePage = (formData?: ViewTemplateFormProps) => {
  const navigate = useCommonNavigate();
  const params = formData;
  const [formState, setFormState] = useState({});
  const [json, setJson] = useState<Json>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [templateNickname, setTemplateNickname] = useState('');
  const [templateError, setTemplateError] = useState(false);
  const [currentContract, setCurrentContract] = useState<Contract | null>(null);

  const loadData = useCallback(() => {
    const { contract_address, slug } = params;

    if (Object.keys(app.contracts.store._storeAddress).length < 1) {
      return;
    }
    // Make sure this contract and slug exists in the store
    const contractInStore = app.contracts.getByAddress(contract_address);
    const templateMetadata = contractInStore?.ccts?.find((cct) => {
      return cct.cctmd.slug === slug || cct.cctmd.slug === `/${slug}`;
    });

    if (!contractInStore || !templateMetadata) {
      if (formData.isForm) return <div>No Contract Available</div>;
      navigate('/404', {}, null);
    }

    setCurrentContract(contractInStore);
    setTemplateNickname(templateMetadata.cctmd.nickname);
    if (
      params.setTemplateNickname &&
      typeof params.setTemplateNickname === 'function'
    ) {
      params.setTemplateNickname(templateMetadata.cctmd.nickname);
    }

    app.contracts
      .getTemplatesForContract(contractInStore.id)
      .then((templates) => {
        const template = templates.find((t) => {
          return t.id === templateMetadata.templateId;
        });

        let parsedJSON;
        try {
          parsedJSON = JSON.parse(template.template);
          setJson(parsedJSON);
          setTemplateError(!isValidJson(parsedJSON));
        } catch (err) {
          console.log('err', err);
        }

        for (const field of parsedJSON.form_fields) {
          switch (Object.keys(field)[0]) {
            case TemplateComponents.INPUT:
              setFormState((prevState) => {
                const newState = { ...prevState };
                newState[field.input.field_ref] = null;
                return newState;
              });

              break;
            case TemplateComponents.DROPDOWN:
              setFormState((prevState) => {
                const newState = { ...prevState };
                newState[field.dropdown.field_ref] =
                  field.dropdown.field_options[0].value;
                return newState;
              });

              break;
            case TemplateComponents.FUNCTIONFORM:
              setFormState((prevState) => {
                const newState = { ...prevState };
                newState[field.function.field_ref] =
                  field.function.tx_forms.map((method) => {
                    // Create a Data structure for each calldata's method params from form
                    const form = {};
                    // Store appropriate ordering of params
                    form['paramRefs'] = method.paramRefs;
                    form['abi'] = method.functionABI;
                    for (const nested_field of method.form) {
                      if (
                        Object.keys(nested_field)[0] ===
                        TemplateComponents.INPUT
                      ) {
                        form[nested_field.field_ref] = null;
                      }
                    }
                    return form;
                  });

                return newState; // return the new state object
              });

              break;
            case TemplateComponents.STRUCTFORM:
              setFormState((prevState) => {
                const newState = { ...prevState };
                const form = {};
                field.struct.form_fields.forEach((nestField) => {
                  form[nestField.input.field_ref] = null;
                });
                newState[field.struct.field_ref] = form;
                return newState;
              });
              break;

            default:
              break;
          }
        }

        setIsLoaded(true);
      });
  }, [json, navigate, params]);

  useEffect(() => {
    loadData();
  }, []);

  const formatFunctionArgs = () => {
    const { tx_template } = json;

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
              const _params = [];
              method.paramRefs.forEach((param) => {
                _params.push(method[param]);
              });
              const w3 = new Web3();
              calldataSubArr.push(
                w3.eth.abi.encodeFunctionCall(method.abi, _params),
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
  };

  const formatTransactionParams = () => {
    const { tx_template } = json;
    const txObject = {};
    if (!tx_template.tx_params) return {};
    Object.keys(tx_template.tx_params).map((key) => {
      const arg = tx_template.tx_params[key];
      if (arg.startsWith('$')) {
        txObject[key] = formState[arg.slice(1)];
      } else {
        txObject[key] = arg;
      }
    });
    return txObject;
  };

  const constructTxPreview = () => {
    const functionArgs = formatFunctionArgs();
    const txParams = formatTransactionParams();
    const preview = {};

    preview['method'] = json.tx_template?.method;
    preview['args'] = functionArgs;
    preview['tx_params'] = txParams;

    return JSON.stringify(preview, null, 4);
  };

  const renderTemplate = (form_fields, nested_field_ref?, nested_index?) => {
    return form_fields.flatMap((field, index) => {
      const [component] = Object.keys(form_fields[index]);

      switch (component) {
        case TemplateComponents.DIVIDER:
          return <CWDivider />;
        case TemplateComponents.TEXT:
          return (
            <CWText
              fontStyle={
                formData.isForm && field[component].field_type == 'h1'
                  ? 'h2'
                  : field[component].field_type
              }
            >
              {field[component].field_value}
            </CWText>
          );
        case TemplateComponents.INPUT:
          return (
            <CWTextInput
              label={field[component].field_label}
              value={formState[field[component].field_ref]}
              placeholder={field[component].field_name}
              onInput={(e) => {
                setFormState((prevState) => {
                  const newState = { ...prevState };

                  if (nested_field_ref) {
                    if (nested_index) {
                      newState[nested_field_ref][nested_index][
                        field[component].field_ref
                      ] = e.target.value;
                    } else {
                      newState[nested_field_ref][field[component].field_ref] =
                        e.target.value;
                    }
                  } else {
                    newState[field[component].field_ref] = e.target.value;
                  }

                  return newState; // return the new state object
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
              return renderTemplate(method.form, field[component].field_ref, i);
            }),
          );

          functionComponents.push(<CWDivider />);
          return functionComponents;
        }
        case TemplateComponents.STRUCTFORM: {
          const functionComponents = [
            <CWDivider />,
            <CWText type="h3">{field[component].field_label}</CWText>,
          ];

          functionComponents.push(
            ...renderTemplate(
              field[component].form_fields,
              field[component].field_ref,
            ),
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
                setFormState((prevState) => {
                  const newState = { ...prevState };
                  newState[field[component].field_ref] = item.value;
                  return newState;
                });
              }}
            />
          );
        default:
          return null;
      }
    });
  };

  const txReady = Object.values(formState).every((val) => {
    return val !== null && val !== '';
  });

  const handleCreate = () => {
    openConfirmation({
      title: 'Attempt this transaction?',
      description: constructTxPreview(), // TODO: Replace with some preview we like
      buttons: [
        {
          buttonType: 'primary',
          label: 'confirm',
          onClick: async () => {
            try {
              const functionAbi = parseFunctionFromABI(
                currentContract.abi,
                json.tx_template?.method as string,
              );

              const functionArgs = formatFunctionArgs();
              const txParams = formatFunctionArgs();
              const res = await callContractFunction({
                contract: currentContract,
                fn: functionAbi,
                inputArgs: functionArgs,
                tx_options: txParams,
              });

              if (res.status) {
                notifySuccess('Transaction successful!');
              } else {
                notifyError('Transcation Failed. Try again.');
              }
            } catch (e) {
              console.log(e);
            }
          },
        },
        {
          buttonType: 'secondary',
          label: 'cancel',
          onClick: () => {
            console.log('transaction cancelled');
          },
        },
      ],
    });
  };

  if (!json) {
    if (formData.isForm) return <div>No Contract Available</div>;
    return;
  }

  return (
    <div className={formData.isForm ? 'ViewTemplateForm' : 'ViewTemplatePage'}>
      {!formData.isForm && (
        <CWText type="h3" className="header">
          {templateNickname}
        </CWText>
      )}

      <div className="form">
        {!formData.isForm && <CWDivider className="divider" />}

        {!templateError ? (
          <div className="template">{renderTemplate(json.form_fields)}</div>
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
          <CWButton label="Cancel" buttonType="secondary" />
          <CWButton label="Create" disabled={!txReady} onClick={handleCreate} />
        </div>
      </div>
    </div>
  );
};

export default ViewTemplatePage;
