import * as _m0 from 'protobufjs/minimal';
import { Timestamp, TimestampSDKType } from '../../google/protobuf/timestamp';
import {
  Long,
  base64FromBytes,
  bytesFromBase64,
  fromJsonTimestamp,
  fromTimestamp,
  isSet,
} from '../../helpers';
export interface ProtocolVersion {
  p2p: Long;
  block: Long;
  app: Long;
}
export interface ProtocolVersionSDKType {
  p2p: Long;
  block: Long;
  app: Long;
}
export interface NodeInfo {
  protocolVersion?: ProtocolVersion;
  nodeId: string;
  listenAddr: string;
  network: string;
  version: string;
  channels: Uint8Array;
  moniker: string;
  other?: NodeInfoOther;
}
export interface NodeInfoSDKType {
  protocol_version?: ProtocolVersionSDKType;
  node_id: string;
  listen_addr: string;
  network: string;
  version: string;
  channels: Uint8Array;
  moniker: string;
  other?: NodeInfoOtherSDKType;
}
export interface NodeInfoOther {
  txIndex: string;
  rpcAddress: string;
}
export interface NodeInfoOtherSDKType {
  tx_index: string;
  rpc_address: string;
}
export interface PeerInfo {
  id: string;
  addressInfo: PeerAddressInfo[];
  lastConnected?: Timestamp;
}
export interface PeerInfoSDKType {
  id: string;
  address_info: PeerAddressInfoSDKType[];
  last_connected?: TimestampSDKType;
}
export interface PeerAddressInfo {
  address: string;
  lastDialSuccess?: Timestamp;
  lastDialFailure?: Timestamp;
  dialFailures: number;
}
export interface PeerAddressInfoSDKType {
  address: string;
  last_dial_success?: TimestampSDKType;
  last_dial_failure?: TimestampSDKType;
  dial_failures: number;
}

function createBaseProtocolVersion(): ProtocolVersion {
  return {
    p2p: Long.UZERO,
    block: Long.UZERO,
    app: Long.UZERO,
  };
}

export const ProtocolVersion = {
  encode(
    message: ProtocolVersion,
    writer: _m0.Writer = _m0.Writer.create(),
  ): _m0.Writer {
    if (!message.p2p.isZero()) {
      writer.uint32(8).uint64(message.p2p);
    }

    if (!message.block.isZero()) {
      writer.uint32(16).uint64(message.block);
    }

    if (!message.app.isZero()) {
      writer.uint32(24).uint64(message.app);
    }

    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ProtocolVersion {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseProtocolVersion();

    while (reader.pos < end) {
      const tag = reader.uint32();

      switch (tag >>> 3) {
        case 1:
          message.p2p = reader.uint64() as Long;
          break;

        case 2:
          message.block = reader.uint64() as Long;
          break;

        case 3:
          message.app = reader.uint64() as Long;
          break;

        default:
          reader.skipType(tag & 7);
          break;
      }
    }

    return message;
  },

  fromJSON(object: any): ProtocolVersion {
    return {
      p2p: isSet(object.p2p) ? Long.fromValue(object.p2p) : Long.UZERO,
      block: isSet(object.block) ? Long.fromValue(object.block) : Long.UZERO,
      app: isSet(object.app) ? Long.fromValue(object.app) : Long.UZERO,
    };
  },

  toJSON(message: ProtocolVersion): unknown {
    const obj: any = {};
    message.p2p !== undefined &&
      (obj.p2p = (message.p2p || Long.UZERO).toString());
    message.block !== undefined &&
      (obj.block = (message.block || Long.UZERO).toString());
    message.app !== undefined &&
      (obj.app = (message.app || Long.UZERO).toString());
    return obj;
  },

  fromPartial(object: Partial<ProtocolVersion>): ProtocolVersion {
    const message = createBaseProtocolVersion();
    message.p2p =
      object.p2p !== undefined && object.p2p !== null
        ? Long.fromValue(object.p2p)
        : Long.UZERO;
    message.block =
      object.block !== undefined && object.block !== null
        ? Long.fromValue(object.block)
        : Long.UZERO;
    message.app =
      object.app !== undefined && object.app !== null
        ? Long.fromValue(object.app)
        : Long.UZERO;
    return message;
  },

  fromSDK(object: ProtocolVersionSDKType): ProtocolVersion {
    return {
      p2p: isSet(object.p2p) ? object.p2p : undefined,
      block: isSet(object.block) ? object.block : undefined,
      app: isSet(object.app) ? object.app : undefined,
    };
  },
};

function createBaseNodeInfo(): NodeInfo {
  return {
    protocolVersion: undefined,
    nodeId: '',
    listenAddr: '',
    network: '',
    version: '',
    channels: new Uint8Array(),
    moniker: '',
    other: undefined,
  };
}

export const NodeInfo = {
  encode(
    message: NodeInfo,
    writer: _m0.Writer = _m0.Writer.create(),
  ): _m0.Writer {
    if (message.protocolVersion !== undefined) {
      ProtocolVersion.encode(
        message.protocolVersion,
        writer.uint32(10).fork(),
      ).ldelim();
    }

    if (message.nodeId !== '') {
      writer.uint32(18).string(message.nodeId);
    }

    if (message.listenAddr !== '') {
      writer.uint32(26).string(message.listenAddr);
    }

    if (message.network !== '') {
      writer.uint32(34).string(message.network);
    }

    if (message.version !== '') {
      writer.uint32(42).string(message.version);
    }

    if (message.channels.length !== 0) {
      writer.uint32(50).bytes(message.channels);
    }

    if (message.moniker !== '') {
      writer.uint32(58).string(message.moniker);
    }

    if (message.other !== undefined) {
      NodeInfoOther.encode(message.other, writer.uint32(66).fork()).ldelim();
    }

    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): NodeInfo {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseNodeInfo();

    while (reader.pos < end) {
      const tag = reader.uint32();

      switch (tag >>> 3) {
        case 1:
          message.protocolVersion = ProtocolVersion.decode(
            reader,
            reader.uint32(),
          );
          break;

        case 2:
          message.nodeId = reader.string();
          break;

        case 3:
          message.listenAddr = reader.string();
          break;

        case 4:
          message.network = reader.string();
          break;

        case 5:
          message.version = reader.string();
          break;

        case 6:
          message.channels = reader.bytes();
          break;

        case 7:
          message.moniker = reader.string();
          break;

        case 8:
          message.other = NodeInfoOther.decode(reader, reader.uint32());
          break;

        default:
          reader.skipType(tag & 7);
          break;
      }
    }

    return message;
  },

  fromJSON(object: any): NodeInfo {
    return {
      protocolVersion: isSet(object.protocolVersion)
        ? ProtocolVersion.fromJSON(object.protocolVersion)
        : undefined,
      nodeId: isSet(object.nodeId) ? String(object.nodeId) : '',
      listenAddr: isSet(object.listenAddr) ? String(object.listenAddr) : '',
      network: isSet(object.network) ? String(object.network) : '',
      version: isSet(object.version) ? String(object.version) : '',
      channels: isSet(object.channels)
        ? bytesFromBase64(object.channels)
        : new Uint8Array(),
      moniker: isSet(object.moniker) ? String(object.moniker) : '',
      other: isSet(object.other)
        ? NodeInfoOther.fromJSON(object.other)
        : undefined,
    };
  },

  toJSON(message: NodeInfo): unknown {
    const obj: any = {};
    message.protocolVersion !== undefined &&
      (obj.protocolVersion = message.protocolVersion
        ? ProtocolVersion.toJSON(message.protocolVersion)
        : undefined);
    message.nodeId !== undefined && (obj.nodeId = message.nodeId);
    message.listenAddr !== undefined && (obj.listenAddr = message.listenAddr);
    message.network !== undefined && (obj.network = message.network);
    message.version !== undefined && (obj.version = message.version);
    message.channels !== undefined &&
      (obj.channels = base64FromBytes(
        message.channels !== undefined ? message.channels : new Uint8Array(),
      ));
    message.moniker !== undefined && (obj.moniker = message.moniker);
    message.other !== undefined &&
      (obj.other = message.other
        ? NodeInfoOther.toJSON(message.other)
        : undefined);
    return obj;
  },

  fromPartial(object: Partial<NodeInfo>): NodeInfo {
    const message = createBaseNodeInfo();
    message.protocolVersion =
      object.protocolVersion !== undefined && object.protocolVersion !== null
        ? ProtocolVersion.fromPartial(object.protocolVersion)
        : undefined;
    message.nodeId = object.nodeId ?? '';
    message.listenAddr = object.listenAddr ?? '';
    message.network = object.network ?? '';
    message.version = object.version ?? '';
    message.channels = object.channels ?? new Uint8Array();
    message.moniker = object.moniker ?? '';
    message.other =
      object.other !== undefined && object.other !== null
        ? NodeInfoOther.fromPartial(object.other)
        : undefined;
    return message;
  },

  fromSDK(object: NodeInfoSDKType): NodeInfo {
    return {
      protocolVersion: isSet(object.protocol_version)
        ? ProtocolVersion.fromSDK(object.protocol_version)
        : undefined,
      nodeId: isSet(object.node_id) ? object.node_id : undefined,
      listenAddr: isSet(object.listen_addr) ? object.listen_addr : undefined,
      network: isSet(object.network) ? object.network : undefined,
      version: isSet(object.version) ? object.version : undefined,
      channels: isSet(object.channels) ? object.channels : undefined,
      moniker: isSet(object.moniker) ? object.moniker : undefined,
      other: isSet(object.other)
        ? NodeInfoOther.fromSDK(object.other)
        : undefined,
    };
  },
};

function createBaseNodeInfoOther(): NodeInfoOther {
  return {
    txIndex: '',
    rpcAddress: '',
  };
}

export const NodeInfoOther = {
  encode(
    message: NodeInfoOther,
    writer: _m0.Writer = _m0.Writer.create(),
  ): _m0.Writer {
    if (message.txIndex !== '') {
      writer.uint32(10).string(message.txIndex);
    }

    if (message.rpcAddress !== '') {
      writer.uint32(18).string(message.rpcAddress);
    }

    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): NodeInfoOther {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseNodeInfoOther();

    while (reader.pos < end) {
      const tag = reader.uint32();

      switch (tag >>> 3) {
        case 1:
          message.txIndex = reader.string();
          break;

        case 2:
          message.rpcAddress = reader.string();
          break;

        default:
          reader.skipType(tag & 7);
          break;
      }
    }

    return message;
  },

  fromJSON(object: any): NodeInfoOther {
    return {
      txIndex: isSet(object.txIndex) ? String(object.txIndex) : '',
      rpcAddress: isSet(object.rpcAddress) ? String(object.rpcAddress) : '',
    };
  },

  toJSON(message: NodeInfoOther): unknown {
    const obj: any = {};
    message.txIndex !== undefined && (obj.txIndex = message.txIndex);
    message.rpcAddress !== undefined && (obj.rpcAddress = message.rpcAddress);
    return obj;
  },

  fromPartial(object: Partial<NodeInfoOther>): NodeInfoOther {
    const message = createBaseNodeInfoOther();
    message.txIndex = object.txIndex ?? '';
    message.rpcAddress = object.rpcAddress ?? '';
    return message;
  },

  fromSDK(object: NodeInfoOtherSDKType): NodeInfoOther {
    return {
      txIndex: isSet(object.tx_index) ? object.tx_index : undefined,
      rpcAddress: isSet(object.rpc_address) ? object.rpc_address : undefined,
    };
  },
};

function createBasePeerInfo(): PeerInfo {
  return {
    id: '',
    addressInfo: [],
    lastConnected: undefined,
  };
}

export const PeerInfo = {
  encode(
    message: PeerInfo,
    writer: _m0.Writer = _m0.Writer.create(),
  ): _m0.Writer {
    if (message.id !== '') {
      writer.uint32(10).string(message.id);
    }

    for (const v of message.addressInfo) {
      PeerAddressInfo.encode(v!, writer.uint32(18).fork()).ldelim();
    }

    if (message.lastConnected !== undefined) {
      Timestamp.encode(
        message.lastConnected,
        writer.uint32(26).fork(),
      ).ldelim();
    }

    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): PeerInfo {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBasePeerInfo();

    while (reader.pos < end) {
      const tag = reader.uint32();

      switch (tag >>> 3) {
        case 1:
          message.id = reader.string();
          break;

        case 2:
          message.addressInfo.push(
            PeerAddressInfo.decode(reader, reader.uint32()),
          );
          break;

        case 3:
          message.lastConnected = Timestamp.decode(reader, reader.uint32());
          break;

        default:
          reader.skipType(tag & 7);
          break;
      }
    }

    return message;
  },

  fromJSON(object: any): PeerInfo {
    return {
      id: isSet(object.id) ? String(object.id) : '',
      addressInfo: Array.isArray(object?.addressInfo)
        ? object.addressInfo.map((e: any) => PeerAddressInfo.fromJSON(e))
        : [],
      lastConnected: isSet(object.lastConnected)
        ? fromJsonTimestamp(object.lastConnected)
        : undefined,
    };
  },

  toJSON(message: PeerInfo): unknown {
    const obj: any = {};
    message.id !== undefined && (obj.id = message.id);

    if (message.addressInfo) {
      obj.addressInfo = message.addressInfo.map((e) =>
        e ? PeerAddressInfo.toJSON(e) : undefined,
      );
    } else {
      obj.addressInfo = [];
    }

    message.lastConnected !== undefined &&
      (obj.lastConnected = fromTimestamp(message.lastConnected).toISOString());
    return obj;
  },

  fromPartial(object: Partial<PeerInfo>): PeerInfo {
    const message = createBasePeerInfo();
    message.id = object.id ?? '';
    message.addressInfo =
      object.addressInfo?.map((e) => PeerAddressInfo.fromPartial(e)) || [];
    message.lastConnected =
      object.lastConnected !== undefined && object.lastConnected !== null
        ? Timestamp.fromPartial(object.lastConnected)
        : undefined;
    return message;
  },

  fromSDK(object: PeerInfoSDKType): PeerInfo {
    return {
      id: isSet(object.id) ? object.id : undefined,
      addressInfo: Array.isArray(object?.address_info)
        ? object.address_info.map((e: any) => PeerAddressInfo.fromSDK(e))
        : [],
      lastConnected: isSet(object.last_connected)
        ? Timestamp.fromSDK(object.last_connected)
        : undefined,
    };
  },
};

function createBasePeerAddressInfo(): PeerAddressInfo {
  return {
    address: '',
    lastDialSuccess: undefined,
    lastDialFailure: undefined,
    dialFailures: 0,
  };
}

export const PeerAddressInfo = {
  encode(
    message: PeerAddressInfo,
    writer: _m0.Writer = _m0.Writer.create(),
  ): _m0.Writer {
    if (message.address !== '') {
      writer.uint32(10).string(message.address);
    }

    if (message.lastDialSuccess !== undefined) {
      Timestamp.encode(
        message.lastDialSuccess,
        writer.uint32(18).fork(),
      ).ldelim();
    }

    if (message.lastDialFailure !== undefined) {
      Timestamp.encode(
        message.lastDialFailure,
        writer.uint32(26).fork(),
      ).ldelim();
    }

    if (message.dialFailures !== 0) {
      writer.uint32(32).uint32(message.dialFailures);
    }

    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): PeerAddressInfo {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBasePeerAddressInfo();

    while (reader.pos < end) {
      const tag = reader.uint32();

      switch (tag >>> 3) {
        case 1:
          message.address = reader.string();
          break;

        case 2:
          message.lastDialSuccess = Timestamp.decode(reader, reader.uint32());
          break;

        case 3:
          message.lastDialFailure = Timestamp.decode(reader, reader.uint32());
          break;

        case 4:
          message.dialFailures = reader.uint32();
          break;

        default:
          reader.skipType(tag & 7);
          break;
      }
    }

    return message;
  },

  fromJSON(object: any): PeerAddressInfo {
    return {
      address: isSet(object.address) ? String(object.address) : '',
      lastDialSuccess: isSet(object.lastDialSuccess)
        ? fromJsonTimestamp(object.lastDialSuccess)
        : undefined,
      lastDialFailure: isSet(object.lastDialFailure)
        ? fromJsonTimestamp(object.lastDialFailure)
        : undefined,
      dialFailures: isSet(object.dialFailures)
        ? Number(object.dialFailures)
        : 0,
    };
  },

  toJSON(message: PeerAddressInfo): unknown {
    const obj: any = {};
    message.address !== undefined && (obj.address = message.address);
    message.lastDialSuccess !== undefined &&
      (obj.lastDialSuccess = fromTimestamp(
        message.lastDialSuccess,
      ).toISOString());
    message.lastDialFailure !== undefined &&
      (obj.lastDialFailure = fromTimestamp(
        message.lastDialFailure,
      ).toISOString());
    message.dialFailures !== undefined &&
      (obj.dialFailures = Math.round(message.dialFailures));
    return obj;
  },

  fromPartial(object: Partial<PeerAddressInfo>): PeerAddressInfo {
    const message = createBasePeerAddressInfo();
    message.address = object.address ?? '';
    message.lastDialSuccess =
      object.lastDialSuccess !== undefined && object.lastDialSuccess !== null
        ? Timestamp.fromPartial(object.lastDialSuccess)
        : undefined;
    message.lastDialFailure =
      object.lastDialFailure !== undefined && object.lastDialFailure !== null
        ? Timestamp.fromPartial(object.lastDialFailure)
        : undefined;
    message.dialFailures = object.dialFailures ?? 0;
    return message;
  },

  fromSDK(object: PeerAddressInfoSDKType): PeerAddressInfo {
    return {
      address: isSet(object.address) ? object.address : undefined,
      lastDialSuccess: isSet(object.last_dial_success)
        ? Timestamp.fromSDK(object.last_dial_success)
        : undefined,
      lastDialFailure: isSet(object.last_dial_failure)
        ? Timestamp.fromSDK(object.last_dial_failure)
        : undefined,
      dialFailures: isSet(object.dial_failures)
        ? object.dial_failures
        : undefined,
    };
  },
};
