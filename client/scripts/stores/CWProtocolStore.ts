import IdStore from './IdStore';
import { CWProtocol, CWProtocolMembers } from '../models';

class CWProtocolStore extends IdStore<CWProtocol> {}

class CWProtocolMembersStore extends IdStore<CWProtocolMembers> {}

export {
  CWProtocolStore,
  CWProtocolMembersStore
};