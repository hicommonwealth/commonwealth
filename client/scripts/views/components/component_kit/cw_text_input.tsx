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

export class CWTextInput implements m.ClassComponent<TextInputAttrs> {
  statusMessage?: string;
  validationStatus?: ValidationStatus;

  view(vnode) {
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

    return (
      <div class={ComponentType.TextInput}>
        {label && <label>{label}</label>}
        <input
          autofocus={autofocus}
          autocomplete={autocomplete}
          class={this.validationStatus}
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
