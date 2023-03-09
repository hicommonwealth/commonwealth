import React from 'react';

import 'pages/login/login_text.scss';

import { CWText } from 'views/components/component_kit/cw_text';
import {
  getClasses,
  isWindowExtraSmall,
} from 'views/components/component_kit/helpers';

type LoginTextProps = {
  bodyText: string;
  className?: string;
  headerText: string;
  isMobile?: boolean;
};

export const LoginText = ({
  bodyText,
  className,
  headerText,
  isMobile = false,
}: LoginTextProps) => {
  return (
    <div
      className={getClasses<{ className?: string }>({ className }, 'LoginText')}
    >
      <div className="header-container">
        <CWText
          type={
            isWindowExtraSmall(window.innerWidth)
              ? 'h3'
              : isMobile
              ? 'h2'
              : 'h4'
          }
          fontWeight="semiBold"
          isCentered={isMobile}
          className="header-text"
        >
          {headerText}
        </CWText>
      </div>
      <CWText
        type={isMobile ? 'h5' : 'b2'}
        isCentered={isMobile}
        className={getClasses<{ isMobile?: boolean }>(
          { isMobile },
          'body-text'
        )}
      >
        {bodyText}
      </CWText>
    </div>
  );
};
