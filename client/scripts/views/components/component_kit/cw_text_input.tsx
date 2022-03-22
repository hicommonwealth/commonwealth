/* @jsx m */

import m from 'mithril';
import 'components/component_kit/cw_text_input.scss';

import { ComponentType } from './types';
import { getTextInputClasses } from './helpers';

export enum ValidationStatus {
  Success = 'success',
  Failure = 'failure',
}

type TextInputAttrs = {
  autocomplete?: string;
  autofocus?: boolean;
  defaultValue?: string;
  disabled?: boolean;
  inputValidationFn?: (value: string) => [ValidationStatus, string];
  label?: string;
  name: string;
  oninput?: (e) => void;
  placeholder?: string;
  tabindex?: number;
};

export type InputStyleAttrs = {
  disabled?: boolean;
  validationStatus?: ValidationStatus;
};

export class CWTextInput implements m.ClassComponent<TextInputAttrs> {
  private statusMessage?: string = '';
  private validationStatus?: ValidationStatus = undefined;

  view(vnode) {
    const {
      autocomplete,
      autofocus,
      defaultValue,
      disabled,
      inputValidationFn,
      label,
      name,
      oninput,
      placeholder,
      tabindex,
    } = vnode.attrs;

    return (
      <div class={ComponentType.TextInput}>
        {label && <label>{label}</label>}
        <input
          autofocus={autofocus}
          autocomplete={autocomplete}
          class={getTextInputClasses({
            validationStatus: this.validationStatus,
            disabled,
          })}
          disabled={disabled}
          tabindex={tabindex}
          name={name}
          placeholder={placeholder}
          oninput={oninput}
          onfocusout={(e) => {
            if (inputValidationFn) {
              if (!e.target.value?.length) {
                this.validationStatus = undefined;
                this.statusMessage = undefined;
                m.redraw();
              } else {
                [this.validationStatus, this.statusMessage] = inputValidationFn(
                  e.target.value
                );
              }
            }
          }}
          defaultValue={defaultValue}
        />
        {this.statusMessage && (
          <div class={`validation-status ${this.validationStatus}`}>
            {this.statusMessage}
          </div>
        )}
      </div>
    );
  }
}
