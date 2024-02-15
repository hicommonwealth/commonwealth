import { createBoundedUseStore } from 'state/ui/utils';
import { devtools, persist } from 'zustand/middleware';
import { createStore } from 'zustand/vanilla';

type DismissBannerProps = {
  communityId: string;
  communityDismissal: boolean;
  allCommunitiesDismissal: boolean;
};

interface CommunityStakeStore {
  isBannerVisible: (communityId: string) => boolean;
  dismissedInCommunities: string[];
  dismissedForAll: boolean;
  dismissBanner: ({
    communityId,
    communityDismissal,
    allCommunitiesDismissal,
  }: DismissBannerProps) => void;
}

const SESSION_STORAGE_KEY = 'community_stake_banner';

const communityStakeStore = createStore<CommunityStakeStore>()(
  devtools(
    persist(
      (set, get) => ({
        dismissedInCommunities: [],
        dismissedForAll: false,
        isBannerVisible: (communityId) => {
          const sessionStorageData =
            JSON.parse(sessionStorage.getItem(SESSION_STORAGE_KEY)) || [];
          const dismissedForSession = sessionStorageData.includes(communityId);

          const dismissedForCommunity =
            get().dismissedInCommunities.includes(communityId);

          const dismissedForAllCommunities = get().dismissedForAll;

          return (
            !dismissedForSession &&
            !dismissedForCommunity &&
            !dismissedForAllCommunities
          );
        },
        dismissBanner: ({
          communityId,
          communityDismissal,
          allCommunitiesDismissal,
        }) => {
          if (!communityDismissal && !allCommunitiesDismissal) {
            const data =
              JSON.parse(sessionStorage.getItem(SESSION_STORAGE_KEY)) || [];

            sessionStorage.setItem(
              SESSION_STORAGE_KEY,
              JSON.stringify([...data, communityId]),
            );

            set(get());
          }

          if (communityDismissal) {
            set({
              dismissedInCommunities: [
                ...get().dismissedInCommunities,
                communityId,
              ],
            });

            return;
          }

          if (allCommunitiesDismissal) {
            set({
              dismissedForAll: true,
            });

            return;
          }
        },
      }),
      {
        name: 'communityStake',
      },
    ),
  ),
);

const useCommunityStakeStore = createBoundedUseStore(communityStakeStore);

export default useCommunityStakeStore;
