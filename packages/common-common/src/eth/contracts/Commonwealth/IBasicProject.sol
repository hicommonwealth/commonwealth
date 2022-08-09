// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import './DataTypes.sol';
import "./IProjectBase.sol";

interface IBasicProject is IProjectBase {
    function backers(address backer) external view returns (uint256);

    function initialize(
        DataTypes.ProjectMetaData memory _metaData,
        DataTypes.ProjectData memory _projectData,
        DataTypes.ProtocolData memory _protocolData
    ) external returns (bool);
}
