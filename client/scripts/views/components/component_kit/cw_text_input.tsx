/* @jsx m */

import m from 'mithril';
import 'components/component_kit/cw_text_input.scss';

import { ComponentType } from './types';

export enum ValidationStatus {
  Success = 'success',
  Failure = 'failure',
}

type TextInputAttrs = {
  autocomplete?: string;
  autofocus?: boolean;
  defaultValue?: string;
  inputValidationFn?: (value: string) => [ValidationStatus, string];
  label?: string;
  name: string;
  oninput?: (e) => void;
  placeholder?: string;
  tabindex?: number;
};

type TextInputState = {
  statusMessage: string;
  validationStatus: ValidationStatus;
};

export const CWTextInput: m.Component<TextInputAttrs, TextInputState> = {
  view: (vnode) => {
    const {
      autocomplete,
      autofocus,
      defaultValue,
      inputValidationFn,
      label,
      name,
      oninput,
      placeholder,
      tabindex,
    } = vnode.attrs;

    const { statusMessage, validationStatus } = vnode.state;

    return (
      <div class={ComponentType.TextInput}>
        {label && <label>{label}</label>}
        <input
          autofocus={autofocus}
          autocomplete={autocomplete}
          class={validationStatus}
          tabindex={tabindex}
          name={name}
          placeholder={placeholder}
          oninput={oninput}
          onfocusout={(e) => {
            if (inputValidationFn) {
              if (!e.target.value?.length) {
                delete vnode.state.validationStatus;
                delete vnode.state.statusMessage;
                m.redraw();
              } else {
                [vnode.state.validationStatus, vnode.state.statusMessage] =
                  inputValidationFn(e.target.value);
              }
            }
          }}
          defaultValue={defaultValue}
        />
        {statusMessage && (
          <div class={`validation-status ${validationStatus}`}>
            {statusMessage}
          </div>
        )}
      </div>
    );
  },
};
