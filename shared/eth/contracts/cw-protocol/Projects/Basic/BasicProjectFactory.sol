// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts-governance/proxy/Clones.sol';
import {DataTypes} from '../../DataTypes.sol';
import "../ProjectBaseFactory.sol";
import '../Interfaces/IBasicProject.sol';
import "../Interfaces/IBasicProjectFactory.sol";

contract BasicProjectFactory is ProjectBaseFactory {
    using Clones for address;

    constructor(
        address _owner,
        address[] memory _acceptedTokens,
        uint256 _protocolFee,
        address payable _feeTo,
        address _projectImp
    ) {
        require(_owner != address(0), 'PJFAC: INVALID_OWNER');
        require(_protocolFee > 0 && _protocolFee <= 10000, 'PJFAC: INVALID_FEE');
        require(_feeTo != address(0), 'PJFAC: INVALID_FEETO');
        require(_projectImp != address(0), 'PJFAC: INVALID_PROJECT_ADDR');

        owner = _owner;
        projectImp = _projectImp;
        // TODO: maxFee currently set to 10% --- I don't think we should remove this
        // TODO: maxFee is the ONLY thing that stops us from making all of the projects honey pots
        protocolData = DataTypes.ProtocolData(_protocolFee, 10000, _feeTo);

        _addAcceptedTokens(_acceptedTokens);
    }

    /// @notice create new project
    function createProject(
        bytes32 _name,
        bytes32 _ipfsHash,
        bytes32 _cwUrl,
        address payable _beneficiary,
        address _acceptedToken,
        uint256 _threshold,
        uint256 _deadline
    ) external returns (address newProject) {
        require(_beneficiary != address(0), 'PJFAC: INVALID_BENEFICIARY');
        require(_threshold != 0, 'PJFAC: INVALID_THRESHOLD');
        require(_deadline > 0, 'PJFAC: INVALID_DEADLINE');
        require(isAcceptedToken[_acceptedToken], 'PJFAC: NOT_PROTOCOL_ACCEPTED_TOKEN');

        // a unique project hash is required to generate the clone contract address
        // msg.sender varies by user, deadline varies over time, and ipfsHash + name vary by project
        bytes32 pHash = keccak256(abi.encodePacked(msg.sender, _deadline, _ipfsHash, _name));
        newProject = projectImp.cloneDeterministic(pHash);

        DataTypes.ProjectMetaData memory metaData = DataTypes.ProjectMetaData(
            numProjects + 1, // id
            _name,
            _ipfsHash,
            _cwUrl,
            msg.sender // creator
        );

        IBasicProject(newProject).initialize(
            metaData,
            _threshold,
            _deadline,
            protocolData.protocolFee,
            protocolData.feeTo,
            _acceptedToken,
            _beneficiary
        );

        numProjects += 1;
        projects[numProjects] = newProject;

        emit ProjectCreated(numProjects, newProject);
    }
}
