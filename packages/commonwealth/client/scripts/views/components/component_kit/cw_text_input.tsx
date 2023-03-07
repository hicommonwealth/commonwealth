/* @jsx m */

import ClassComponent from 'class_component';

import 'components/component_kit/cw_text_input.scss';
import m from 'mithril';
import { CWIconButton } from './cw_icon_button';
import { CWIcon } from './cw_icons/cw_icon';
import type { IconName } from './cw_icons/cw_icon_lookup';
import { CWLabel } from './cw_label';
import { CWText } from './cw_text';
import type { ValidationStatus } from './cw_validation_text';
import { getClasses } from './helpers';

import { ComponentType } from './types';

type TextInputSize = 'small' | 'large';

export type BaseTextInputAttrs = {
  autocomplete?: string;
  autofocus?: boolean;
  containerClassName?: string;
  defaultValue?: string | number;
  value?: string | number;
  iconRight?: IconName;
  iconRightonclick?: () => void;
  inputValidationFn?: (value: string) => [ValidationStatus, string] | [];
  label?: string | m.Vnode;
  maxlength?: number;
  name?: string;
  oninput?: (e) => void;
  onenterkey?: (e) => void;
  onclick?: (e) => void;
  placeholder?: string;
  tabindex?: number;
  manualStatusMessage?: string;
  manualValidationStatus?: ValidationStatus;
};

type InputStyleAttrs = {
  inputClassName?: string;
  darkMode?: boolean;
  disabled?: boolean;
  size?: TextInputSize;
  validationStatus?: ValidationStatus;
  displayOnly?: boolean;
};

type InputInternalStyleAttrs = {
  hasRightIcon?: boolean;
  isTyping?: boolean;
};

type MessageRowAttrs = {
  hasFeedback?: boolean;
  label: string | m.Vnode;
  statusMessage?: string;
  validationStatus?: ValidationStatus;
};

type TextInputAttrs = BaseTextInputAttrs &
  InputStyleAttrs &
  InputInternalStyleAttrs;

export class MessageRow extends ClassComponent<MessageRowAttrs> {
  view(vnode: m.Vnode<MessageRowAttrs>) {
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

export class CWTextInput extends ClassComponent<TextInputAttrs> {
  private inputTimeout: NodeJS.Timeout;
  private isTyping: boolean;
  private statusMessage?: string = '';
  private validationStatus?: ValidationStatus = undefined;

  view(vnode: m.Vnode<TextInputAttrs>) {
    const {
      autocomplete = 'off',
      autofocus,
      containerClassName,
      darkMode,
      defaultValue,
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
      onenterkey,
      onclick,
      placeholder,
      size = 'large',
      tabindex,
      displayOnly,
      manualStatusMessage = '',
      manualValidationStatus = '',
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
        onclick={onclick}
      >
        {label && (
          <MessageRow
            hasFeedback={!!inputValidationFn}
            label={label}
            statusMessage={manualStatusMessage || this.statusMessage}
            validationStatus={manualValidationStatus || this.validationStatus}
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
              displayOnly,
              isTyping: this.isTyping,
              hasRightIcon: !!iconRight,
              darkMode,
              inputClassName,
            })}
            disabled={disabled || displayOnly}
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
            onkeydown={(e) => {
              if (onenterkey && (e.key === 'Enter' || e.keyCode === 13)) {
                onenterkey(e);
              }
            }}
            value={value}
            defaultValue={defaultValue}
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
