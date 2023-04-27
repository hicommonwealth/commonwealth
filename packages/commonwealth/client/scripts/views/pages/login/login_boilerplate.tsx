import React from 'react';

import 'pages/login/login_boilerplate.scss';

import { CWText } from 'views/components/component_kit/cw_text';
import { getClasses } from 'views/components/component_kit/helpers';
import { useCommonNavigate } from 'navigation/helpers';

type LoginBoilerplateProps = {
  darkMode?: boolean;
};

export const LoginBoilerplate = ({ darkMode }: LoginBoilerplateProps) => {
  const navigate = useCommonNavigate();

  return (
    <div
      className={getClasses<{ darkMode?: boolean }>(
        { darkMode },
        'LoginBoilerplate'
      )}
    >
      <CWText type="caption" className="boilerplate-text" isCentered>
        By connecting to Common, you agree to our{' '}
        <a className="link" onClick={() => navigate('/terms', {}, null)}>
          Terms of Service
        </a>{' '}
        and{' '}
        <a className="link" onClick={() => navigate('/privacy', {}, null)}>
          Privacy Policy
        </a>
      </CWText>
    </div>
  );
};
