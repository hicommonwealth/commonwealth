import app from 'state';
import Thread from '../models/Thread';

const isSiteAdmin = () => {
  return app.user.activeAccount && app.user.isSiteAdmin;
};

const isCommunityAdmin = () => {
  return (
    app.user.activeAccount &&
    app.roles.isRoleOfCommunity({
      role: 'admin',
      chain: app.activeChainId(),
    })
  );
};

const isCommunityModerator = () => {
  return (
    app.user.activeAccount &&
    app.roles.isRoleOfCommunity({
      role: 'moderator',
      chain: app.activeChainId(),
    })
  );
};

const isThreadCollaborator = (thread: Thread) => {
  return (
    thread.collaborators?.filter((c) => {
      return (
        c.address === app.user.activeAccount?.address &&
        c.chain === app.user.activeAccount?.chain.id
      );
    }).length > 0
  );
};

const isThreadAuthor = (thread: Thread) => {
  return (
    app.user.activeAccount?.address === thread.author &&
    app.user.activeAccount?.chain.id === thread.authorChain
  );
};

export default {
  isSiteAdmin,
  isCommunityAdmin,
  isCommunityModerator,
  isThreadCollaborator,
  isThreadAuthor,
};
