import { useEffect } from 'react';
import app from '../state';

const useManageDocumentTitle = (title: string, obj?: any, attr?: string) => {
  useEffect(() => {
    if (obj) {
      document.title = `${app.chain.meta.name} – ${obj[attr]}`;
    } else {
      document.title = `${app.chain.meta.name} – ${title}`;
    }
  }, [obj ? obj : null]);
}

export default useManageDocumentTitle;
