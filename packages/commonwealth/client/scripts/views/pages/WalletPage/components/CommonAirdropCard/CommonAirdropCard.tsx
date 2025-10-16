import clsx from 'clsx';
import { useFlag } from 'hooks/useFlag';
import React, { useState } from 'react';
import {
  useClaimTokenFlow,
  useGetAllocationQuery,
  useGetClaimAddressQuery,
} from 'state/api/tokenAllocations';
import useUserStore from 'state/ui/user';
import { CWText } from 'views/components/component_kit/cw_text';
import CWBanner from 'views/components/component_kit/new_designs/CWBanner';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { AuthModal } from 'views/modals/AuthModal';
import ClaimCard from './ClaimCard';
import './CommonAirdropCard.scss';

interface CommonAirdropCardProps {
  onConnectNewAddress?: () => void;
}

// Format token balance with locale separators and 4 decimal places
const formatTokenBalance = (balance: string | number): string => {
  const numBalance = Number(balance);
  return numBalance.toLocaleString(undefined, {
    maximumFractionDigits: 4,
    minimumFractionDigits: 0,
  });
};

const CommonAirdropCard = ({ onConnectNewAddress }: CommonAirdropCardProps) => {
  const user = useUserStore();

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const claimsEnabled = useFlag('claims');
  const { transactionHash } = useClaimTokenFlow();
  const { data: claimAddress, isLoading: isLoadingClaimAddress } =
    useGetClaimAddressQuery({ enabled: user.isLoggedIn });
  const { data: allocation } = useGetAllocationQuery({
    magna_allocation_id: claimAddress?.magna_allocation_id,
    enabled:
      !!claimAddress?.magna_allocation_id &&
      !transactionHash &&
      user.isLoggedIn,
  });
  console.log('allocation => ', allocation);

  const txHash =
    (claimAddress?.magna_claim_tx_hash as `0x${string}`) ||
    transactionHash ||
    null;

  if (!claimsEnabled) {
    return <></>;
  }

  if (!user.isLoggedIn) {
    return (
      <div className="CommonAirdropCard">
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

  if (isLoadingClaimAddress) {
    return null;
  }

  // Logged-in user with no claim address or zero allocation: show an informational banner
  const tokensNumber = Number(claimAddress?.tokens ?? 0);
  if (
    user.isLoggedIn &&
    (claimAddress === null || (claimAddress && tokensNumber <= 0))
  ) {
    return (
      <div className="CommonAirdropCard">
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

  const canClaim = !!claimAddress;
  const hasClaimed = !!(claimAddress?.magna_claimed_at && txHash);
  const isClaimAvailable = !!claimAddress?.magna_synced_at;
  const isPendingClaimFunds = !!(allocation?.status === 'PENDING_FUNDING');
  const isReadyForClaimNow = !!(
    isClaimAvailable &&
    allocation?.magna_allocation_id &&
    allocation?.walletAddress &&
    (allocation?.claimable ?? 0) > 0
  );
  const isReadyForClaimAfterUnlock = !!(
    isClaimAvailable &&
    !isReadyForClaimNow &&
    (allocation?.claimable ?? 0) > 0 &&
    allocation?.unlock_start_at
  );
  const tokensCount =
    allocation?.claimable || allocation?.amount || claimAddress?.tokens || 0;
  const claimableTokens = formatTokenBalance(tokensCount);
  const initialClaimablePercentage =
    (allocation?.initial_percentage || 0) * 100;
  const initialClaimableTokens =
    tokensCount * (allocation?.initial_percentage || 0);

  return canClaim ? (
    <div
      className={clsx('CommonAirdropCard', {
        'in-progress': isClaimAvailable,
        'needs-action': !isClaimAvailable && !hasClaimed,
        completed: hasClaimed,
      })}
    >
      <CWBanner
        type={claimAddress?.address ? 'info' : 'error'}
        body={
          <div className="banner-content">
            <div className="hero-section">
              <div className="header-content">
                <div className="airdrop-title-section">
                  <CWText
                    type="h1"
                    fontWeight="semiBold"
                    className="description-text"
                  >
                    {claimAddress?.description}
                  </CWText>
                </div>
                <div className="allocation-section-container">
                  <div className="diagonal-separator"></div>
                  <div className="diagonal-separator"></div>
                  <div className="allocation-section">
                    <CWText type="caption" className="balance-label">
                      Your Allocation
                    </CWText>
                    <CWText
                      type="h1"
                      fontWeight="bold"
                      className="balance-amount"
                    >
                      {claimableTokens} {claimAddress?.token} Tokens
                    </CWText>
                  </div>
                </div>
              </div>
            </div>
            <ClaimCard
              cardNumber={1}
              hasClaimed={hasClaimed}
              isClaimAvailable={isClaimAvailable}
              isPendingClaimFunds={isPendingClaimFunds}
              isReadyForClaimNow={isReadyForClaimNow}
              isReadyForClaimAfterUnlock={isReadyForClaimAfterUnlock}
              onConnectNewAddress={onConnectNewAddress}
              claimedTXHash={claimAddress?.magna_claim_tx_hash || undefined}
              claimedToAddress={claimAddress?.address || undefined}
              allocationUnlocksAt={allocation?.unlock_start_at || undefined}
              allocationClaimedAt={claimAddress?.magna_claimed_at || undefined}
              allocatedToAddress={claimAddress?.address || ''}
              allocationId={claimAddress?.magna_allocation_id || undefined}
              claimableTokens={initialClaimableTokens}
              claimablePercentage={initialClaimablePercentage}
              tokenSymbol={claimAddress?.token || ''}
            />
          </div>
        }
      />
    </div>
  ) : null;
};

export default CommonAirdropCard;
