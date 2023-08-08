import React from 'react';
import $ from 'jquery';
import { X } from '@phosphor-icons/react';

import app from 'state';
import { CWButton } from '../components/component_kit/new_designs/cw_button';
import { CWTextArea } from '../components/component_kit/cw_text_area';
import type { ValidationStatus } from '../components/component_kit/cw_validation_text';
import { CWValidationText } from '../components/component_kit/cw_validation_text';

import 'modals/feedback_modal.scss';
import { CWText } from '../components/component_kit/cw_text';

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
        <CWText className="title-text" type="h4">
          Send feedback
        </CWText>
        <X className="close-icon" onClick={() => onModalClose()} size="24" />
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
          buttonType="primary"
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
