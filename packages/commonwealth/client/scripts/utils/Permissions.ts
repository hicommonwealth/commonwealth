import app from 'state';
import Account from '../models/Account';
import Thread from '../models/Thread';

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
        c.community_id === app.user.activeAccount?.community.id
      );
    }).length > 0
  );
};

const isThreadAuthor = (thread: Thread) => {
  return (
    app.user.activeAccount?.address === thread.author &&
    app.user.activeAccount?.community.id === thread.authorChain
  );
};

export default {
  isSiteAdmin,
  isCommunityAdmin,
  isCommunityModerator,
  isThreadCollaborator,
  isThreadAuthor,
};
