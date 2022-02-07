// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {DataTypes} from './DataTypes.sol';

interface IProject {
    event Deposit(address sender, address token, uint256 amount);
    event Curate(address sender, address token, uint256 amount);
    event Withdraw(address sender, uint256 amount);
    event Succeeded();
    event Failed();

    function lockedWithdraw() external view returns (bool);

    function funded() external view returns (bool);

    function totalFunding() external view returns (uint256);

    function threshold() external view returns (uint256); // backing threshold in native token

    function deadline() external view returns (uint256); // deadline in blocktime

    function curatorFee() external view returns (uint256);

    function getBToken(address _token) external view returns (address);

    function getCToken(address _token) external view returns (address);

    function getAcceptedTokens() external view returns (address[] memory);

    function initialize(
        DataTypes.MetaData memory _metaData,
        address[] memory _acceptedTokens,
        address[] memory _nominations,
        uint256 _threshold,
        uint256 _deadline,
        uint256 _curatorFee
    ) external returns (bool);

    function backWithETH() external payable returns (bool);

    function back(address _token, uint256 _value) external returns (bool);

    function curateWithETH() external payable returns (bool);

    function curate(address _token, uint256 _value) external returns (bool);

    function withdraw() external returns (bool);

    function redeemBToken(address _token, uint256 _valueToRemove) external returns (bool);

    function redeemCToken(address _token, uint256 _valueToRemove) external returns (bool);
}