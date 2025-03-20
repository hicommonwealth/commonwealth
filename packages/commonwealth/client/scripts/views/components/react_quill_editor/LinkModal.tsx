import React, { useState } from 'react';
import { linkValidationSchema } from '../../../helpers/formValidations/common';
import { CWIcon } from '../component_kit/cw_icons/cw_icon';
import { CWText } from '../component_kit/cw_text';
import { CWTextInput } from '../component_kit/cw_text_input';
import { CWButton } from '../component_kit/new_designs/CWButton';
import {
  CWModalBody,
  CWModalFooter,
  CWModalHeader,
} from '../component_kit/new_designs/CWModal';
import './LinkModal.scss';

type LinkModalProps = {
  linkText: string;
  linkUrl: string;
  onModalClose: () => void;
  setLinkText: (text: string) => void;
  setLinkUrl: (url: string) => void;
  handleAddLink: () => void;
  isModalOpen?: boolean;
};

export const LinkModal = ({
  linkUrl,
  linkText,
  onModalClose,
  setLinkText,
  setLinkUrl,
  handleAddLink,
}: LinkModalProps) => {
  const [urlError, setUrlError] = useState<string>('');

  const validateUrl = (value: string) => {
    try {
      linkValidationSchema.required.parse(value);
      setUrlError('');
    } catch (error) {
      if (error.errors?.[0]?.message) {
        setUrlError(error.errors[0].message);
      }
    }
  };

  return (
    <div className="LinkModal">
      <CWModalHeader label="Add Link" onModalClose={onModalClose} />
      <CWModalBody>
        <CWTextInput
          label="Link text"
          placeholder="Enter link text"
          value={linkText}
          onInput={(e) => {
            setLinkText(e.target.value);
          }}
        />
        <CWTextInput
          label="Url"
          placeholder="Enter URL"
          value={linkUrl}
          onInput={(e) => {
            setLinkUrl(e.target.value);
            validateUrl(e.target.value);
          }}
        />
        {urlError && (
          <div className="error-container">
            <CWIcon
              className="error-icon"
              iconName="warning"
              iconSize="small"
            />
            <CWText className="error-text">{urlError}</CWText>
          </div>
        )}
      </CWModalBody>
      <CWModalFooter>
        <CWButton
          buttonHeight="sm"
          onClick={onModalClose}
          label="Cancel"
          buttonType="secondary"
        />
        <CWButton
          buttonHeight="sm"
          onClick={handleAddLink}
          label="Save"
          buttonType="primary"
          disabled={!!urlError}
        />
      </CWModalFooter>
    </div>
  );
};
