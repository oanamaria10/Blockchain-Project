# Crowdfunding Blockchain Project

## Overview
This project is a **decentralized crowdfunding platform** built on Ethereum, leveraging smart contracts to enable transparent donations and fund distribution. Donors receive **NFTs (Donation Tokens)** as proof of their contributions and can use these tokens to vote on fund allocation proposals. The project is developed using **Solidity**, deployed with **Hardhat**, and interacts with **MetaMask** for transaction signing.

## Features
### 1. Smart Contracts
The project consists of three core smart contracts:
- **Campaign.sol**: Handles donation collection, target tracking, and fund distribution.
- **DonationToken.sol**: Implements an ERC721 token (NFT) for donors.
- **Proposal.sol**: Manages proposals for fund allocation and enables token-based voting.

### 2. Functionalities
#### ✅ Campaign Management
- Start and manage a crowdfunding campaign.
- Set a target funding amount.
- Track donations and campaign progress.
- Stop the campaign when the target is reached.
- Distribute funds based on the voted proposals.

#### 🎟️ Donation and Tokenization
- Users can **donate ETH** to the campaign.
- Donors receive **Donation NFTs** (ERC721 tokens) as proof of their contribution.
- Each NFT represents a **voting right** in the proposal process.

#### 🗳️ Voting Mechanism
- Users vote on proposals using their **NFTs**.
- Each NFT can be used **only once** to vote.
- Proposals with the most votes receive a proportion of the collected funds.

#### 💰 Fund Distribution
- The campaign owner **distributes the funds** according to the winning proposals.
- Beneficiaries **withdraw allocated funds** directly from the contract.

## Events
### Campaign.sol
- `DonationReceived(address donor, uint amount, uint tokenId)` - Emitted when a donation is made and an NFT is issued.
- `CampaignClosed()` - Emitted when the campaign stops.
- `FundsDistributed()` - Emitted when funds are allocated to proposals.
- `FundsWithdrawn(address beneficiary, uint amount)` - Emitted when a beneficiary withdraws funds.

### DonationToken.sol
- `TokenIssued(address owner, uint tokenId)` - Emitted when a new NFT is minted.

### Proposal.sol
- `VoteCast(address voter, uint proposalId)` - Emitted when a vote is cast.

## Deployment
### Prerequisites
Ensure you have **Node.js**, **Hardhat**, and **MetaMask** installed.

```sh
npm install --save-dev hardhat
npm install @nomiclabs/hardhat-ethers ethers
```

### Deploying on Hardhat Local Network
1. Start the local Hardhat node:
```sh
npx hardhat node
```
2. Deploy contracts:
```sh
npx hardhat run scripts/deploy.js --network localhost
```
3. Note the deployed contract addresses in the console.

## Connecting to MetaMask
1. Open **MetaMask** and select **Localhost 8545**.
2. Import an account using a private key from Hardhat (printed in the terminal when running `npx hardhat node`).
3. Use the connected wallet to **donate**, **vote**, and **withdraw funds**.

## Interacting with the Frontend
The **React frontend** (App.js) allows users to:
- Connect their **MetaMask wallet**.
- View campaign progress.
- **Donate ETH** and receive NFTs.
- **Vote on proposals** using NFTs.
- **Withdraw funds** if they are a beneficiary.

## Fulfilled Requirements
### **Requirement Checklist**
| Requirement | Status | Example |
|------------|--------|---------|
| Use of Solidity-specific data types (mappings, address) | ✅ | `mapping(address => uint) public donations;` |
| Event registration | ✅ | `event DonationReceived(address indexed donor, uint256 amount, uint tokenId);` |
| Use of modifiers | ✅ | `modifier onlyOwner() { require(msg.sender == owner, "Not the contract owner"); _; }` |
| Examples for all function types (`external`, `pure`, `view`, etc.) | ✅ | `function getTotalDonations() public view returns (uint256) { return totalDonations; }` |
| ETH transfer examples | ✅ | `payable(owner).transfer(amount);` |
| Illustration of smart contract interactions | ✅ | `proposalContract.vote(proposalId, tokenId);` |
| Deployment on local/test Ethereum network | ✅ | `let campaign = await campaignFactory.connect(owner).deploy(token.address, proposal.address, beneficiaries);` |
| Use of libraries | ✅ | OpenZeppelin to inherit the ERC721 NFT standard |
| Implementation of advanced OOP (Inheritance, Patterns like Withdrawal Pattern) | ✅ | In `Campaign.sol`, `withdrawFunds` follows the Withdrawal Pattern |
| Implementation of ERC standards | ✅ | `DonationToken.sol` implements `ERC721` |
| Use of decentralized storage platforms (IPFS) | ✅ | IPFS used for storing proposal descriptions |
| Use of Web3 library (`ethers.js`) | ✅ | `import { ethers } from 'ethers';` |
| Transaction initiation using Web3 libraries | ✅ | `const donationTx = await campaignContract.donate({ value: donationValue });` |
| Event handling (`Observer Pattern`) | ✅ | `campaignContract.on("DonationReceived", handleDonationReceived);` |
| Transaction state control (exception handling) | ✅ | `try { const voteTx = await proposalContract.vote(proposalId, tokenId); await voteTx.wait(); } catch (error) { console.error("Error during voting:", error); }` |





