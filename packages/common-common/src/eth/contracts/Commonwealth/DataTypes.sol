// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

////////////////////////////////////////////////////////////////////////////////////////////
/// @title DataTypes
////////////////////////////////////////////////////////////////////////////////////////////

// this order of variables optimizes gas by using the least amount of 32 byte storage spaces as possible
library DataTypes {
    struct ProjectMetaData {
        uint256 id;
        bytes32 name;
        bytes32 ipfsHash;
        bytes32 url;
        address creator;
    }

    struct ProtocolData {
        //    /// @notice The protocol fee percentage at time of project creation
        uint8 fee;
        //    // @notice The address to send the protocol fee to
        address feeTo;
        //    /// @notice address of the admin that can set the pauseGuardian address and unpause functions
        address admin;
        //    /// @notice address for the pauseGuardian
        address pauseGuardian;
    }

    struct ProjectData {
        //    /// @notice Minimum value for a project to be successful
        uint256 threshold;

        //    /// @notice Deadline by which project must meet funding threshold
        uint256 deadline; // uint24 max val = 6.9 years
        //    // @notice Address to which all funds will be withdrawn to if the project is funded
        address beneficiary;
        //    // @notice The only token this project accepts for funding
        address acceptedToken;
    }

    enum RewardsTokenType {
        TRANSFERABLE,
        PARTIAL_SOUL_BOUND,
        SOUL_BOUND
    }

    struct RewardsTokenData {
        string name;
        string description;
        bool isNonFungible;
        address projectAddress;
    }

}
