import m from 'mithril';
import { isU8a, isHex } from '@polkadot/util';
import { checkAddress, decodeAddress, encodeAddress } from '@polkadot/util-crypto';

interface IAttrs {
  callback: (address?: string, error?: string) => any;
  options: object;
  currentPrefix?: number;
  autoReencode?: boolean;
}

interface IState {
  address?: string;
  error?: string;
}

const AddressInput: m.Component<IAttrs, IState> = {
  view: (vnode) => {
    return m('input[type="text"]', {
      ...vnode.attrs.options,
      oninput: async (e) => {
        vnode.state.address = null;
        const address = e.target.value;
        if (!vnode.attrs.currentPrefix) {
          // if no prefix passed, do not perform any checks
          // TODO: we can add checks for Cosmos/etc separately by adding a chain param
          vnode.attrs.callback(address);
          return;
        }
        if (isU8a(address) || isHex(address)) {
          vnode.state.error = 'address not in SS58 format';
          return;
        }

        // check if it is valid as an address
        let decodedAddress: Uint8Array;
        try {
          decodedAddress = decodeAddress(address);
        } catch (e) {
          vnode.state.error = 'failed to decode address';
          return;
        }

        // check if it is valid with the current prefix & reencode if needed
        const [valid, errorMsg] = checkAddress(address, vnode.attrs.currentPrefix);
        if (!valid) {
          if (vnode.attrs.autoReencode) {
            try {
              vnode.state.address = encodeAddress(decodedAddress, vnode.attrs.currentPrefix);
              vnode.state.error = null;
            } catch (e) {
              vnode.state.error = 'failed to reencode address';
            }
          } else {
            vnode.state.error = errorMsg || 'address check failed';
          }
        } else {
          vnode.state.address = address;
          vnode.state.error = null;
        }
        vnode.attrs.callback(vnode.state.address, vnode.state.error);
      },
    }, vnode.children);
  },
};

export default AddressInput;
