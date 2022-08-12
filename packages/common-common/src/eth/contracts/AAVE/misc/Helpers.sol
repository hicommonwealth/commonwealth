// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.7.5;
pragma abicoder v2;

function getChainId() pure returns (uint256) {
  uint256 chainId;
  assembly {
    chainId := chainid()
  }
  return chainId;
}

function isContract(address account) view returns (bool) {
  // According to EIP-1052, 0x0 is the value returned for not-yet created accounts
  // and 0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470 is returned
  // for accounts without code, i.e. `keccak256('')`
  bytes32 codehash;
  bytes32 accountHash = 0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470;
  // solhint-disable-next-line no-inline-assembly
  assembly {
    codehash := extcodehash(account)
  }
  return (codehash != accountHash && codehash != 0x0);
}
