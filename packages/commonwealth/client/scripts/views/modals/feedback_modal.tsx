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
import $ from 'jquery';

import 'modals/feedback_modal.scss';

import app from 'state';
import { CWButton } from '../components/component_kit/cw_button';
import { CWTextArea } from '../components/component_kit/cw_text_area';
import type { ValidationStatus } from '../components/component_kit/cw_validation_text';
import { CWValidationText } from '../components/component_kit/cw_validation_text';

export class FeedbackModal extends ClassComponent {
  private feedbackText: string;
  private message: string;
  private sending: boolean;
  private status: ValidationStatus;

  view() {
    return (
      <div className="FeedbackModal">
        <div className="compact-modal-title">
          <h3>Send feedback</h3>
        </div>
        <div className="compact-modal-body">
          <CWTextArea
            placeholder="Report a bug, or suggest an improvement"
            value={this.feedbackText}
            onInput={(e) => {
              this.feedbackText = e.target.value;
            }}
          />
          <CWButton
            disabled={this.sending}
            label="Send feedback"
            onClick={(e) => {
              e.preventDefault();
              this.sending = true;
              const urlText = document.location.href;

              // send feedback
              $.post(`${app.serverUrl()}/sendFeedback`, {
                text: this.feedbackText,
                url: urlText,
              }).then(
                () => {
                  this.feedbackText = '';
                  this.sending = false;
                  this.status = 'success';
                  this.message = 'Sent successfully!';
                  redraw();
                },
                (err) => {
                  this.sending = false;
                  this.status = 'failure';
                  this.message = err.responseJSON?.message || err.responseText;
                  redraw();
                }
              );
            }}
          />
          {this.message && (
            <CWValidationText message={this.message} status={this.status} />
          )}
        </div>
      </div>
    );
  }
}
