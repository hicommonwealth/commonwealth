import React from 'react';
import { CWText } from '../../components/component_kit/cw_text';
import {
  CWModal,
  CWModalBody,
  CWModalFooter,
  CWModalHeader,
} from '../../components/component_kit/new_designs/CWModal';
import { ThreadTokenWidget } from '../../components/NewThreadFormLegacy/ToketWidget';
import './ThreadTokenModal.scss';

interface ThreadTokenModalProps {
  isOpen: boolean;
  onModalClose?: () => void;
  threadId?: number;
  communityId?: string;
  addressType?: string;
  chainNode?: any;
  tokenCommunity?: any;
}

const ThreadTokenModal = ({
  isOpen,
  onModalClose,
  threadId,
  communityId,
  addressType,
  chainNode,
  tokenCommunity,
}: ThreadTokenModalProps) => {
  return (
    <CWModal
      open={isOpen}
      onClose={() => onModalClose?.()}
      size="medium"
      className="ThreadTokenModal"
      content={
        <>
          <CWModalHeader
            label={
              <CWText type="h4" className="token-info">
                Trade Thread Token
              </CWText>
            }
            onModalClose={() => onModalClose?.()}
          />
          <CWModalBody>
            <ThreadTokenWidget
              tokenizedThreadsEnabled={true}
              threadId={threadId}
              communityId={communityId}
              addressType={addressType}
              chainNode={chainNode}
              tokenCommunity={tokenCommunity}
            />
          </CWModalBody>
          <CWModalFooter>
            <></>
          </CWModalFooter>
        </>
      }
    />
  );
};

export default ThreadTokenModal;
