import { useFlag } from 'hooks/useFlag';
import React, { useState } from 'react';
import { useGetClaimAddressQuery } from 'state/api/tokenAllocations';
import useUserStore from 'state/ui/user';
import { CWText } from 'views/components/component_kit/cw_text';
import CWBanner from 'views/components/component_kit/new_designs/CWBanner';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { AuthModal } from 'views/modals/AuthModal';
import './AirdropClaims.scss';
import CommonAirdropCard from './CommonAirdropCard';

interface AirdropClaimsProps {
  onConnectNewAddress?: () => void;
}

const AirdropClaims = ({ onConnectNewAddress }: AirdropClaimsProps) => {
  const user = useUserStore();

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const claimsEnabled = useFlag('claims');
  const { data: claimAddresses, isLoading: isLoadingClaimAddresses } =
    useGetClaimAddressQuery({ enabled: claimsEnabled && user.isLoggedIn });

  if (!claimsEnabled) {
    return <></>;
  }

  if (!user.isLoggedIn) {
    return (
      <div className="AirdropClaims">
        <CWBanner
          type="info"
          body={
            <div className="general-notice">
              <h3 className="description">Login to check your COMMON Claim</h3>
              <CWButton
                label="Login to check"
                onClick={() => setIsAuthModalOpen(true)}
              />
            </div>
          }
        />

        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
        />
      </div>
    );
  }

  if (
    isLoadingClaimAddresses ||
    !claimAddresses ||
    claimAddresses.length === 0
  ) {
    return null;
  }

  // Logged-in user with no claim address or zero allocation: show an informational banner
  const hasSomeAllocation =
    claimAddresses &&
    claimAddresses.map((x) => x.tokens).filter((x) => x && x > 0).length > 0;
  if (user.isLoggedIn && !hasSomeAllocation) {
    return (
      <div className="AirdropClaims">
        <div className="notice-text">
          <div className="no-allocation-notice">
            <CWText
              type="h5"
              fontWeight="semiBold"
              className="no-allocation-title"
            >
              No COMMON Allocation
            </CWText>
            <CWText className="no-allocation-description">
              This round recognizes earlier participation by community members
              across activity, collectibles, and rewards history. Your account
              isn&apos;t included in this snapshot.
            </CWText>
            <CWText className="no-allocation-encouragement">
              Keep participating, join communities, contribute, and watch for
              future reward opportunities.
            </CWText>
          </div>
        </div>
      </div>
    );
  }

  return claimAddresses
    .filter((x) => x.tokens && Number(x.tokens) > 0)
    .map((claim) => (
      <CommonAirdropCard
        key={claim.event_id}
        claim={{
          ...claim,
          unlock_start_at: claim.unlock_start_at || undefined,
          cliff_date: claim.cliff_date || undefined,
          magna_claim_tx_at: claim.magna_claim_tx_at || undefined,
          magna_cliff_claim_tx_at: claim.magna_cliff_claim_tx_at || undefined,
        }}
        onConnectNewAddress={onConnectNewAddress}
      />
    ));
};

export default AirdropClaims;
