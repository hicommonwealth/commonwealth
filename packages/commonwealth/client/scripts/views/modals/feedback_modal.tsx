import React from 'react';
import $ from 'jquery';

import app from '../../state';
import type { ValidationStatus } from '../components/component_kit/cw_validation_text';
import { CWButton } from '../components/component_kit/new_designs/cw_button';
import { CWTextArea } from '../components/component_kit/cw_text_area';
import { CWValidationText } from '../components/component_kit/cw_validation_text';
import {
  CWModalBody,
  CWModalFooter,
  CWModalHeader,
} from '../components/component_kit/new_designs/CWModal';

import '../../../styles/modals/feedback_modal.scss';

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
      <CWModalHeader label="Send feedback" onModalClose={onModalClose} />
      <CWModalBody>
        <CWTextArea
          placeholder="Report a bug, or suggest an improvement"
          value={feedbackText}
          onInput={(e) => {
            setFeedbackText(e.target.value);
          }}
        />
      </CWModalBody>
      <CWModalFooter>
        {message && <CWValidationText message={message} status={status} />}
        <CWButton
          buttonType="primary"
          buttonHeight="sm"
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
      </CWModalFooter>
    </div>
  );
};
