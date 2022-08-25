/* @jsx m */

import m from 'mithril';

import 'components/component_kit/cw_token_input.scss';

import { ComponentType } from './types';
import { getClasses } from './helpers';
import { CWLabel } from './cw_label';
import { ValidationStatus } from './cw_validation_text';
import { CWText } from './cw_text';
import { CWAvatar } from './cw_avatar';

export type TokenInputAttrs = {
  autofocus?: boolean;
  containerClassName?: string;
  value?: string;
  inputValidationFn?: (value: number) => [ValidationStatus, string];
  label?: string;
  oninput?: (e) => void;
  placeholder?: string;
  tabindex?: number;
  tokenId?: string;
  tokenIconUrl?: string;
};

type InputStyleAttrs = {
  inputClassName?: string;
  darkMode?: boolean;
  disabled?: boolean;
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

export class CWTokenInput implements m.ClassComponent<TokenInputAttrs> {
  private inputTimeout: NodeJS.Timeout;
  private isTyping: boolean;
  private statusMessage?: string = '';
  private validationStatus?: ValidationStatus = undefined;

  view(vnode) {
    const {
      autofocus,
      containerClassName,
      darkMode,
      value,
      disabled,
      inputClassName,
      inputValidationFn,
      label,
      name,
      oninput,
      placeholder = '0.00',
      tabindex,
      tokenId,
    } = vnode.attrs;

    // TODO
    const tokenIconUrl = vnode.attrs.tokenIconUrl; // || tokens.filter((t) => t.id === tokenId)
    console.log(tokenIconUrl);
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
          ComponentType.TokenInput
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
            class={getClasses<InputStyleAttrs & InputInternalStyleAttrs>({
              validationStatus: this.validationStatus,
              disabled,
              isTyping: this.isTyping,
              darkMode,
              inputClassName,
            })}
            disabled={disabled}
            tabindex={tabindex}
            name={name}
            placeholder={placeholder}
            oninput={(e) => {
              oninput(e);

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
                  if (inputValidationFn && e.target.value?.length > 0) {
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
            type="number"
            value={value}
          />
          {tokenIconUrl && <CWAvatar size={24} avatarUrl={tokenIconUrl} />}
        </div>
      </div>
    );
  }
}
