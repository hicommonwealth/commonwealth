// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

////////////////////////////////////////////////////////////////////////////////////////////
/// @title DataTypes
////////////////////////////////////////////////////////////////////////////////////////////

// this order of variables optimizes gas by using the least amount of 32 byte storage spaces as possible
library DataTypes {
    struct MetaData {
        uint256 id;
        bytes32 name;
        bytes32 ipfsHash;
        bytes32 cwUrl;
        address creator;
    }

    struct ProtocolData {
        uint256 protocolFee;
        uint256 maxFee;
        address cwTokenImp;
        address payable feeTo;
    }
}