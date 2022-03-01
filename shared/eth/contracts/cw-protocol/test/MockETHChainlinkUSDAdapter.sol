// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '../interfaces/IOracle.sol';

contract MockETHChainlinkUSDAdapter is IOracle {
    function getPriceInUSD() external pure override returns (uint256 price) {
        return 200e8;
    }

    function viewPriceInUSD() external pure override returns (uint256 price) {
        return 200e8;
    }
}
