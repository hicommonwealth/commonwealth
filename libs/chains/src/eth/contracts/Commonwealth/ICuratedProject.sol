// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "./IProjectBase.sol";

interface ICuratedProject is IProjectBase {
    event Curate(address indexed sender, address indexed token, uint256 amount);

    function bToken() external view returns (address);

    function cToken() external view returns (address);

    function totalCuratorFunding() external view returns (uint256);

    function curatorFee() external view returns (uint256);

    function initialize(
        DataTypes.ProjectMetaData memory _metaData,
        DataTypes.ProjectData memory _projectData,
        DataTypes.ProtocolData memory _protocolData,
        uint8 _curatorFee,
        address _bToken,
        address _cToken
    ) external returns (bool);

    function curate(uint256 _amount) external returns (bool);

    function curatorsWithdraw() external returns (bool);

    function withdrawRemaining() external view returns (uint256);
}
