import { useFlag } from 'client/scripts/hooks/useFlag';
import AddressInfo from 'client/scripts/models/AddressInfo';
import NewProfile from 'client/scripts/models/NewProfile';
import { AuthModalType } from 'client/scripts/views/modals/AuthModal';
import React, { useState } from 'react';
import app from 'state';
import { useInviteLinkModal } from 'state/ui/modals';
import useJoinCommunity from 'views/components/SublayoutHeader/useJoinCommunity';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { CWModal } from 'views/components/component_kit/new_designs/CWModal';
import { SharePopover } from '../../SharePopover';
import { AddressList } from '../CommunitySection/AddressList';
import { DeleteAddressModal } from 'client/scripts/views/modals/delete_address_modal';

import './AccountConnectionIndicator.scss';

interface AccountConnectionIndicatorProps {
  connected: boolean;
  address: string;
  addresses: AddressInfo[] | undefined;
  profile: NewProfile | undefined;
  refreshProfiles: () => void;
  onAuthModalOpen: (modalType?: AuthModalType) => void;
  isInsideCommunity?: boolean;
}

const AccountConnectionIndicator = ({
  connected,
  address,
  profile,
  addresses,
  refreshProfiles,
  onAuthModalOpen,
  isInsideCommunity,
}: AccountConnectionIndicatorProps) => {
  const { handleJoinCommunity, JoinCommunityModals } = useJoinCommunity();
  const referralsEnabled = useFlag('referrals');
  const { setIsInviteLinkModalOpen } = useInviteLinkModal();
  const [isHovering, setIsHovering] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);

  if (!profile) {
    return null;
  }

  return (
    <>
      <div className="AccountConnectionIndicator">
        {connected && (
          <div className="status-address">
            <div className="status-row">
              <AddressList
                address={address}
                addresses={addresses}
                profile={profile}
                refreshProfiles={refreshProfiles}
                onAuthModalOpen={() => onAuthModalOpen()}
                isInsideCommunity={isInsideCommunity}
              />
            </div>

            {referralsEnabled && (
              <CWButton
                buttonType="tertiary"
                buttonHeight="sm"
                buttonWidth="full"
                label="Get referral link"
                className="referral-link-button"
                onClick={() => setIsInviteLinkModalOpen(true)}
              />
            )}
          </div>
        )}

        <div className="status-button">
          <CWButton
            {...(connected && !isHovering ? { iconLeft: 'checkCircleFilled' } : {})}
            buttonHeight="sm"
            buttonWidth="full"
            buttonType={connected && isHovering ? 'destructive' : 'primary'}
            buttonAlt={connected && isHovering ? 'rorange' : undefined}
            label={connected ? (isHovering ? 'Leave' : 'Joined') : 'Join community'}
            onMouseEnter={connected ? () => setIsHovering(true) : undefined}
            onMouseLeave={connected ? () => setIsHovering(false) : undefined}
            onClick={
              connected
                ? () => setIsLeaveModalOpen(true)
                : handleJoinCommunity
            }
          />
          <SharePopover
            linkToShare={
              window.location.origin +
              '/' +
              app.activeChainId() +
              '/discussions'
            }
          />
        </div>
      </div>
      {JoinCommunityModals}
      <CWModal
        size="small"
        open={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        content={
          addresses && addresses[0] ? (
            <DeleteAddressModal
              addresses={addresses}
              address={addresses[0]}
              chain={addresses[0].community?.id || ''}
              closeModal={() => setIsLeaveModalOpen(false)}
              communityName={app.chain?.meta?.name || ''}
              isBulkDelete
              isLastCommunityAddress
            />
          ) : null
        }
      />
    </>
  );
};

export default AccountConnectionIndicator;
