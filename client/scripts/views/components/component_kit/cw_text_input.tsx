/* @jsx m */

import m from 'mithril';
import 'components/component_kit/cw_text_input.scss';

import { ComponentType } from './types';

export enum TextInputStatus {
  Error = 'error',
  Validate = 'validate',
}

type TextInputProps = {
  name: string;
  oninput?: (e) => void | null;
  inputValidationFn?: (value: string) => [TextInputStatus, string];
  label?: string;
  className?: string;
  placeholder?: string;
  defaultValue?: string;
  otherAttrs?: any;
};

type TextInputState = {
  statusMessage: string;
  statusType: TextInputStatus;
  isTyping: boolean;
  inputTimeout;
};

export const CWTextInput: m.Component<TextInputProps, TextInputState> = {
  view: (vnode) => {
    const {
      name,
      oninput,
      inputValidationFn,
      label,
      className,
      placeholder,
      defaultValue,
      otherAttrs,
    } = vnode.attrs;

    const { statusMessage, statusType } = vnode.state;

    return (
      <div class={ComponentType.TextInput} {...otherAttrs}>
        {label && <label>{label}</label>}
        <div class={`cui-input ${className || ``} ${statusType || ``}`}>
          <input
            name={name}
            placeholder={placeholder}
            oninput={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (oninput) {
                clearTimeout(vnode.state.inputTimeout);
                vnode.state.inputTimeout = setTimeout(() => {
                  oninput(e);
                  m.redraw();
                }, 250);
              }
            }}
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
        </div>
        {statusMessage && (
          <div class={`status ${statusType}`}>{statusMessage}</div>
        )}
      </div>
    );
  },
};
