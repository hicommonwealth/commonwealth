import React from 'react';
import type { NavigateOptions, To } from 'react-router-dom';
import {
  Navigate as ReactNavigate,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom';
import app from 'state';

const PROD_URL = 'https://commonwealth.im';

type NavigateWithParamsProps = {
  to: string | ((params: Record<string, string | undefined>) => string);
};

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
  return (url: To, options?: NavigateOptions, prefix?: null | string) => {
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
  // eslint-disable-next-line react/display-name
  return (props) => {
    const location = useLocation();
    const navigate = useNavigate();
    const params = useParams();

    return <Component {...props} router={{ location, navigate, params }} />;
  };
};

interface NavigateToCommunityProps {
  navigate: (
    url: To,
    options?: NavigateOptions,
    prefix?: null | string,
  ) => void;
  path: string;
  chain: string;
}

// This helper wraps the logic to properly navigate to community depending
// on presence of custom domain vs common domain.
// In case of custom domain, other community is opened in new tab and
// current community is open without prefix.
// In case of common domain, both other and current community are opened
// in the same tab with proper prefix.
export const navigateToCommunity = ({
  navigate,
  path,
  chain,
}: NavigateToCommunityProps) => {
  const isExternalLink = chain !== app.customDomainId();

  // When we navigate to another chain, remove all listeners initialized from old chain.
  app.chainModuleReady.removeAllListeners();

  if (!app.isCustomDomain()) {
    navigate(path, {}, chain);
  } else {
    if (isExternalLink) {
      window.open(`${PROD_URL}/${chain}${path}`);
    } else {
      navigate(path);
    }
  }
};

export default withRouter;
