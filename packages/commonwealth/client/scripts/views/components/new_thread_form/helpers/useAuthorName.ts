import { useEffect, useState } from 'react';
import app from 'state';

const useAuthorName = () => {
  const [authorName, setAuthorName] = useState(
    app.user.activeAccount?.profile?.name
  );

  useEffect(() => {
    app.profiles.isFetched.on('redraw', () => {
      setAuthorName(app.user.activeAccount?.profile?.name);
    });
  }, []);

  return {
    authorName,
  };
};

export default useAuthorName;
