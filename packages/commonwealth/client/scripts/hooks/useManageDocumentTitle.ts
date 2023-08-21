import { useEffect } from 'react';

const useManageDocumentTitle = (title: string) => {
  useEffect(() => {
    document.title = title;
  }, [title]);
}

export default useManageDocumentTitle;
