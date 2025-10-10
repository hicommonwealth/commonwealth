import { ChainBase } from '@hicommonwealth/shared';
import { notifySuccess } from 'client/scripts/controllers/app/notifications';
import { formatAddressShort } from 'client/scripts/helpers';
import { useFlag } from 'client/scripts/hooks/useFlag';
import AddressInfo from 'client/scripts/models/AddressInfo';
import {
  useClaimTokenFlow,
  useGetAllocationQuery,
  useGetClaimAddressQuery,
  useUpdateClaimAddressMutation,
} from 'client/scripts/state/api/tokenAllocations';
import CWBanner from 'client/scripts/views/components/component_kit/new_designs/CWBanner';
import { CWButton } from 'client/scripts/views/components/component_kit/new_designs/CWButton';
import { AuthModal } from 'client/scripts/views/modals/AuthModal';
import moment from 'moment';
import React, { useEffect, useState } from 'react';
import useUserStore from 'state/ui/user';
import { CWCheckbox } from 'views/components/component_kit/cw_checkbox';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWSelectList } from 'views/components/component_kit/new_designs/CWSelectList';
import {
  CustomAddressOption,
  CustomAddressOptionElement,
} from 'views/modals/ManageCommunityStakeModal/StakeExchangeForm/CustomAddressOption';
// eslint-disable-next-line max-len
import { CWDivider } from 'client/scripts/views/components/component_kit/cw_divider';
import { convertAddressToDropdownOption } from 'views/modals/TradeTokenModel/CommonTradeModal/CommonTradeTokenForm/helpers';
import './TokenClaimBanner.scss';

interface TokenClaimBannerProps {
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

const getNextSyncJobTime = () => {
  const now = new Date();
  const nextHour = new Date(now);
  nextHour.setHours(now.getHours() + 1, 0, 0, 0); // Set to next hour on the hour
  const timeLeftMs = nextHour.getTime() - now.getTime();
  const timeLeftMinutes = Math.ceil(timeLeftMs / (1000 * 60));

  const nextSyncJobTimeLeft =
    timeLeftMinutes < 60
      ? `${timeLeftMinutes} minute${timeLeftMinutes !== 1 ? 's' : ''}`
      : // eslint-disable-next-line max-len
        `${Math.floor(timeLeftMinutes / 60)} hour${Math.floor(timeLeftMinutes / 60) !== 1 ? 's' : ''} and ${timeLeftMinutes % 60} minute${timeLeftMinutes % 60 !== 1 ? 's' : ''}`;
  return nextSyncJobTimeLeft;
};

const TokenClaimBanner = ({ onConnectNewAddress }: TokenClaimBannerProps) => {
  const user = useUserStore();
  const [formattedClaimable, setFormattedClaimable] = useState<string>('0');

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  // token claim address
  const [evmAddresses, setEvmAddresses] = useState<AddressInfo[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<
    AddressInfo | undefined
  >(undefined);
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);
  const [countdown, setCountdown] = useState<string>('00:00:00');
  const claimsEnabled = useFlag('claims');
  const {
    claim: claimToken,
    claimTxData,
    isPending: isClaiming,
    transactionHash,
  } = useClaimTokenFlow();
  const [isAcknowledged, setIsAcknowledged] = useState<boolean>(false);
  const { data: claimAddress, isLoading: isLoadingClaimAddress } =
    useGetClaimAddressQuery({ enabled: user.isLoggedIn });
  const { data: allocation, isLoading: isLoadingAllocation } =
    useGetAllocationQuery({
      magna_allocation_id: claimAddress?.magna_allocation_id,
      enabled:
        !!claimAddress?.magna_allocation_id &&
        !transactionHash &&
        user.isLoggedIn,
    });
  const { mutate: updateClaimAddress, isPending: isUpdating } =
    useUpdateClaimAddressMutation();
  console.log('allocation => ', allocation);

  useEffect(() => {
    const addresses = new Map<string, AddressInfo>();
    user.addresses
      .filter((address) => address.community.base === ChainBase.Ethereum)
      .forEach((address) => {
        addresses.set(address.address, address);
      });
    setEvmAddresses([...addresses.values()]);
  }, [user]);

  useEffect(() => {
    if (claimAddress?.address) {
      setSelectedAddress(
        evmAddresses.find((a) => a.address === claimAddress?.address),
      );
    }
    setFormattedClaimable(
      formatTokenBalance(
        allocation?.claimable ||
          allocation?.amount ||
          claimAddress?.tokens ||
          0,
      ),
    );
    setTxHash(
      (claimAddress?.magna_claim_tx_hash as `0x${string}`) ?? transactionHash,
    );
  }, [claimAddress, evmAddresses, allocation, transactionHash]);

  // Countdown timer effect - updates every second
  useEffect(() => {
    const updateCountdown = () => {
      const now = moment();
      const nextHour = moment().add(1, 'hour').startOf('hour');
      const duration = moment.duration(nextHour.diff(now));

      const hours = Math.floor(duration.asHours());
      const minutes = duration.minutes();
      const seconds = duration.seconds();

      const formattedTime = [
        String(hours).padStart(2, '0'),
        String(minutes).padStart(2, '0'),
        String(seconds).padStart(2, '0'),
      ].join(':');
      setCountdown(formattedTime);
    };

    // Update immediately
    updateCountdown();

    // Then update every second
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleClaimAddressUpdate = () => {
    if (selectedAddress) {
      updateClaimAddress({
        address: selectedAddress.address! as `0x${string}`,
      });
    }
  };

  // Prepare options for the dropdown
  const addressOptions = [
    ...(evmAddresses || []).map((account) =>
      convertAddressToDropdownOption(account.address!),
    ),
  ];

  // Add "Connect a new address" option
  if (onConnectNewAddress) {
    addressOptions.push({
      label: 'Connect a new address',
      value: '__connect_new__',
    });
  }

  const handleAddressChange = (
    option: { label: string; value: string } | null,
  ) => {
    if (option?.value === '__connect_new__') {
      onConnectNewAddress?.();
    } else {
      const account = evmAddresses.find((acc) => acc.address === option?.value);
      setSelectedAddress(account);
    }
  };

  if (!claimsEnabled) {
    return <></>;
  }

  if (!user.isLoggedIn) {
    return (
      <div className="TokenClaimBanner">
        <CWBanner
          type="info"
          body={
            <div className="banner-content">
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
      <div className="TokenClaimBanner">
        <CWBanner
          type="info"
          body={
            <div className="banner-content">
              <h3 className="description">No COMMON allocation at this time</h3>
              <CWText>
                This round recognizes earlier participation by community members
                across activity, collectibles, and rewards history. Your account
                isn’t included in this snapshot.
              </CWText>
              <CWText>
                Keep participating—join communities, contribute, and watch for
                future reward opportunities.
              </CWText>
            </div>
          }
        />
      </div>
    );
  }

  // Create the address form content to include in actions
  const addressFormContent = (
    <div className="claim-address-body">
      <div className="claim-address-row">
        <div className="address-input-row">
          <CWSelectList
            components={{
              Option: (originalProps) =>
                CustomAddressOption({
                  originalProps,
                  selectedAddressValue: selectedAddress?.address || '',
                }),
            }}
            noOptionsMessage={() => 'No available addresses'}
            placeholder="Select or paste your EVM address"
            value={
              selectedAddress?.address
                ? convertAddressToDropdownOption(selectedAddress.address)
                : null
            }
            defaultValue={
              claimAddress?.address
                ? convertAddressToDropdownOption(claimAddress.address)
                : null
            }
            formatOptionLabel={(option) => (
              <CustomAddressOptionElement
                value={option.value}
                label={option.label}
                selectedAddressValue={selectedAddress?.address || ''}
              />
            )}
            label="Token Claim Address"
            isClearable={false}
            isSearchable={true}
            options={addressOptions}
            onChange={handleAddressChange}
            aria-label="Select or enter your EVM address for token claiming"
          />
          {selectedAddress?.address && (
            <CWIcon
              iconName="copy"
              iconSize="medium"
              className="copy-icon"
              onClick={() => {
                void navigator.clipboard.writeText(selectedAddress.address);
                notifySuccess('Address copied to clipboard!');
              }}
            />
          )}
        </div>
      </div>
    </div>
  );

  const canClaim = !!claimAddress;
  const hasClaimed = claimAddress?.magna_claimed_at && txHash;
  const isClaimAvailable = claimAddress?.magna_synced_at;
  const isPendingClaimFunds = allocation?.status === 'PENDING_FUNDING';
  const isReadyForClaimNow =
    isClaimAvailable &&
    allocation &&
    allocation.magna_allocation_id &&
    allocation.walletAddress &&
    allocation.claimable > 0;
  const isReadyForClaimAfterUnlock =
    isClaimAvailable &&
    !isReadyForClaimNow &&
    allocation &&
    allocation.claimable > 0 &&
    allocation.unlock_start_at;

  const getClaimCopy = () => {
    if (!canClaim) return null;

    if (hasClaimed) {
      return (
        <div className="notice-section">
          <div className="notice-text">
            <p className="base-notice">
              You claimed your tokens on{' '}
              {claimAddress?.magna_claimed_at && (
                <strong>
                  {new Date(claimAddress?.magna_claimed_at).toLocaleString()}
                </strong>
              )}
            </p>
            <CWButton
              label="View transaction on BaseScan"
              onClick={() =>
                window.open(
                  `https://basescan.org/tx/${txHash}`,
                  '_blank',
                  'noopener,noreferrer',
                )
              }
              buttonType="secondary"
              className="tx-link-button"
              aria-label="View transaction on BaseScan"
            />
          </div>
        </div>
      );
    }

    if (isClaimAvailable) {
      if (isReadyForClaimNow) {
        return (
          <div className="notice-section">
            <div className="notice-text">
              {isPendingClaimFunds ? (
                <>
                  <div className="countdown-timer">
                    <CWText
                      type="h4"
                      fontWeight="medium"
                      className="timer-label"
                    >
                      Claim In
                    </CWText>
                    <CWText
                      type="h1"
                      fontWeight="bold"
                      className="timer-display"
                    >
                      {countdown}
                    </CWText>
                  </div>
                  <p className="batch-processing-notice">
                    Your claim request has been received. Claims are processed
                    in batches, and your request is expected to be included in
                    the next batch.
                  </p>
                </>
              ) : (
                <p style={{ textAlign: 'left' }}>
                  <strong>Before Claiming</strong>
                  <ul style={{ listStyleType: 'disc' }}>
                    <li>
                      Verify that you are on the <strong>common.xyz</strong>{' '}
                      domain
                    </li>
                    <li>
                      Your wallet is connected to the <strong>Base</strong>{' '}
                      network
                    </li>
                    <li>Never approve unlimited token allowances</li>
                  </ul>
                </p>
              )}
              {!isPendingClaimFunds && (
                <CWButton
                  label={`Claim to ${formatAddressShort(
                    allocation?.walletAddress || '',
                    6,
                  )}`}
                  onClick={() => {
                    if (allocation) {
                      claimToken({
                        allocation_id: allocation.magna_allocation_id,
                      });
                    }
                  }}
                  disabled={
                    isClaiming || isLoadingAllocation || isPendingClaimFunds
                  }
                  aria-label={`Claim to ${formatAddressShort(
                    allocation?.walletAddress || '',
                    6,
                  )}`}
                />
              )}
              {claimTxData && (
                <div className="claim-tx-data">
                  <p>
                    If you face issues with the claim process, complete a manual
                    transaction to from your wallet with these steps
                  </p>
                  <ul style={{ listStyleType: 'disc' }}>
                    <li>
                      Enable <strong>&apos;Show hex data&apos;</strong> in your
                      wallet settings.
                    </li>
                    <li>
                      Send a transaction of 0.0003 ETH to{' '}
                      <span
                        className="copyable-address"
                        onClick={() => {
                          void navigator.clipboard.writeText(claimTxData.from);
                          notifySuccess('Address copied to clipboard!');
                        }}
                      >
                        {formatAddressShort(claimTxData.from, 4)}
                        <CWIcon iconName="copy" iconSize="small" />
                      </span>{' '}
                      with hex data{' '}
                      <span
                        className="copyable-address"
                        onClick={() => {
                          void navigator.clipboard.writeText(claimTxData.data);
                          notifySuccess('Hex data copied to clipboard!');
                        }}
                      >
                        {formatAddressShort(claimTxData.data, 4)}
                        <CWIcon iconName="copy" iconSize="small" />
                      </span>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        );
      }

      if (isReadyForClaimAfterUnlock) {
        <div className="notice-section">
          <p>
            You can claim your tokens after{' '}
            {allocation.unlock_start_at &&
              new Date(allocation.unlock_start_at).toLocaleDateString()}
          </p>
        </div>;
      }

      // claim is available but we landed on an error case
      return (
        <div className="notice-section">
          <p>
            Please contact tech@common.foundation or reach out in the Common
            Discord if you need help.
          </p>
        </div>
      );
    }

    // Show ui to set address for claim
    return (
      <div className="notice-section">
        <div className="notice-text">
          <p className="base-notice">
            We are going live on Base. You must set an EVM address to claim your
            allocation.
          </p>
          <p className="base-notice">
            Once you set an EVM address we need to sync onchain, we process
            these syncs at the top of every hour. The next sync will happen in{' '}
            {getNextSyncJobTime()}
          </p>
          <div className="banner-actions">
            {addressFormContent}
            <CWCheckbox
              checked={isAcknowledged}
              onChange={(e) => setIsAcknowledged(!!e?.target?.checked)}
              label={
                <p>
                  I understand that by adding my address, I adhere to the{' '}
                  <a
                    href="/airdrop-terms.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    airdrop terms of service
                  </a>{' '}
                  and{' '}
                  <a
                    href="https://common.foundation/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    privacy policy
                  </a>
                  .
                </p>
              }
            />
            {isAcknowledged && (
              <CWButton
                label={isUpdating ? 'Saving...' : 'Save address'}
                onClick={handleClaimAddressUpdate}
                disabled={
                  isUpdating ||
                  !selectedAddress ||
                  selectedAddress.address === claimAddress?.address
                }
                buttonType="secondary"
                buttonHeight="sm"
                aria-label="Save the selected address for token claiming"
              />
            )}
          </div>
        </div>
      </div>
    );
  };

  return canClaim ? (
    <div className="TokenClaimBanner">
      <CWBanner
        type={claimAddress?.address ? 'info' : 'error'}
        body={
          <div className="banner-content">
            <div className="hero-section">
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  width: 'fit-content',
                }}
              >
                <CWText
                  type="h1"
                  fontWeight="semiBold"
                  className="description-text"
                >
                  {claimAddress?.description}
                </CWText>
                <CWDivider />
              </div>
              <div className="token-balance-container">
                <CWText type="caption" className="balance-label">
                  Your Allocation
                </CWText>
                <CWText type="h1" fontWeight="bold" className="balance-amount">
                  {formattedClaimable} {claimAddress?.token} Tokens
                </CWText>
              </div>
            </div>
            <div className="notice-section">{getClaimCopy()}</div>
          </div>
        }
      />
    </div>
  ) : null;
};

export default TokenClaimBanner;
