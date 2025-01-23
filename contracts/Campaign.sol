// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

import "./DonationToken.sol";
import "./Proposal.sol";

contract Campaign {
    DonationToken public tokenContract;
    uint256 public nextTokenId = 1;
    uint256 public totalDonations;
    uint256 public targetAmount;
    address public owner;
    Proposal public proposalContract;

    constructor(address _tokenContract, address _proposalContract) {
        tokenContract = DonationToken(_tokenContract);
        owner = msg.sender;
        proposalContract = Proposal(_proposalContract);
        proposalContract.createProposal();
        proposalContract.createProposal();
        proposalContract.createProposal();
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can call this function");
        _;
    }

    function donate() external payable {
        require(msg.value > 0, "Donation amount must be greater than zero");
        totalDonations += msg.value;
        tokenContract.issueToken(nextTokenId, msg.value);
        nextTokenId += 1;
    }

    function buyToken(uint256 _tokenId) external payable {
        (uint256 id, uint256 amount, address donor) = tokenContract.viewToken(_tokenId);
        require(id != 0, "Token with this ID does not exist");
        require(msg.value >= amount, "Insufficient funds");

        tokenContract.transferToken(msg.sender, _tokenId);
        payable(donor).transfer(msg.value);
    }

    function viewDonationToken(uint256 _tokenId) external view returns (uint256, uint256, address) {
        return tokenContract.viewToken(_tokenId);
    }

    function viewAllDonationTokens() external view returns (DonationToken.DonationAsset[] memory) {
        return tokenContract.viewAllTokens();
    }

    function setTargetAmount(uint256 _targetAmount) external onlyOwner {
        targetAmount = _targetAmount;
    }

    function getDonationPercentages() external view returns (uint256[] memory percentages) {
        uint256 totalVotes = 0;
        for (uint256 i = 1; i <= 3; i++) {
            totalVotes += proposalContract.getProposalFunds(i);  // Sum of donations for all proposals
        }

        uint256[] memory _percentages = new uint256[](3);

        if (totalVotes == 0) {
            return _percentages;  // If no donations, return an array of 0s
        }

        // Calculate the percentage of donations for each proposal
        for (uint256 i = 1; i <= 3; i++) {
            _percentages[i - 1] = (proposalContract.getProposalFunds(i) * 100) / totalVotes;  // Calculate percentage
        }

        return _percentages;
    }
}
