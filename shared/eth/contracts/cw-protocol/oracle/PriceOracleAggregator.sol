// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts-governance/token/ERC20/IERC20.sol';
import '../interfaces/IPriceOracleAggregator.sol';
import '../interfaces/IOracle.sol';

////////////////////////////////////////////////////////////////////////////////////////////
/// @title ChainlinkUSDAdapter
/// @author @ace-contributor
/// @notice aggregator that manage usd dapters of oracle assets
////////////////////////////////////////////////////////////////////////////////////////////

contract PriceOracleAggregator is IPriceOracleAggregator {
    /// @dev admin allowed to update price oracle
    address public immutable admin;

    /// @notice token to the oracle address
    mapping(address => IOracle) public assetToOracle;

    modifier onlyAdmin() {
        require(msg.sender == admin, 'ONLY_ADMIN');
        _;
    }

    constructor(address _admin) {
        require(_admin != address(0), 'INVALID_ADMIN');
        admin = _admin;
    }

    /// @notice adds oracle for an asset e.g. ETH
    /// @param _asset the oracle for the asset
    /// @param _oracle the oracle address
    function updateOracleForAsset(address _asset, IOracle _oracle) external override onlyAdmin {
        require(address(_oracle) != address(0), 'INVALID_ORACLE');
        assetToOracle[_asset] = _oracle;
        emit UpdateOracle(_asset, _oracle);
    }

    /// @notice returns price of token in USD in 1e8 decimals
    /// @param _token token to fetch price
    function getPriceInUSD(address _token) external override returns (uint256) {
        require(address(assetToOracle[_token]) != address(0), 'INVALID_ORACLE');
        return assetToOracle[_token].getPriceInUSD();
    }

    /// @notice returns price of token in USD
    /// @param _token view price of token
    function viewPriceInUSD(address _token) external view override returns (uint256) {
        require(address(assetToOracle[_token]) != address(0), 'INVALID_ORACLE');
        return assetToOracle[_token].viewPriceInUSD();
    }
}
