import clsx from 'clsx';
import React, { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { CWIcon } from '../../../../components/component_kit/cw_icons/cw_icon';
import { CWText } from '../../../../components/component_kit/cw_text';
import {
  CWModalBody,
  CWModalFooter,
} from '../../../../components/component_kit/new_designs/CWModal';
import './ModalLayout.scss';

const MODAL_COPY = {
  'create-account': {
    title: 'Create account',
    description: `Common is built on web3 technology that utilizes wallets. \nHow would you like to sign up?`,
    showExistingAccountSignInFooter: true,
  },
  'sign-in': {
    title: 'Sign into Common',
    description: '',
    showExistingAccountSignInFooter: false,
  },
};

export type ModalLayoutProps = {
  onClose: () => any;
  type: 'create-account' | 'sign-in';
  body: ReactNode;
  bodyClassName?: string;
  onSignInClick?: () => any;
};

const ModalLayout = ({
  onClose,
  type,
  body,
  bodyClassName,
  onSignInClick,
}: ModalLayoutProps) => {
  const copy = MODAL_COPY[type];

  return (
    <section className="ModalLayout">
      <CWIcon iconName="close" onClick={onClose} className="close-btn" />

      <img src="/static/img/branding/common-logo.svg" className="logo" />

      <CWText type="h2" className="header" isCentered>
        {copy.title}
      </CWText>

      {copy.description && (
        <CWText type="b1" className="description" isCentered>
          {...copy.description.split('\n').map((line) => (
            <>
              {line}
              <br />
            </>
          ))}
        </CWText>
      )}

      <CWModalBody className={clsx('content', bodyClassName)}>
        {body}
      </CWModalBody>

      <CWModalFooter className="footer">
        <CWText isCentered>
          By connecting to Common you agree to our&nbsp;
          <br />
          <Link to="/terms">Terms of Service</Link>
          &nbsp;and&nbsp;
          <Link to="/privacy">Privacy Policy</Link>
        </CWText>

        {copy.showExistingAccountSignInFooter && (
          <CWText isCentered>
            Already have an account?&nbsp;
            <button onClick={() => onSignInClick?.()}>Sign in</button>
          </CWText>
        )}
      </CWModalFooter>
    </section>
  );
};

export { ModalLayout };
