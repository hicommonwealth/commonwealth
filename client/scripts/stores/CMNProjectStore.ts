import IdStore from './IdStore';
import { CMNProjectMembers, CMNProjectProtocol } from '../models';

class CMNProjectStore extends IdStore<CMNProjectProtocol> {}
class CMNProjectMembersStore extends IdStore<CMNProjectMembers> {}

export {
  CMNProjectStore,
  CMNProjectMembersStore
};
