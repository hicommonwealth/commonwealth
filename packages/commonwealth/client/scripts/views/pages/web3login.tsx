import React from 'react';

import { link } from 'helpers';

import { redraw } from 'mithrilInterop';
import $ from 'jquery';

import 'pages/web3login.scss';
import app from 'state';
import Sublayout from 'views/sublayout';
import { CWButton } from '../components/component_kit/cw_button';
import { CWText } from '../components/component_kit/cw_text';
import { isWindowMediumSmallInclusive } from '../components/component_kit/helpers';
import { LoginModal } from '../modals/login_modal';
import { PageNotFound } from './404';
import { PageLoading } from './loading';
import { isNonEmptyString } from 'helpers/typeGuards';
import { Modal } from '../components/component_kit/cw_modal';
import { useCommonNavigate } from 'navigation/helpers';
import { useSearchParams } from 'react-router-dom';

const Web3LoginPage = () => {
  const navigate = useCommonNavigate();
  const [searchParams] = useSearchParams();
  const [errorMsg, setErrorMsg] = React.useState<string>('');
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = React.useState<boolean>(false);

  const token = searchParams.get('connect');

  if (app.isCustomDomain() || !token) {
    // hide page if invalid arguments or via custom domain
    return <PageNotFound />;
  }

  if (isLoading) {
    return <PageLoading message="Redirecting..." />;
  }

  // hit auth callback and redirect
  const onSuccess = async () => {
    if (!app.isLoggedIn()) {
      // user should never be logged out when this method is called
      return;
    }

    setIsLoading(true);

    try {
      const { status, result } = await $.get(
        `${app.serverUrl()}/auth/callback`,
        {
          jwt: app.user.jwt,
          token,
        }
      );

      if (status === 'Success') {
        // TODO: validate URL?
        // REDIRECT TO CMNBOT
        window.location.href = result;
      } else {
        console.error('Unknown error occurred', status, result);
      }
    } catch (e) {
      setErrorMsg(e.responseJSON.error);

      redraw();
    }
  };

  return (
    <>
      <Modal
        content={<LoginModal onModalClose={() => setIsModalOpen(false)} />}
        isFullScreen={isWindowMediumSmallInclusive(window.innerWidth)}
        onClose={() => setIsModalOpen(false)}
        open={isModalOpen}
      />
      <Sublayout>
        <div className="Web3LoginPage">
          <div className="web3-login-container">
            <CWButton
              label="Connect"
              buttonType="lg-primary-blue"
              onClick={() => {
                if (app.isLoggedIn()) {
                  onSuccess();
                } else {
                  setIsModalOpen(true);
                }
              }}
            />
            {searchParams.get('prev')
              ? link(
                  'a.web3login-go-home',
                  searchParams.get('prev'),
                  'Go back',
                  navigate
                )
              : link(
                  'a.web3login-go-home',
                  app.isCustomDomain() ? '/' : `/${app.activeChainId()}`,
                  'Go home',
                  navigate
                )}
            {isNonEmptyString(errorMsg) && <CWText>{errorMsg}</CWText>}
          </div>
        </div>
      </Sublayout>
    </>
  );
};

export default Web3LoginPage;
