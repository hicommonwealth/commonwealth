import React from 'react';
import useUserStore from 'state/ui/user';
import { useAuthModalStore } from '../../state/ui/modals';
import { CWEmptyState } from '../components/component_kit/cw_empty_state';
import { CWButton } from '../components/component_kit/new_designs/CWButton';
import { AuthModal, AuthModalType } from '../modals/AuthModal';
import './404.scss';

type PageNotFoundProps = { title?: string; message?: string };

export const PageNotFound = (props: PageNotFoundProps) => {
  const { message } = props;

  const user = useUserStore();

  const { authModalType, setAuthModalType } = useAuthModalStore();

  return (
    <div className="PageNotFound">
      <CWEmptyState
        iconName="cautionCircle"
        content={
          message ||
          `
            This page is private or doesn't exist.
            Please Sign in to view or join the conversation.
            `
        }
      />
      {!user.isLoggedIn && (
        <CWButton
          buttonType="primary"
          label="Sign in"
          onClick={() => setAuthModalType(AuthModalType.SignIn)}
        />
      )}
      <AuthModal
        type={AuthModalType.SignIn}
        onClose={() => setAuthModalType(undefined)}
        isOpen={!!authModalType}
      />
    </div>
  );
};
