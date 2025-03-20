import { useEffect } from 'react';

import { useCommonNavigate } from '../navigation/helpers';
import useFarcasterStore from '../state/ui/farcaster';

const parsePath = (path: string) => {
  const pathParts = path.split('/').filter(Boolean);
  return '/' + pathParts.join('/');
};

// Farcaster frame V2 opens root URL, so we need to redirect to the relative path
// which will be the contest page URL (e.g. /dydx/contests/0x123...)
const useFarcasterFrameRedirect = () => {
  const { farcasterContext, redirected, setRedirected } = useFarcasterStore();
  const navigate = useCommonNavigate();

  useEffect(() => {
    const openEmbedUrl = async () => {
      console.log('farcasterContext', farcasterContext);
      if (
        farcasterContext?.location &&
        'embed' in farcasterContext.location &&
        !redirected
      ) {
        try {
          const fullUrl = farcasterContext.location.embed as string;
          const url = new URL(fullUrl);

          const relativePath = parsePath(url.pathname);

          if (relativePath.length > 0) {
            navigate(relativePath, {}, null);
            setRedirected(true);
          } else {
            console.error('No valid path segments found in URL:', fullUrl);
          }
        } catch (error) {
          console.error('Error parsing or navigating to URL :', error);
        }
      }
    };

    openEmbedUrl();
  }, [farcasterContext, navigate, redirected, setRedirected]);
};

export default useFarcasterFrameRedirect;
