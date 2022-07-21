// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import './DataTypes.sol';

interface IProjectBaseFactory {
    event ProjectCreated(uint256 projectIndex, address projectAddress);
    event ProtocolFeeToChange(address oldAddr, address newAddr);
    event ProtocolFeeChange(uint8 oldFee, uint8 newFee);
    event ProjectImplChange(address oldAddr, address newAddr);
    event ProtocolTokenImplChange(address oldAddr, address newAddr);

    function protocolData() external view returns (DataTypes.ProtocolData memory);

    function owner() external view returns (address);

    function projectImp() external view returns (address);

    function projects(uint32 projectIndex) external view returns (address);

    function isAcceptedToken(address token) external view returns (bool);

    function numProjects() external view returns (uint32);

    function addAcceptedTokens(address[] memory _tokens) external;

    function setFeeTo(address _feeTo) external;

    function setProtocolFee(uint8 _protocolFee) external;

    function setProjectImpl(address _projectImpl) external;
}
