const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Campaign Smart Contract", function () {
    let Campaign, campaign, owner, donor1, donor2, beneficiary;
    
    beforeEach(async function () {
        [owner, donor1, donor2, beneficiary] = await ethers.getSigners();
        Campaign = await ethers.getContractFactory("Campaign");
        campaign = await Campaign.deploy();
        await campaign.deployed();
    });

    it("Should deploy and set the owner correctly", async function () {
        expect(await campaign.owner()).to.equal(owner.address);
    });

    it("Should allow donations and update totalDonations", async function () {
        const donationAmount = ethers.utils.parseEther("1");
        await campaign.connect(donor1).donate({ value: donationAmount });
        expect(await campaign.totalDonations()).to.equal(donationAmount);
    });

    it("Should prevent donations if campaign is inactive", async function () {
        await campaign.connect(owner).stopCampaign();
        await expect(
            campaign.connect(donor1).donate({ value: ethers.utils.parseEther("1") })
        ).to.be.revertedWith("Campaign is not active");
    });
});