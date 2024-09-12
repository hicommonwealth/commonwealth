import React from 'react';
import { CWTextInput } from '../component_kit/cw_text_input';
import { CWButton } from '../component_kit/new_designs/CWButton';
import {
  CWModal,
  CWModalBody,
  CWModalFooter,
  CWModalHeader,
} from '../component_kit/new_designs/CWModal';

type LinkModalAttrs = {
  linkText: string; // The text for the link
  linkUrl: string; // The URL for the link
  setIsModalOpen: (isOpen: boolean) => void; // Function to control modal state
  setLinkText: (text: string) => void; // Function to set link text
  setLinkUrl: (url: string) => void; // Function to set link URL
  handleAddLink: () => void; // Function to handle adding the link
  isModalOpen: boolean; //modal state
};

export const AddLinkModal = ({
  linkUrl,
  linkText,
  isModalOpen,
  setIsModalOpen,
  setLinkText,
  setLinkUrl,
  handleAddLink,
}: LinkModalAttrs) => {
  const handleModalClose = () => {
    setIsModalOpen(!isModalOpen);
    setLinkText('');
    setLinkUrl('');
  };
  return (
    <CWModal
      size="small"
      visibleOverflow
      content={
        <>
          <CWModalHeader label="Add Link" onModalClose={handleModalClose} />
          <CWModalBody>
            <CWTextInput
              label="Link Text"
              placeholder="Enter Link Text"
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
              onClick={handleModalClose}
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
      }
      onClose={handleModalClose}
      open={isModalOpen}
    />
  );
};
