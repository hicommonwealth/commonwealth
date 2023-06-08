import { useEffect, useState } from 'react';
import app from 'state';
import NewProfilesController from '../../../../controllers/server/newProfiles';

const useAuthorName = () => {
  const [authorName, setAuthorName] = useState(
    app.chain.base === 'cosmos'
      ? 'Anonymous'
      : app.user.activeAccount?.profile?.name
  );

  useEffect(() => {
    NewProfilesController.Instance.isFetched.on('redraw', () => {
      setAuthorName(
        app.chain.base === 'cosmos'
          ? 'Anonymous'
          : app.user.activeAccount?.profile?.name
      );
    });
  }, []);

  return {
    authorName,
  };
};

export default useAuthorName;
