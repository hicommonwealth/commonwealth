/* @jsx jsx */
import React from 'react';

import {
  ClassComponent,
  ResultNode,
  render,
  setRoute,
  getRoute,
  getRouteParam,
  redraw,
  Component,
  jsx,
} from 'mithrilInterop';

import 'components/component_kit/cw_text_input.scss';
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
  autoComplete?: string;
  autoFocus?: boolean;
  containerClassName?: string;
  defaultValue?: string | number;
  value?: string | number;
  iconRight?: IconName;
  iconRightonClick?: () => void;
  inputValidationFn?: (value: string) => [ValidationStatus, string] | [];
  label?: string;
  maxLength?: number;
  name?: string;
  onInput?: (e) => void;
  onenterkey?: (e) => void;
  onClick?: (e) => void;
  placeholder?: string;
  tabIndex?: number;
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
  label: string;
  statusMessage?: string;
  validationStatus?: ValidationStatus;
};

type TextInputAttrs = BaseTextInputAttrs &
  InputStyleAttrs &
  InputInternalStyleAttrs;

export class MessageRow extends ClassComponent<MessageRowAttrs> {
  view(vnode: ResultNode<MessageRowAttrs>) {
    const { hasFeedback, label, statusMessage, validationStatus } = vnode.attrs;

    return (
      <div
        className={getClasses<{ hasFeedback: boolean }>(
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

  view(vnode: ResultNode<TextInputAttrs>) {
    const {
      autoComplete = 'off',
      autoFocus,
      containerClassName,
      darkMode,
      defaultValue,
      value,
      disabled,
      iconRight,
      iconRightonClick,
      inputClassName,
      inputValidationFn,
      label,
      maxLength,
      name,
      onInput,
      onenterkey,
      onClick,
      placeholder,
      size = 'large',
      tabIndex,
      displayOnly,
    } = vnode.attrs;

    return (
      <div
        className={getClasses<{
          containerClassName?: string;
          validationStatus?: ValidationStatus;
        }>(
          {
            containerClassName,
            validationStatus: this.validationStatus,
          },
          ComponentType.TextInput
        )}
        onClick={onClick}
      >
        {label && (
          <MessageRow
            hasFeedback={!!inputValidationFn}
            label={label}
            statusMessage={this.statusMessage}
            validationStatus={this.validationStatus}
          />
        )}
        <div className="input-and-icon-container">
          <input
            autoFocus={autoFocus}
            autoComplete={autoComplete}
            className={getClasses<InputStyleAttrs & InputInternalStyleAttrs>({
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
            tabIndex={tabIndex}
            maxLength={maxLength}
            name={name}
            placeholder={placeholder}
            onInput={(e) => {
              if (onInput) onInput(e);

              if (e.target.value?.length === 0) {
                this.isTyping = false;
                this.validationStatus = undefined;
                this.statusMessage = undefined;
                this.redraw();
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
                    this.redraw();
                  }
                }, timeout);
              }
            }}
            onBlur={(e) => {
              if (inputValidationFn) {
                if (e.target.value?.length === 0) {
                  this.isTyping = false;
                  this.validationStatus = undefined;
                  this.statusMessage = undefined;
                  this.redraw();
                } else {
                  [this.validationStatus, this.statusMessage] =
                    inputValidationFn(e.target.value);
                }
              }
            }}
            onKeyDown={(e) => {
              if (onenterkey && (e.key === 'Enter' || e.keyCode === 13)) {
                onenterkey(e);
              }
            }}
            value={value}
            defaultValue={defaultValue}
          />
          {iconRightonClick && !!iconRight && !disabled ? (
            <div className="text-input-right-onClick-icon">
              <CWIconButton
                iconName={iconRight}
                iconSize="small"
                onClick={iconRightonClick}
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
