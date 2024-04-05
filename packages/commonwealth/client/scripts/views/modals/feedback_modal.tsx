import axios from 'axios';
import React from 'react';

import app from '../../state';
import { CWTextArea } from '../components/component_kit/cw_text_area';
import type { ValidationStatus } from '../components/component_kit/cw_validation_text';
import { CWValidationText } from '../components/component_kit/cw_validation_text';
import { CWButton } from '../components/component_kit/new_designs/CWButton';
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

  const handleSendFeedback = async (e) => {
    e.preventDefault();
    setIsSending(true);
    const urlText = document.location.href;

    try {
      await axios.post(`${app.serverUrl()}/sendFeedback`, {
        text: feedbackText,
        url: urlText,
      });

      setFeedbackText('');
      setIsSending(false);
      setStatus('success');
      setMessage('Sent successfully!');
    } catch (error) {
      setIsSending(false);
      setStatus('failure');
      setMessage(error.response?.data?.error || error.message);
    }
  };

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
          onClick={handleSendFeedback}
        />
      </CWModalFooter>
    </div>
  );
};
