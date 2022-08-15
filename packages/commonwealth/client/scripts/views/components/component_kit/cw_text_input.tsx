/* @jsx m */

import m from 'mithril';

import 'components/component_kit/cw_text_input.scss';

import { ComponentType } from './types';
import { getClasses } from './helpers';
import { CWLabel } from './cw_label';
import { ValidationStatus } from './cw_validation_text';
import { CWIcon } from './cw_icons/cw_icon';
import { CWText } from './cw_text';
import { CWIconButton } from './cw_icon_button';

type TextInputSize = 'small' | 'large';

export type TextInputAttrs = {
  autocomplete?: string;
  autofocus?: boolean;
  containerClassName?: string;
  value?: string;
  iconRight?: string;
  iconRightonclick?: () => void;
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

type MessageRowAttrs = {
  hasFeedback?: boolean;
  label: string;
  statusMessage?: string;
  validationStatus?: ValidationStatus;
};

export class MessageRow implements m.ClassComponent<MessageRowAttrs> {
  view(vnode) {
    const { hasFeedback, label, statusMessage, validationStatus } = vnode.attrs;

    return (
      <div
        class={getClasses<{ hasFeedback: boolean }>(
          { hasFeedback },
          'MessageRow'
        )}
      >
        <CWLabel label={label} />
        {hasFeedback && (
          <CWText
            type="caption"
            className={getClasses<{ status: ValidationStatus }>(
              { status: validationStatus },
              'feedback-message-text'
            )}
          >
            {statusMessage}
          </CWText>
        )}
      </div>
    );
  }
}

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
      value,
      disabled,
      iconRight,
      iconRightonclick,
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
        {label && (
          <MessageRow
            hasFeedback={!!inputValidationFn}
            label={label}
            statusMessage={this.statusMessage}
            validationStatus={this.validationStatus}
          />
        )}
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
            value={value}
          />
          {iconRightonclick && !!iconRight && !disabled ? (
            <div class="text-input-right-onclick-icon">
              <CWIconButton
                iconName={iconRight}
                iconSize="small"
                onclick={iconRightonclick}
                theme="primary"
              />
            </div>
          ) : !!iconRight && !disabled ? (
            <CWIcon
              iconName={iconRight}
              iconSize="small"
              className="text-input-right-icon"
            />
          ) : null}
        </div>
      </div>
    );
  }
}
