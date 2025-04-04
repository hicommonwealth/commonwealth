const inviteCommunityMessage = 'Join my Community on Common using my link!';
const inviteCommonMessage = 'Join me on Common using my link!';

export const generateTextAndLink = (
  isInsideCommunity: boolean,
  inviteLink: string,
) => {
  const text = isInsideCommunity ? inviteCommunityMessage : inviteCommonMessage;

  return { text, link: inviteLink };
};
