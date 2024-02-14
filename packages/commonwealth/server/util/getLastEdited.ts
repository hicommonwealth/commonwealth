import { CommentAttributes } from '@hicommonwealth/model';

export const getLastEdited = (post: CommentAttributes) => {
  let lastEdited;
  if (post.version_history && post.version_history?.length > 1) {
    try {
      const latestVersion = JSON.parse(post.version_history[0]);
      lastEdited = latestVersion ? latestVersion.timestamp : null;
    } catch (e) {
      console.log(e);
    }
  }
  return lastEdited;
};
