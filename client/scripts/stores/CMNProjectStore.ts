import IdStore from './IdStore';
import { CMNMembers, CMNProjectProtocol } from '../models';

class CMNProjectStore extends IdStore<CMNProjectProtocol> {}
class CMNMembersStore extends IdStore<CMNMembers> {}

export {
  CMNProjectStore,
  CMNMembersStore
};
