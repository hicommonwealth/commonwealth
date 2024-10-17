import avatar1 from './../../assets/img/avatars/default-avatar1.png';
import avatar2 from './../../assets/img/avatars/default-avatar2.png';
import avatar3 from './../../assets/img/avatars/default-avatar3.png';
import avatar4 from './../../assets/img/avatars/default-avatar4.png';
import avatar5 from './../../assets/img/avatars/default-avatar5.png';
import avatar6 from './../../assets/img/avatars/default-avatar6.png';

const defaultAvatars: string[] = [
  avatar1,
  avatar2,
  avatar3,
  avatar4,
  avatar5,
  avatar6,
];

export const getRandomAvatar = (): string => {
  const randomIndex: number = Math.floor(Math.random() * defaultAvatars.length);
  return defaultAvatars[randomIndex];
};
