/* @jsx m */

import m from 'mithril';

import 'components/component_kit/cw_text_input.scss';

import { ComponentType } from './types';
import { getClasses } from './helpers';
import { CWLabel } from './cw_label';
import { CWValidationText, ValidationStatus } from './cw_validation_text';

type TextInputSize = 'small' | 'large';

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
  size: TextInputSize;
  validationStatus?: ValidationStatus;
};

export class CWTextInput implements m.ClassComponent<TextInputAttrs> {
  private inputTimeout: NodeJS.Timeout;
  private isTyping: boolean;
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
      size = 'large',
      tabindex,
    } = vnode.attrs;

    return (
      <div class={ComponentType.TextInput}>
        {label && <CWLabel label={label} />}
        <input
          autofocus={autofocus}
          autocomplete={autocomplete}
          class={getClasses<InputStyleAttrs & { isTyping: boolean }>({
            size,
            validationStatus: this.validationStatus,
            disabled,
            isTyping: this.isTyping,
          })}
          disabled={disabled}
          tabindex={tabindex}
          name={name}
          placeholder={placeholder}
          oninput={(e) => {
            if (oninput) oninput(e);

            if (e.target.value?.length === 0) {
              this.isTyping = false;
              this.validationStatus = undefined;
              this.statusMessage = undefined;
              m.redraw();
            } else {
              e.stopPropagation();
              this.isTyping = true;
              clearTimeout(this.inputTimeout);
              const timeout = e.target.value?.length > 3 ? 250 : 1000;
              this.inputTimeout = setTimeout(() => {
                this.isTyping = false;
                if (inputValidationFn && e.target.value?.length > 3) {
                  [this.validationStatus, this.statusMessage] =
                    inputValidationFn(e.target.value);
                  m.redraw();
                }
              }, timeout);
            }
          }}
          onfocusout={(e) => {
            if (inputValidationFn) {
              if (e.target.value?.length === 0) {
                this.isTyping = false;
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
          <CWValidationText
            message={this.statusMessage}
            status={this.validationStatus}
          />
        )}
      </div>
    );
  }
}
