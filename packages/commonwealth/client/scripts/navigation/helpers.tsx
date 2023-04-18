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

type CommonNavigateOptions = NavigateOptions & { deferChain?: boolean };

export const Navigate = ({ to }: NavigateWithParamsProps) => {
  const params = useParams();
  const navigateTo = typeof to === 'string' ? to : to(params);

  return <ReactNavigate to={navigateTo} />;
};

export const getScopePrefix = (prefix?: null | string) => {
  const activeChainIdPrefix = app.activeChainId() || '';
  const scope = app.isCustomDomain() ? '' : activeChainIdPrefix;

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

/**
 *  This hook should be used for navigate from functional components.
 */
export const useCommonNavigate = () => {
  const navigate = useNavigate();

  /**
   * @param url Path for navigation starting with "/" character
   * @param options Navigate Options from react-router
   * @param {null | string} prefix If not set, the prefix will be calculated based on the
   * "activeChainId" and "isCustomDomain", meaning that scope does not need to be passed to the "navigate" function.
   *
   *  To override prefix calculation, the string has to be passed.
   *  navigate("/discussion", {}, "dydx")
   *
   *  To navigate without prefix whatsoever, the null has to be passed.
   *  navigate("/privacy", {}, null)
   */
  return (url: To, options?: CommonNavigateOptions, prefix?: null | string) => {
    if (prefix && prefix.startsWith('/')) {
      console.warn('Prefix should not start with slash character!');
    }

    const scopePrefix = getScopePrefix(prefix);
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
