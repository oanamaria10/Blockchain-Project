const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Proposal Smart Contract", function () {
    let Proposal, proposal, owner, voter1, voter2;
    
    beforeEach(async function () {
        [owner, voter1, voter2] = await ethers.getSigners();
        Proposal = await ethers.getContractFactory("Proposal");
        proposal = await Proposal.deploy();
        await proposal.deployed();
    });

    it("Should allow users to create proposals", async function () {
        await proposal.createProposal("Proposal 1", voter1.address);
        const proposalData = await proposal.getProposal(0);
        expect(proposalData.description).to.equal("Proposal 1");
    });

    it("Should allow NFT owners to vote", async function () {
        await proposal.createProposal("Proposal 2", voter1.address);
        await expect(
            proposal.connect(voter1).vote(0)
        ).to.emit(proposal, "VoteCast").withArgs(voter1.address, 0);
    });

    it("Should prevent double voting with the same NFT", async function () {
        await proposal.createProposal("Proposal 3", voter1.address);
        await proposal.connect(voter1).vote(0);
        await expect(
            proposal.connect(voter1).vote(0)
        ).to.be.revertedWith("You have already voted");
    });
});
