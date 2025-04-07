import { CWCheckbox } from 'client/scripts/views/components/component_kit/cw_checkbox';
import { CWIcon } from 'client/scripts/views/components/component_kit/cw_icons/cw_icon';
import { CWTextInput } from 'client/scripts/views/components/component_kit/cw_text_input';
import {
  CWModalBody,
  CWModalFooter,
  CWModalHeader,
} from 'client/scripts/views/components/component_kit/new_designs/CWModal';
import { CWSelectList } from 'client/scripts/views/components/component_kit/new_designs/CWSelectList';
import React from 'react';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import './TokenizationModal.scss';

interface TokenizationModalProps {
  onUnderstand: () => void;
  onDismiss: () => void;
  onCancel: () => void;
  onSaveChanges: () => void;
}

const TokenizationModal = ({
  onUnderstand,
  onDismiss,
  onCancel,
  onSaveChanges,
}: TokenizationModalProps) => {
  return (
    <div className="TokenizationModal">
      <CWModalHeader label="Tokenization Settings" onModalClose={onCancel} />

      <CWModalBody>
        <div className="info-box">
          <div className="header">
            <CWIcon iconName="infoEmpty" className="blue-icon" />
            <CWText type="b2" fontWeight="semiBold" className="blue">
              How it works
            </CWText>
          </div>

          <CWText className="blue">
            By default, all topics created in this community allow tokenized
            threads. Threads created in these topics will count as entries
            during community-wide contests. Read more about tokenized threads
            here.
          </CWText>
          <div className="info-actions">
            <CWButton
              buttonType="secondary"
              label="I understand"
              onClick={onUnderstand}
            />
            <CWButton
              buttonType="tertiary"
              label="Dismiss"
              onClick={onDismiss}
            />
          </div>
        </div>

        <div className="topics-row">
          <div className="header">
            <CWText type="b2" fontWeight="semiBold">
              Tokenized Topics
            </CWText>
            <CWCheckbox label="Tokenize all topics" name="tokenizeAllTopics" />
          </div>

          <CWSelectList
            name="searchTopics"
            placeholder="Search Topics"
            isSearchable={true}
            options={[]}
          />
        </div>

        <div className="token-section">
          <CWText type="b2" fontWeight="semiBold">
            Primary token
          </CWText>
          <CWText type="caption">
            Enter a token to purchase and sell threads in this community.
          </CWText>

          <CWTextInput />
        </div>
      </CWModalBody>

      <CWModalFooter>
        <CWButton buttonType="secondary" label="Cancel" onClick={onCancel} />
        <CWButton
          buttonType="primary"
          label="Save Changes"
          onClick={onSaveChanges}
        />
      </CWModalFooter>
    </div>
  );
};

export default TokenizationModal;
