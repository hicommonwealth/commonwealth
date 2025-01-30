import NewProfile from 'client/scripts/models/NewProfile';
import { useFetchProfileByIdQuery } from 'client/scripts/state/api/profiles';
import { useAuthModalStore } from 'client/scripts/state/ui/modals';
import { AuthModalType } from 'client/scripts/views/modals/AuthModal';
import { PageNotFound } from 'client/scripts/views/pages/404';
import React, { useEffect, useState } from 'react';
import useUserStore from 'state/ui/user';
import { CWDivider } from 'views/components/component_kit/cw_divider';
import { AddressList } from '../CommunitySection/AddressList';
import { CommunitySectionSkeleton } from '../CommunitySection/CommunitySectionSkeleton';
import ProfileCard from '../CommunitySection/ProfileCard';
import CreateCommunityButton from '../CreateCommunityButton';
import './SidebarProfileSection.scss';

interface SidebarProfileSectionProps {
  showSkeleton: boolean;
  isInsideCommunity: boolean;
}

enum ProfileError {
  None,
  NoProfileFound,
}

export const SidebarProfileSection = ({
  showSkeleton,
  isInsideCommunity,
}: SidebarProfileSectionProps) => {
  const [profile, setProfile] = useState<NewProfile>();
  const [errorCode, setErrorCode] = useState<ProfileError>(ProfileError.None);

  const { setAuthModalType } = useAuthModalStore();

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
      setErrorCode(ProfileError.NoProfileFound);
      setProfile(undefined);
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
      return;
    }
  }, [data, isLoadingProfile, error, user.id]);

  if (showSkeleton || isLoadingProfile) return <CommunitySectionSkeleton />;

  if (errorCode === ProfileError.NoProfileFound)
    return <PageNotFound message="We cannot find this profile." />;

  return (
    <>
      <div className="SidebarProfileSection">
        {user.isLoggedIn && <ProfileCard />}
        {user.isLoggedIn && profile && (
          <div className="status-address">
            <div className="status-row">
              <AddressList
                address={user.activeAccount?.address || ''}
                addresses={[
                  ...new Map(
                    user.addresses.map((addr) => [addr.address, addr]),
                  ).values(),
                ]}
                profile={profile}
                refreshProfiles={() => {
                  refetch().catch(console.error);
                }}
                onAuthModalOpen={(modalType) =>
                  setAuthModalType(modalType || AuthModalType.SignIn)
                }
                isInsideCommunity={isInsideCommunity}
              />
            </div>
          </div>
        )}

        <CWDivider />
        <CreateCommunityButton />
        <CWDivider />
      </div>
    </>
  );
};
