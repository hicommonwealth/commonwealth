// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts-governance/proxy/Clones.sol';
import {DataTypes} from '../../DataTypes.sol';
import "../Interfaces/IProjectFactory.sol";
import "../Interfaces/IProject.sol";
import "../ProjectBaseFactory.sol";
import "../../CWToken.sol";


contract ProjectFactory is ProjectBaseFactory {
    using Clones for address;

    address public cwTokenImp;

    constructor(
        address _owner,
        address[] memory _acceptedTokens,
        uint256 _protocolFee,
        address payable _feeTo,
        address _projectImp,
        address _cwTokenImp
    ) {
        require(_owner != address(0), 'PJFAC: INVALID_OWNER');
        require(_protocolFee > 0 && _protocolFee <= 10000, 'PJFAC: INVALID_FEE');
        require(_feeTo != address(0), 'PJFAC: INVALID_FEETO');
        require(_projectImp != address(0), 'PJFAC: INVALID_PROJECT_ADDR');
        require(_cwTokenImp != address(0), 'PJFAC: INVALID_CWTOKEN_ADDR');

        owner = _owner;
        projectImp = _projectImp;
        cwTokenImp = _cwTokenImp;
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
        uint256 _deadline,
        uint256 _curatorFee
    ) external returns (address newProjectAddress) {
        require(_beneficiary != address(0), 'PJFAC: INVALID_BENEFICIARY');
        require(_threshold != 0, 'PJFAC: INVALID_THRESHOLD');
        require(_deadline > 0, 'PJFAC: INVALID_DEADLINE'); // deadline should be time into future not time in future
        require(isAcceptedToken[_acceptedToken], 'PJFAC: NOT_PROTOCOL_ACCEPTED_TOKEN');
        require(_curatorFee != 0, 'PJFAC: INVALID_CURATOR_FEE');
        // ensures that the protocol fee can ALWAYS be paid
        require(_curatorFee + protocolData.protocolFee < 10000, 'CURATOR FEE TOO HIGH');

        DataTypes.ProjectData memory pData = DataTypes.ProjectData(
            _threshold,
            _deadline,
            _beneficiary,
            _acceptedToken
        );

        DataTypes.ProjectMetaData memory metaData = DataTypes.ProjectMetaData(
            numProjects + 1, // id
            _name,
            _ipfsHash,
            _cwUrl,
            msg.sender // creator
        );

        // calc projrectHash
        bytes32 pHash = keccak256(abi.encodePacked(msg.sender, _deadline, _ipfsHash, _name));
        newProjectAddress = projectImp.cloneDeterministic(pHash);

        // setup bToken
        address bToken = cwTokenImp.cloneDeterministic(
            keccak256(
                abi.encodePacked(
                    metaData.name,
                    metaData.ipfsHash,
                    metaData.cwUrl,
                    'BToken',
                    _acceptedToken
                )
            )
        );
        CWToken(bToken).initialize(_acceptedToken, true, newProjectAddress);

        // setup cToken
        address cToken = cwTokenImp.cloneDeterministic(
            keccak256(
                abi.encodePacked(
                    metaData.name,
                    metaData.ipfsHash,
                    metaData.cwUrl,
                    'CToken',
                    _acceptedToken
                )
            )
        );
        CWToken(cToken).initialize(_acceptedToken, true, newProjectAddress);

        // initialize the new project
        IProject(newProjectAddress).initialize(
            metaData,
            pData,
            _curatorFee,
            protocolData.protocolFee,
            protocolData.feeTo,
            bToken,
            cToken
        );

        numProjects += 1;
        projects[numProjects] = newProjectAddress;

        emit ProjectCreated(numProjects, newProjectAddress);

        return newProjectAddress;
    }

    function setCWTokenImpl(address _cwToken) external onlyOwner {
        require(_cwToken != address(0), 'PJFAC: INVALID_CWToken_IMPL');
        cwTokenImp = _cwToken;
    }
}
