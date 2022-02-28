// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts-governance/proxy/Clones.sol';
import {DataTypes} from '../DataTypes.sol';
import "./Interfaces/IProjectBaseFactory.sol";


abstract contract ProjectBaseFactory {
    using DataTypes for DataTypes.ProtocolData;

    event ProjectCreated(uint256 projectIndex, address newProject);

    /// @notice metaData
    DataTypes.ProtocolData public protocolData;

    /// @notice owner to manage this projectFactory
    address public owner;

    /// @notice address to project contract to be cloned
    address public projectImp;

    /// @notice mapping of index to project address
    mapping(uint32 => address) public projects;

    /// @notice mapping if token is accepted by this protocol
    mapping(address => bool) public isAcceptedToken;

    /// @notice the number of projects this factory has created
    uint32 public numProjects;

    /// @notice modifier to allow only the owner to call a function
    modifier onlyOwner() {
        require(msg.sender == owner, 'Ownable: caller is not the owner');
        _;
    }

    /// @notice add accepted tokens
    function _addAcceptedTokens(address[] memory _tokens) internal {
        uint256 length = _tokens.length;

        require(length > 0, 'PJFAC: NO_ACCEPTED_TOKEN');

        for (uint256 i = 0; i < length; i++) {
            require(_tokens[i] != address(0), 'PJFAC: INVALID_ACCEPTED_TOKEN');

            if (!isAcceptedToken[_tokens[i]]) {
                isAcceptedToken[_tokens[i]] = true;
            }
        }
    }

    /// @notice add accepted Tokens
    function addAcceptedTokens(address[] memory _tokens) external onlyOwner {
        _addAcceptedTokens(_tokens);
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Protocol
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    // TODO: getProtocolData vs auto-generated protocolData()
    function getProtocolData() external view returns (DataTypes.ProtocolData memory) {
        return protocolData;
    }

    function setFeeTo(address payable _feeTo) external onlyOwner {
        require(_feeTo != address(0), 'PJFAC: INVALID_FEETO');
        protocolData.feeTo = _feeTo;
    }

    function setProtocolFee(uint256 _protocolFee) external onlyOwner {
        require(
            _protocolFee > 0 && _protocolFee <= protocolData.maxFee,
            'PJFAC: INVALID_PROTOCOL_FEE'
        );
        protocolData.protocolFee = _protocolFee;
    }

    function setProjectImpl(address _projectImpl) external onlyOwner {
        require(_projectImpl != address(0), 'PJFAC: INVALID_PROJECT_IMPL');
        projectImp = _projectImpl;
    }
}
