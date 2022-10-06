// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import {DataTypes} from './DataTypes.sol';

interface IProjectBase {
    event Back(address indexed sender, address indexed token, uint256 amount);
    event Withdraw(address indexed sender, address indexed token, uint256 amount, bytes32 withdrawalType);
    event Succeeded(uint256 timestamp, uint256 amount);
    event Failed();
    event ProjectDataChange(bytes32 name, bytes32 oldData, bytes32 newData);

    ///////////////////////////////////////////
    // Getters - view functions
    //////////////////////////////////////////
    function metaData() external view returns (DataTypes.ProjectMetaData memory);

    function projectData() external view returns (DataTypes.ProjectData memory);

    function protocolData() external view returns (DataTypes.ProtocolData memory);

    function totalFunding() external view returns (uint256);

    function lockedWithdraw() external view returns (bool);

    function funded() external view returns (bool);

    ///////////////////////////////////////////
    // functions
    //////////////////////////////////////////

    function setName(bytes32 _name) external;

    function setIpfsHash(bytes32 _ipfsHash) external;

    function setUrl(bytes32 _url) external;

    function back(uint256 _amount) external returns (bool);

    function beneficiaryWithdraw() external returns (bool);

    function backersWithdraw() external returns (bool);
}
