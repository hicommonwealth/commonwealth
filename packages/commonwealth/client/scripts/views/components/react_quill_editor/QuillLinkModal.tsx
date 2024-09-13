import React from 'react';
import { CWTextInput } from '../component_kit/cw_text_input';
import { CWButton } from '../component_kit/new_designs/CWButton';
import {
  CWModal,
  CWModalBody,
  CWModalFooter,
  CWModalHeader,
} from '../component_kit/new_designs/CWModal';

type LinkModalProps = {
  linkText: string;
  linkUrl: string;
  setIsModalOpen: (isOpen: boolean) => void;
  setLinkText: (text: string) => void;
  setLinkUrl: (url: string) => void;
  handleAddLink: () => void;
  isModalOpen: boolean;
};

export const AddLinkModal = ({
  linkUrl,
  linkText,
  isModalOpen,
  setIsModalOpen,
  setLinkText,
  setLinkUrl,
  handleAddLink,
}: LinkModalProps) => {
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
