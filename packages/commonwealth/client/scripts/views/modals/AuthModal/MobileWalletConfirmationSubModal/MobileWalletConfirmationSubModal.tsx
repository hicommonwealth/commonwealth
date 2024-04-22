import { CWButton } from 'client/scripts/views/components/component_kit/new_designs/CWButton';
import React from 'react';
import { CWIcon } from '../../../components/component_kit/cw_icons/cw_icon';
import { CWText } from '../../../components/component_kit/cw_text';
import {
  CWModal,
  CWModalBody,
  CWModalFooter,
} from '../../../components/component_kit/new_designs/CWModal';
import './MobileWalletConfirmationSubModal.scss';

type MobileWalletConfirmationSubModal = {
  isOpen: boolean;
  onClose: () => void;
  disabled?: boolean;
  onSignatureConfirmation?: () => void;
};

const MobileWalletConfirmationSubModal = ({
  isOpen,
  onClose,
  disabled,
  onSignatureConfirmation,
}: MobileWalletConfirmationSubModal) => {
  return (
    <CWModal
      open={isOpen}
      onClose={onClose}
      size="medium"
      content={
        <section className="MobileWalletConfirmationSubModal">
          <CWIcon iconName="close" onClick={onClose} className="close-btn" />

          <img src="/static/img/branding/common-logo.svg" className="logo" />

          <CWText type="h2" className="header" isCentered>
            Please sign to continue
          </CWText>

          <CWModalBody className="content">
            <CWText type="b1" className="header" isCentered>
              You must sign with your mobile wallet to log into Common. The
              button below will redirect you to your wallet app.
            </CWText>
            <CWButton
              buttonWidth="full"
              label="Sign with wallet"
              disabled={disabled}
              onClick={onSignatureConfirmation}
            />
          </CWModalBody>

          <CWModalFooter className="footer">
            <CWText isCentered>
              Please wait for a signature request to appear.
              <br />
              This can sometimes take several seconds.
            </CWText>
          </CWModalFooter>
        </section>
      }
    />
  );
};

export { MobileWalletConfirmationSubModal };
