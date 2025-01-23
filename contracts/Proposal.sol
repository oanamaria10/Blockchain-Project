// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

contract Proposal {
    struct ProposalDetails {
        uint256 id;
        uint256 voteCount;
    }

    ProposalDetails[] public proposals; 
    
    mapping(address => bool) public hasVoted;

    function createProposal() external {
        uint256 proposalId = proposals.length + 1;
        proposals.push(ProposalDetails(proposalId, 0));
    }

    function vote(uint256 _proposalId) external payable {
        require(_proposalId > 0 && _proposalId <= proposals.length, "Invalid proposal ID");
        proposals[_proposalId - 1].voteCount += 1;  
    }

    function getProposals() external view returns (ProposalDetails[] memory) {
        return proposals;
    }

    function getProposalFunds(uint256 _proposalId) external view returns (uint256) {
        require(_proposalId > 0 && _proposalId <= proposals.length, "Invalid proposal ID");
        return proposals[_proposalId - 1].voteCount;
    }
}
