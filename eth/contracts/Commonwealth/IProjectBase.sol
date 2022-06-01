// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {DataTypes} from './DataTypes.sol';

interface IProjectBase {
    event Back(address sender, address token, uint256 amount);
    event Withdraw(address sender, address token, uint256 amount, bytes32 withdrawalType);
    event Succeeded(uint256 timestamp, uint256 amount);
    event Failed();

    ///////////////////////////////////////////
    // Getters - view functions
    //////////////////////////////////////////
    function metaData() external view returns (DataTypes.ProjectMetaData memory);

    function threshold() external view returns (uint256); // backing threshold in native token

    function deadline() external view returns (uint256); // deadline in blocktime

    function totalFunding() external view returns (uint256);

    function protocolFee() external view returns (uint256);

    function protocolFeeTo() external view returns (address);

    function acceptedToken() external view returns (address);

    function beneficiary() external view returns (address);

    function lockedWithdraw() external view returns (bool);

    function funded() external view returns (bool);

    ///////////////////////////////////////////
    // functions
    //////////////////////////////////////////

    function setName(bytes32 _name) external;

    function setIpfsHash(bytes32 _ipfsHash) external;

    function back(uint256 _amount) external returns (bool);

    function beneficiaryWithdraw() external returns (bool);

    function backersWithdraw() external returns (bool);
}
