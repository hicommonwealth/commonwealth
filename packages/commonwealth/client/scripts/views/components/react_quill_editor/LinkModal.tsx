import React from 'react';
import { CWTextInput } from '../component_kit/cw_text_input';
import { CWButton } from '../component_kit/new_designs/CWButton';
import {
  CWModalBody,
  CWModalFooter,
  CWModalHeader,
} from '../component_kit/new_designs/CWModal';

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
  return (
    <>
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
          }}
        />
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
        />
      </CWModalFooter>
    </>
  );
};
