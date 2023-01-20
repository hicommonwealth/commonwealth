/* @jsx m */

import ClassComponent from 'class_component';

import 'components/component_kit/cw_text_area.scss';
import m from 'mithril';
import type { BaseTextInputAttrs } from './cw_text_input';
import { MessageRow } from './cw_text_input';
import type { ValidationStatus } from './cw_validation_text';
import { getClasses } from './helpers';

import { ComponentType } from './types';

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

  view(vnode: m.Vnode<TextAreaAttrs>) {
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
      <div class={ComponentType.TextArea}>
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
          class={getClasses<TextAreaStyleAttrs & { isTyping: boolean }>({
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
              m.redraw();
            } else {
              e.stopPropagation();
              this.isTyping = true;
              clearTimeout(this.inputTimeout);
              const timeout = e.target.value?.length > 3 ? 250 : 1000;
              this.inputTimeout = setTimeout(() => {
                this.isTyping = false;
                if (inputValidationFn && e.target.value?.length > 3) {
                  [
                    this.validationStatus,
                    this.statusMessage,
                  ] = inputValidationFn(e.target.value);
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
          value={value}
        />
      </div>
    );
  }
}
