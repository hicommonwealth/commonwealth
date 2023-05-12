import React from 'react';

import $ from 'jquery';

import 'modals/feedback_modal.scss';

import app from 'state';
import { CWButton } from '../components/component_kit/cw_button';
import { CWTextArea } from '../components/component_kit/cw_text_area';
import type { ValidationStatus } from '../components/component_kit/cw_validation_text';
import { CWValidationText } from '../components/component_kit/cw_validation_text';
import { CWIconButton } from '../components/component_kit/cw_icon_button';

type FeedbackModalProps = {
  onModalClose: () => void;
};

export const FeedbackModal = (props: FeedbackModalProps) => {
  const { onModalClose } = props;

  const [feedbackText, setFeedbackText] = React.useState<string | null>('');
  const [message, setMessage] = React.useState<string | null>(null);
  const [isSending, setIsSending] = React.useState<boolean>(false);
  const [status, setStatus] = React.useState<ValidationStatus | null>(null);

  return (
    <div className="FeedbackModal">
      <div className="compact-modal-title">
        <h3>Send feedback</h3>
        <CWIconButton iconName="close" onClick={() => onModalClose()} />
      </div>
      <div className="compact-modal-body">
        <CWTextArea
          placeholder="Report a bug, or suggest an improvement"
          value={feedbackText}
          onInput={(e) => {
            setFeedbackText(e.target.value);
          }}
        />
        <CWButton
          disabled={isSending}
          label="Send feedback"
          onClick={(e) => {
            e.preventDefault();
            setIsSending(true);
            const urlText = document.location.href;

            // send feedback
            $.post(`${app.serverUrl()}/sendFeedback`, {
              text: feedbackText,
              url: urlText,
            }).then(
              () => {
                setFeedbackText('');
                setIsSending(false);
                setStatus('success');
                setMessage('Sent successfully!');
              },
              (err) => {
                setIsSending(false);
                setStatus('failure');
                setMessage(err.responseJSON?.error || err.responseText);
              }
            );
          }}
        />
        {message && <CWValidationText message={message} status={status} />}
      </div>
    </div>
  );
};
