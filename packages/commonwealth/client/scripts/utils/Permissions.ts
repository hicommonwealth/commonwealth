import app from 'state';
import Thread from '../models/Thread';
import Account from '../models/Account';

const isSiteAdmin = () => {
  return app.user.activeAccount && app.user.isSiteAdmin;
};

const isCommunityAdmin = (account?: Account) => {
  return (
    app.user.activeAccount &&
    app.roles.isRoleOfCommunity({
      role: 'admin',
      chain: app.activeChainId(),
      ...(account && { account }),
    })
  );
};

const isCommunityModerator = (account?: Account) => {
  return (
    app.user.activeAccount &&
    app.roles.isRoleOfCommunity({
      role: 'moderator',
      chain: app.activeChainId(),
      ...(account && { account }),
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
