import { useCommonNavigate } from 'navigation/helpers';
import 'pages/login/login_boilerplate.scss';
import React from 'react';
import { Link } from 'react-router-dom';
import { CWText } from 'views/components/component_kit/cw_text';
import { getClasses } from 'views/components/component_kit/helpers';

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
        <Link className="link" to={'/terms'}>
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link className="link" to={'/privacy'}>
          Privacy Policy
        </Link>
      </CWText>
    </div>
  );
};
