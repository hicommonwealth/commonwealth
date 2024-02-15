import React, { useState } from 'react';

import { CWCheckbox } from 'views/components/component_kit/cw_checkbox';
import { CWText } from 'views/components/component_kit/cw_text';
import {
  CWModalBody,
  CWModalFooter,
  CWModalHeader,
} from 'views/components/component_kit/new_designs/CWModal';
import { CWButton } from 'views/components/component_kit/new_designs/cw_button';

import './DismissStakeBannerModal.scss';

interface DismissStakeBannerModalProps {
  onModalClose: () => any;
  onDismiss: (
    dismissForThisCommunity: boolean,
    dismissForAnyCommunity: boolean,
  ) => any;
}

const DismissStakeBannerModal = ({
  onModalClose,
  onDismiss,
}: DismissStakeBannerModalProps) => {
  const [isThisCommunityChecked, setIsThisCommunityChecked] = useState(false);
  const [isAnyCommunityChecked, setIsAnyCommunityChecked] = useState(false);

  return (
    <div className="DismissStakeBannerModal">
      <CWModalHeader
        label="Dismiss Community Stake Banner"
        onModalClose={onModalClose}
      />
      <CWModalBody>
        <CWText type="b1" className="description">
          You can mint community stake for any community where it is enabled.
          Read more here:{' '}
          <a
            href="https://common.xyz/faq/stake"
            target="_blank"
            rel="noopener noreferrer"
          >
            common.xyz/faq/stake
          </a>
        </CWText>
        <CWCheckbox
          checked={isThisCommunityChecked}
          label="Don’t show for this community"
          onChange={() =>
            setIsThisCommunityChecked((prevChecked) => !prevChecked)
          }
        />
        <CWCheckbox
          checked={isAnyCommunityChecked}
          label="Don’t show for any community"
          onChange={() =>
            setIsAnyCommunityChecked((prevChecked) => !prevChecked)
          }
        />
      </CWModalBody>
      <CWModalFooter>
        <CWButton
          label="Cancel"
          buttonType="secondary"
          onClick={onModalClose}
        />
        <CWButton
          label="Confirm"
          buttonWidth="wide"
          onClick={() =>
            onDismiss(isThisCommunityChecked, isAnyCommunityChecked)
          }
        />
      </CWModalFooter>
    </div>
  );
};

export default DismissStakeBannerModal;
