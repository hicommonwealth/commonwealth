import { createBoundedUseStore } from 'state/ui/utils';
import { devtools, persist } from 'zustand/middleware';
import { createStore } from 'zustand/vanilla';

interface WelcomeOnboardModalProps {
  onboardedProfiles: {
    [profileId: string]: boolean;
  };
  setProfileAsOnboarded: (profileId: string | number) => void;
  isWelcomeOnboardModalOpen: boolean;
  setIsWelcomeOnboardModalOpen: (isOpen: boolean) => void;
}

export const welcomeOnboardModal = createStore<WelcomeOnboardModalProps>()(
  devtools(
    persist(
      (set) => ({
        onboardedProfiles: {},
        setProfileAsOnboarded: (profileId) => {
          if (!profileId) return;

          set((state) => {
            return {
              ...state,
              onboardedProfiles: {
                ...state.onboardedProfiles,
                [profileId]: true,
              },
            };
          });
        },
        isWelcomeOnboardModalOpen: false,
        setIsWelcomeOnboardModalOpen: (isOpen) => {
          set((state) => {
            return {
              ...state,
              isWelcomeOnboardModalOpen: isOpen,
            };
          });
        },
      }),
      {
        name: 'onboarded-users', // unique name
        partialize: (state) => ({
          onboardedProfiles: state.onboardedProfiles,
        }), // persist only shouldHionboardedProfilesdeAdminCardsPermanently
      },
    ),
  ),
);

const useWelcomeOnboardModal = createBoundedUseStore(welcomeOnboardModal);

export default useWelcomeOnboardModal;
