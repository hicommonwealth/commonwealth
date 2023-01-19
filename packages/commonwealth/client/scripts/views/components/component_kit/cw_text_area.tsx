/* @jsx jsx */
import React from 'react';


import { ClassComponent, ResultNode, render, setRoute, getRoute, getRouteParam, redraw, Component, jsx } from 'mithrilInterop';

import 'components/component_kit/cw_text_area.scss';

import { ComponentType } from './types';
import { getClasses } from './helpers';
import { ValidationStatus } from './cw_validation_text';
import { MessageRow, BaseTextInputAttrs } from './cw_text_input';

type TextAreaStyleAttrs = {
  disabled?: boolean;
  validationStatus?: ValidationStatus;
};

type TextAreaAttrs = BaseTextInputAttrs & TextAreaStyleAttrs;

export class CWTextArea extends ClassComponent<TextAreaAttrs> {
  private inputTimeout: NodeJS.Timeout;
  private isTyping: boolean;
  private statusMessage?: string = '';
  private validationStatus?: ValidationStatus = undefined;

  view(vnode: ResultNode<TextAreaAttrs>) {
    const {
      autocomplete,
      autofocus,
      value,
      disabled,
      inputValidationFn,
      label,
      maxlength,
      name,
      oninput,
      placeholder,
      tabindex,
    } = vnode.attrs;

    return (
      <div className={ComponentType.TextArea}>
        {label && (
          <MessageRow
            hasFeedback={!!inputValidationFn}
            label={label}
            statusMessage={this.statusMessage}
            validationStatus={this.validationStatus}
          />
        )}
        <textarea
          autofocus={autofocus}
          autocomplete={autocomplete}
          className={getClasses<TextAreaStyleAttrs & { isTyping: boolean }>({
            validationStatus: this.validationStatus,
            disabled,
            isTyping: this.isTyping,
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
          onfocusout={(e) => {
            if (inputValidationFn) {
              if (e.target.value?.length === 0) {
                this.isTyping = false;
                this.validationStatus = undefined;
                this.statusMessage = undefined;
                this.redraw();
              } else {
                [this.validationStatus, this.statusMessage] = inputValidationFn(
                  e.target.value
                );
              }
            }
          }}
          value={value}
        />
      </div>
    );
  }
}
