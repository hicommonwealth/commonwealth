// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {DataTypes} from './DataTypes.sol';

interface IProjectFactory {
    event ProjectCreation(bytes32 projectHash, address project);

    function owner() external view returns (address);

    function getProtocolData() external view returns (DataTypes.ProtocolData memory);

    function setFeeTo(address payable _feeTo) external;

    function setProtocolFee(uint256 _protocolFee) external;

    function setCWTokenImpl(address _cwToken) external;

    function projectImp() external view returns (address);

    function setProjectImpl(address _projectImpl) external;

    function allProjects(uint256) external view returns (address);

    function getAllProjects() external view returns (address[] memory);

    function acceptedTokens(uint256) external view returns (address);

    function getAllAcceptedTokens() external view returns (address[] memory);

    function isAcceptedToken(address _token) external view returns (bool);

    function addAcceptedTokens(address[] memory _tokens) external;

    function createProject(
        bytes32 _name,
        bytes32 _ipfsHash,
        bytes32 _cwUrl,
        address payable _beneficiary,
        address[] memory _acceptedTokens,
        address[] memory _nominations,
        uint256 _threshold,
        uint256 _deadline,
        uint256 _curatorFee
    ) external returns (address project);
}