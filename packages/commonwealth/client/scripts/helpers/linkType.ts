const getLinkType = (link: string, defaultValueWhenValidLink = '') => {
  if (link.includes('discord.com') || link.includes('discord.gg'))
    return 'discord';
  if (link.includes('slack.com')) return 'slack';
  if (link.includes('telegram.com')) return 'telegram';
  if (link.includes('twitter.com')) return 'twitter';
  if (link.includes('github.com')) return 'github';
  if (/^https?:\/\/[^\s/$.?#].[^\s]*$/.test(link))
    return defaultValueWhenValidLink;
  return '';
};

export default getLinkType;
