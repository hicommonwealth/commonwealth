const inviteCommunityMessage = 'Join my Community on Common using my link!';
const inviteCommonMessage = 'Join me on Common using my link!';

export const generatePermalink = (
  isInsideCommunity: boolean,
  inviteLink: string,
) => {
  const message = isInsideCommunity
    ? inviteCommunityMessage
    : inviteCommonMessage;

  return `${message} \n${inviteLink}`;
};
