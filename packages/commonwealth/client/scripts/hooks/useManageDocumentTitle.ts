import { useEffect } from 'react';
import app from '../state';

const useManageDocumentTitle = (title: string, obj?: any, attr?: string) => {
  useEffect(() => {
    document.title = `${app.chain.meta.name} – ${title}`;
  }, [title]);

  useEffect(() => {
    if (obj && obj[attr]) {
      document.title = `${app.chain.meta.name} – ${obj[attr]}`;
    }
  }, [obj, attr]);
}

export default useManageDocumentTitle;
