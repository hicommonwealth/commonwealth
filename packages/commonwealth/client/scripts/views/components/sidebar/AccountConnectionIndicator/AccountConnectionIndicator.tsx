import { useFlag } from 'client/scripts/hooks/useFlag';
import AddressInfo from 'client/scripts/models/AddressInfo';
import NewProfile from 'client/scripts/models/NewProfile';
import { useFetchProfileByIdQuery } from 'client/scripts/state/api/profiles';
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router';
import { useInviteLinkModal } from 'state/ui/modals';
import useUserStore from 'state/ui/user';
import useJoinCommunity from 'views/components/SublayoutHeader/useJoinCommunity';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { SharePopover } from '../../SharePopover';
import { AddressList } from '../CommunitySection/AddressList';
import './AccountConnectionIndicator.scss';

interface AccountConnectionIndicatorProps {
  connected: boolean;
  address: string;
}

const AccountConnectionIndicator = ({
  connected,
  address,
}: AccountConnectionIndicatorProps) => {
  const [profile, setProfile] = useState<NewProfile>();
  const [addresses, setAddresses] = useState<AddressInfo[]>();

  const { handleJoinCommunity, JoinCommunityModals } = useJoinCommunity();
  const referralsEnabled = useFlag('referrals');
  const { setIsInviteLinkModalOpen } = useInviteLinkModal();

  const location = useLocation();
  const pathname = location.pathname;
  const communityId = pathname.split('/')[1];

  const user = useUserStore();

  const {
    data,
    isLoading: isLoadingProfile,
    error,
    refetch,
  } = useFetchProfileByIdQuery({
    apiCallEnabled: user.isLoggedIn,
    userId: user.id,
  });

  useEffect(() => {
    if (isLoadingProfile) return;

    if (error) {
      setProfile(undefined);
      setAddresses([]);
      return;
    }

    if (data) {
      setProfile(
        new NewProfile({
          ...data.profile,
          userId: data.userId,
          isOwner: data.userId === user.id,
        }),
      );
      setAddresses(
        // @ts-expect-error <StrictNullChecks/>
        data.addresses
          .filter((addr) => addr.community_id === communityId)
          .map((a) => {
            try {
              return new AddressInfo({
                userId: a.user_id!,
                id: a.id!,
                address: a.address,
                community: {
                  id: a.community_id!,
                  // we don't get other community properties from api + they aren't needed here
                },
                walletId: a.wallet_id!,
                ghostAddress: a.ghost_address,
              });
            } catch (err) {
              console.error(`Could not return AddressInfo: "${err}"`);
              return null;
            }
          }),
      );
      return;
    }
  }, [data, isLoadingProfile, error, user.id]);

  if (error || !profile) {
    return null;
  }

  return (
    <>
      <div className="AccountConnectionIndicator">
        {connected && (
          <div className="status-address">
            <CWText fontWeight="medium" type="caption" className="status-text">
              {connected ? 'Addresses' : 'Not connected'}
            </CWText>
            <div className="status-row">
              <AddressList
                address={address}
                addresses={addresses}
                profile={profile}
                refreshProfiles={(addressInfo) => {
                  refetch().catch(console.error);
                  user.setData({
                    addresses: [...user.addresses].filter(
                      (addr) =>
                        addr.community.id !== addressInfo.community.id &&
                        addr.address !== addressInfo.address,
                    ),
                  });
                }}
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
            {...(connected ? { iconLeft: 'checkCircleFilled' } : {})}
            buttonHeight="sm"
            buttonWidth="full"
            label={connected ? 'Joined' : 'Join community'}
            disabled={connected}
            onClick={handleJoinCommunity}
          />
          <SharePopover linkToShare={window.location.href} />
        </div>
      </div>
      {JoinCommunityModals}
    </>
  );
};

export default AccountConnectionIndicator;
