// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

////////////////////////////////////////////////////////////////////////////////////////////
/// @title DataTypes
////////////////////////////////////////////////////////////////////////////////////////////

// this order of variables optimizes gas by using the least amount of 32 byte storage spaces as possible
library DataTypes {
    struct ProjectMetaData {
        uint256 id;
        bytes32 name;
        bytes32 ipfsHash;
        bytes32 cwUrl;
        address creator;
    }

    struct ProtocolData {
        uint256 protocolFee;
        uint256 maxFee;
        address payable feeTo;
    }

    struct ProjectData {
        uint256 threshold;
        uint256 deadline;
        address payable beneficiary;
        address acceptedToken;
    }
}
