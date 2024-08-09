import { useEffect } from 'react';
import app from '../state';

const useManageDocumentTitle = (title: string, details?: string) => {
  useEffect(() => {
    const displayTitle = details || title;
    document.title = app?.chain?.meta?.name
      ? `${app?.chain?.meta?.name} - ${displayTitle}`
      : displayTitle;
  }, [details, title]);
};

export default useManageDocumentTitle;
