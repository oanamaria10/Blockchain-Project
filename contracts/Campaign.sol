// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

import "./DonationToken.sol";
import "./Proposal.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Campaign is ReentrancyGuard {
    DonationToken public tokenContract;
    Proposal public proposalContract;
    address public owner;
    uint256 public totalDonations;
    uint256 public targetAmount;
    bool public isActive = true;
    bool public fundsDistributed = false;

    mapping(address => uint256) public pendingWithdrawals;

    event DonationReceived(address indexed donor, uint256 amount, uint256 tokenId);
    event CampaignClosed();
    event FundsDistributed();
    event FundsWithdrawn(address indexed beneficiary, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can call this function");
        _;
    }

    modifier campaignActive() {
        require(isActive, "Campaign is not active");
        _;
    }

    constructor(address _tokenContract, address _proposalContract, address[] memory _beneficiaries) {
        require(_tokenContract != address(0), "Invalid token contract address");
        require(_proposalContract != address(0), "Invalid proposal contract address");
        require(_beneficiaries.length == 3, "Must provide exactly 3 beneficiaries");
        
        tokenContract = DonationToken(_tokenContract);
        proposalContract = Proposal(_proposalContract);
        owner = msg.sender;

        proposalContract.createProposal(_beneficiaries[0]);
        proposalContract.createProposal(_beneficiaries[1]);
        proposalContract.createProposal(_beneficiaries[2]);
    }
    function getDonationForToken(uint256 tokenId) external view returns (uint256) {
        return tokenContract.getDonationAmount(tokenId);
    }
    function getTokensByOwner(address _owner) external view returns (uint256[] memory) {
        return tokenContract.getTokensByOwner(_owner);
    }
    function isBeneficiary(address beneficiary) public view returns (bool) {
        for (uint256 i = 0; i < proposalContract.getProposalCount(); i++) {
            if (proposalContract.getProposalBeneficiary(i) == beneficiary) {
                return true;
            }
        }
        return false;
    }
    function isFundsDistributed() external view returns (bool) {
        return fundsDistributed;
    }
    function setTargetAmount(uint256 _newTarget) external onlyOwner {
        require(_newTarget > 0, "Target must be greater than zero");
        require(_newTarget > totalDonations, "New target must be greater than donations");
        targetAmount = _newTarget;
    }
    function getTargetAmount() external view returns (uint256) {
        return targetAmount;
    }
    function getTotalDonations() external view returns (uint256) {
        return totalDonations;
    }

    function donate() external payable campaignActive {
        require(msg.value > 0, "Donation amount must be greater than zero");
        totalDonations += msg.value;
        uint256 tokenId = tokenContract.issueToken(msg.sender, msg.value);
        emit DonationReceived(msg.sender, msg.value, tokenId);
    }
    function isCampaignActive() external view returns (bool) {
        return isActive;
    }
    function stopCampaign() external onlyOwner {
        require(totalDonations >= targetAmount, "Target amount not reached yet");
        isActive = false;
        emit CampaignClosed();
    }

    function distributeFunds() external onlyOwner nonReentrant {
        require(!isActive, "Campaign must be stopped before distributing funds");
        require(!fundsDistributed, "Funds have already been distributed");

        uint256 totalVotes = proposalContract.getTotalVotes();
        require(totalVotes > 0, "No valid votes cast");

        for (uint256 i = 0; i < proposalContract.getProposalCount(); i++) {
            uint256 percentage = proposalContract.getProposalPercentage(i);
            uint256 amountToSend = (totalDonations * percentage) / 100;
            address beneficiary = proposalContract.getProposalBeneficiary(i);
            pendingWithdrawals[beneficiary] += amountToSend;
        }

        fundsDistributed = true;
        emit FundsDistributed();
    }

     function withdrawFunds() external nonReentrant {
        require(fundsDistributed, "Funds have not been distributed"); 
        require(isBeneficiary(msg.sender), "You are not a beneficiary");

        uint256 amount = pendingWithdrawals[msg.sender];
        require(amount > 0, "No funds to withdraw");
        require(address(this).balance >= amount, "Insufficient contract balance");

        pendingWithdrawals[msg.sender] = 0;

        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Withdrawal failed");

        emit FundsWithdrawn(msg.sender, amount);
    }

    function getDonationPercentages() external view returns (uint256[] memory percentages) {
        uint256 totalVotes = proposalContract.getTotalVotes();

        uint256[] memory _percentages = new uint256[](3);

        if (totalVotes == 0) {
            return _percentages;  // If no donations, return an array of 0s
        }

        // Calculate the percentage of donations for each proposal
        for (uint256 i = 0; i < 3; i++) {
            _percentages[i] = proposalContract.getProposalPercentage(i);  // Calculate percentage
        }

        return _percentages;
    }

}
