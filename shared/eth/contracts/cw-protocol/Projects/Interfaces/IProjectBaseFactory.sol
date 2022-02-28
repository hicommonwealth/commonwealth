// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '../../DataTypes.sol';

interface IProjectBaseFactory {
    event ProjectCreated(uint256 projectIndex, address newProject);

    function protocolData() external view returns (DataTypes.ProtocolData memory);

    function owner() external view returns (address);

    function projectImp() external view returns (address);

    function projects(uint32 projectIndex) external view returns (address);

    function isAcceptedToken(address token) external view returns (bool);

    function numProjects() external view returns (uint256);

    function addAcceptedTokens(address[] memory _tokens) external;

    function setFeeTo(address payable _feeTo) external;

    function setProtocolFee(uint256 _protocolFee) external;

    function setProjectImpl(address _projectImpl) external;
}
