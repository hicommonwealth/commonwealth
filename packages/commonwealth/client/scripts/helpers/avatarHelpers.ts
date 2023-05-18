import ChainInfo from '../models/ChainInfo';
import MinimumProfile from '../models/MinimumProfile';
import {
  CWAvatar,
  CWJdenticon,
} from '../views/components/component_kit/cw_avatar';
import { render } from './DEPRECATED_ReactRender';

export function getAvatarFromChainInfo(chainInfo: ChainInfo, size: number) {
  return chainInfo?.iconUrl
    ? render(CWAvatar, { avatarUrl: chainInfo.iconUrl, size })
    : render(CWJdenticon, { address: undefined, size });
}

export function getAvatarFromProfile(
  minimumProfile: MinimumProfile,
  size: number
) {
  return minimumProfile.avatarUrl
    ? render(CWAvatar, { avatarUrl: minimumProfile.avatarUrl, size })
    : render(CWJdenticon, { address: minimumProfile.id, size });
}
