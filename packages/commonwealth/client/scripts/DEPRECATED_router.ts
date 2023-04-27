import { _DEPRECATED_getSearchParams } from 'mithrilInterop';

/**
  TODO THIS FILE IS DEPRECATED BUT NOT ALL FUNCTIONALITIES HAVE BEEN REWRITTEN TO THE REACT APPROACH
  SO THIS SHOULD STAY HERE TILL EVERYTHING WILL BE TRANSFERRED.
  TRANSFERRED CHUNKS ARE COMMENTED OUT.
  !!! IF YOU WANT TO ADD NEW ROUTE, CHECK "navigation/AppNavigator.tsx" !!!
**/

// TODO this function used to be in the app.ts but now
// should be incorporated in new react flow
const handleLoginRedirects = () => {
  const routeParam = _DEPRECATED_getSearchParams();
  if (
    routeParam['loggedin'] &&
    routeParam['loggedin'].toString() === 'true' &&
    routeParam['path'] &&
    !routeParam['path'].startsWith('/login')
  ) {
    // (we call toString() because m.route.param() returns booleans, even though the types don't reflect this)
    // handle param-based redirect after email login

    /* If we are creating a new account, then we alias to create a new mixpanel user
     else we identify to associate mixpanel events
    */
    if (
      _DEPRECATED_getSearchParams()['new'] &&
      _DEPRECATED_getSearchParams()['new'].toString() === 'true'
    ) {
      console.log('creating account');
    }

    // TODO setRoute outside of react router, might not work properly
    // setRoute(_DEPRECATED_getSearchParams['path'], {}, { replace: true });
  } else if (
    localStorage &&
    localStorage.getItem &&
    localStorage.getItem('githubPostAuthRedirect')
  ) {
    // handle localStorage-based redirect after Github login (callback must occur within 30 seconds)
    try {
      const postAuth = JSON.parse(
        localStorage.getItem('githubPostAuthRedirect')
      );
      if (postAuth.path && +new Date() - postAuth.timestamp < 30 * 1000) {
        // TODO setRoute outside of react router, might not work properly
        // setRoute(postAuth.path, {}, { replace: true });
      }
      localStorage.removeItem('githubPostAuthRedirect');
    } catch (e) {
      console.log('Error restoring path from localStorage');
    }
  } else if (
    localStorage &&
    localStorage.getItem &&
    localStorage.getItem('discordPostAuthRedirect')
  ) {
    try {
      const postAuth = JSON.parse(
        localStorage.getItem('discordPostAuthRedirect')
      );
      if (postAuth.path && +new Date() - postAuth.timestamp < 30 * 1000) {
        // TODO setRoute outside of react router, might not work properly
        // setRoute(postAuth.path, {}, { replace: true });
      }
      localStorage.removeItem('discordPostAuthRedirect');
    } catch (e) {
      console.log('Error restoring path from localStorage');
    }
  }
};

export { handleLoginRedirects };
