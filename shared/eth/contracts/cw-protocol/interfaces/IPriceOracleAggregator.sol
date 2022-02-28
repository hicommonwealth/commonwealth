// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import './IOracle.sol';

interface IPriceOracleAggregator {
    event UpdateOracle(address token, IOracle oracle);

    function getPriceInUSD(address _token) external returns (uint256);

    function updateOracleForAsset(address _asset, IOracle _oracle) external;

    function viewPriceInUSD(address _token) external view returns (uint256);
}
