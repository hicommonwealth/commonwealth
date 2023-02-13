import React from 'react';
import type { To, NavigateOptions } from 'react-router-dom';
import {
  useParams,
  useNavigate,
  useLocation,
  Navigate as ReactNavigate,
} from 'react-router-dom';
import app from 'state';

type NavigateWithParamsProps = {
  to: string | ((params: Record<string, string | undefined>) => string);
};

export const Navigate = ({ to }: NavigateWithParamsProps) => {
  const params = useParams();
  const navigateTo = typeof to === 'string' ? to : to(params);

  return <ReactNavigate to={navigateTo} />;
};

const getScopePrefix = (scope: string, prefix?: null | string) => {
  if (prefix === null) {
    return '';
  }

  if (typeof prefix === 'string') {
    return `/${prefix}`;
  }

  if (scope) {
    return `/${scope}`;
  }

  return '';
};

export const useCommonNavigate = () => {
  const navigate = useNavigate();

  return (url: To, options?: NavigateOptions, prefix?: null | string) => {
    if (prefix && prefix.startsWith('/')) {
      console.warn('Prefix should not start with slash character!');
    }

    const activeChainIdPrefix = app.activeChainId() || '';
    const scope = app.isCustomDomain() ? '' : activeChainIdPrefix;
    const scopePrefix = getScopePrefix(scope, prefix);

    return navigate(`${scopePrefix}${url}`, options);
  };
};

// This helper should be used as a wrapper to Class Components
// to access react-router functionalities
const withRouter = (Component) => {
  return (props) => {
    const location = useLocation();
    const navigate = useNavigate();
    const params = useParams();

    return <Component {...props} router={{ location, navigate, params }} />;
  };
};

export default withRouter;
