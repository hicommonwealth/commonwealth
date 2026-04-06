import React from 'react';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { ManageMagicWalletContent } from '../../../ManageMagicWalletModal/ManageMagicWalletContent';

import './MagicWalletCreationStep.scss';

type MagicWalletCreationStepProps = {
  onComplete: () => void;
};

const MagicWalletCreationStep = ({
  onComplete,
}: MagicWalletCreationStepProps) => {
  return (
    <section className="MagicWalletCreationStep">
      <ManageMagicWalletContent />
      <div className="button-container">
        <CWButton
          label="Skip"
          type="submit"
          onClick={onComplete}
          buttonType="secondary"
        />
        <CWButton label="Next" type="submit" onClick={onComplete} />
      </div>
    </section>
  );
};

export { MagicWalletCreationStep };
