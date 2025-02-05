// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

import "./DonationToken.sol";

contract Proposal {
    struct ProposalDetails {
        uint256 id;
        uint256 voteCount;
        address beneficiary;
    }

    ProposalDetails[] public proposals;
    DonationToken public donationToken;
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    modifier proposalExists(uint256 _proposalId) {
        require(_proposalId >= 0 && _proposalId < proposals.length, "Invalid proposal ID");
        _;
    }

    constructor(address _donationToken) {
        require(_donationToken != address(0), "Invalid donation token address");
        donationToken = DonationToken(_donationToken);
    }

    event VoteCast(address indexed voter, uint256 proposalId);

    function createProposal(address _beneficiary) external {
        uint256 proposalId = proposals.length;
        proposals.push(ProposalDetails(proposalId, 0, _beneficiary));
    }

    function vote(uint256 _proposalId, uint256 _tokenId) external proposalExists(_proposalId) {
        require(donationToken.ownerOf(_tokenId) == msg.sender, "Not your token");
        require(!hasVoted[_proposalId][msg.sender], "You have already voted on this proposal");
        require(!donationToken.hasVoted(_tokenId), "Token already used for voting");

        hasVoted[_proposalId][msg.sender] = true; 
        donationToken.setUsedForVoting(_tokenId);
        donationToken.burn(msg.sender, _tokenId); 

        proposals[_proposalId].voteCount++;

        emit VoteCast(msg.sender, _proposalId);
    }
    
    function getProposals() external view returns (ProposalDetails[] memory) {
        return proposals;
    }
    function getProposalVotes(uint256 _proposalId) external view proposalExists(_proposalId) returns (uint256) {
        return proposals[_proposalId].voteCount;
    }

    function getTotalVotes() public view returns (uint256 total) {
        for (uint256 i = 0; i < proposals.length; i++) {
            total += proposals[i].voteCount;
        }
    }

    function getProposalPercentage(uint256 _proposalId) external view proposalExists(_proposalId) returns (uint256) {
        uint256 totalVotes = getTotalVotes();
        return (totalVotes == 0) ? 0 : (proposals[_proposalId].voteCount * 100) / totalVotes;
    }

    function getProposalBeneficiary(uint256 _proposalId) external view proposalExists(_proposalId) returns (address) {
        return proposals[_proposalId].beneficiary;
    }

    function getProposalCount() external view returns (uint256) {
        return proposals.length;
    }
    function getProposalFunds(uint256 _proposalId) external view proposalExists(_proposalId) returns (uint256)  {
        return proposals[_proposalId].voteCount;
    }

}
