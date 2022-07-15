/* @jsx m */

import m from 'mithril';

import 'components/component_kit/cw_text_input.scss';

import { ComponentType } from './types';
import { getClasses } from './helpers';
import { CWLabel } from './cw_label';
import { CWValidationText, ValidationStatus } from './cw_validation_text';
import { CWIcon } from './cw_icons/cw_icon';

type TextInputSize = 'small' | 'large';

export type TextInputAttrs = {
  autocomplete?: string;
  autofocus?: boolean;
  containerClassName?: string;
  defaultValue?: string;
  iconRight?: string;
  inputValidationFn?: (value: string) => [ValidationStatus, string];
  label?: string;
  maxlength?: number;
  name: string;
  oninput?: (e) => void;
  placeholder?: string;
  tabindex?: number;
};

type InputStyleAttrs = {
  inputClassName?: string;
  darkMode?: boolean;
  disabled?: boolean;
  size: TextInputSize;
  validationStatus?: ValidationStatus;
};

type InputInternalStyleAttrs = {
  hasRightIcon?: boolean;
  isTyping: boolean;
};

export class CWTextInput implements m.ClassComponent<TextInputAttrs> {
  private inputTimeout: NodeJS.Timeout;
  private isTyping: boolean;
  private statusMessage?: string = '';
  private validationStatus?: ValidationStatus = undefined;

  view(vnode) {
    const {
      autocomplete = 'off',
      autofocus,
      containerClassName,
      darkMode,
      defaultValue,
      disabled,
      iconRight,
      inputClassName,
      inputValidationFn,
      label,
      maxlength,
      name,
      oninput,
      placeholder,
      size = 'large',
      tabindex,
    } = vnode.attrs;

    return (
      <div
        class={getClasses<{
          containerClassName?: string;
          validationStatus?: ValidationStatus;
        }>(
          {
            containerClassName,
            validationStatus: this.validationStatus,
          },
          ComponentType.TextInput
        )}
      >
        {label && <CWLabel label={label} />}
        <div class="input-and-icon-container">
          <input
            autofocus={autofocus}
            autocomplete={autocomplete}
            class={getClasses<InputStyleAttrs & InputInternalStyleAttrs>({
              size,
              validationStatus: this.validationStatus,
              disabled,
              isTyping: this.isTyping,
              hasRightIcon: !!iconRight,
              darkMode,
              inputClassName,
            })}
            disabled={disabled}
            tabindex={tabindex}
            maxlength={maxlength}
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
                  [this.validationStatus, this.statusMessage] =
                    inputValidationFn(e.target.value);
                }
              }
            }}
            defaultValue={defaultValue}
          />
          {!!iconRight && !disabled && (
            <CWIcon
              iconName={iconRight}
              iconSize="small"
              className="text-input-right-icon"
            />
          )}
        </div>
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
