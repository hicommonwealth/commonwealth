import React from 'react';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import magicWalletModalImage from '../../../../../../assets/img/magic-wallet-modal-image.svg';
import './MagicWalletCreationStep.scss';

type MagicWalletCreationStepProps = {
  onComplete: () => void;
};
const MagicWalletCreationStep = ({
  onComplete,
}: MagicWalletCreationStepProps) => {
  return (
    <section className="MagicWalletCreationStep">
      <CWText type="h4" fontWeight="semiBold">
        Your Magic Wallet is ready.
      </CWText>
      <img src={magicWalletModalImage} alt="" className="img" />
      <CWText type="b2">
        Use it to add funds, mint, and vote. Access your wallet in your profile
      </CWText>
      <CWButton
        label="Next"
        buttonWidth="full"
        type="submit"
        onClick={onComplete}
      />
    </section>
  );
};

export { MagicWalletCreationStep };
