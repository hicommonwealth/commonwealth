/* @jsx m */

import m from 'mithril';
import 'components/component_kit/cw_text_input.scss';

import { ComponentType } from './types';

export enum TextInputStatus {
  Error = 'error',
  Validate = 'validate',
}

type TextInputProps = {
  autocomplete?: string;
  autofocus?: boolean;
  defaultValue?: string;
  inputValidationFn?: (value: string) => [TextInputStatus, string];
  label?: string;
  name: string;
  oninput?: (e) => void;
  placeholder?: string;
  tabindex?: number;
};

type TextInputState = {
  statusMessage: string;
  statusType: TextInputStatus;
};

export const CWTextInput: m.Component<TextInputProps, TextInputState> = {
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

    const { statusMessage, statusType } = vnode.state;

    return (
      <div class={ComponentType.TextInput}>
        {label && <label>{label}</label>}
        <input
          autofocus={autofocus}
          autocomplete={autocomplete}
          class={statusType}
          tabindex={tabindex}
          name={name}
          placeholder={placeholder}
          oninput={oninput}
          onfocusout={(e) => {
            if (inputValidationFn) {
              if (!e.target.value?.length) {
                delete vnode.state.statusType;
                delete vnode.state.statusMessage;
                m.redraw();
              } else {
                [vnode.state.statusType, vnode.state.statusMessage] =
                  inputValidationFn(e.target.value);
              }
            }
          }}
          defaultValue={defaultValue}
        />
        {statusMessage && (
          <div class={`status ${statusType}`}>{statusMessage}</div>
        )}
      </div>
    );
  },
};
