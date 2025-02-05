const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DonationToken Smart Contract", function () {
    let DonationToken, donationToken, owner, donor1;
    
    beforeEach(async function () {
        [owner, donor1] = await ethers.getSigners();
        DonationToken = await ethers.getContractFactory("DonationToken");
        donationToken = await DonationToken.deploy();
        await donationToken.deployed();
    });

    it("Should mint tokens to donors", async function () {
        await donationToken.mint(donor1.address, 1);
        expect(await donationToken.balanceOf(donor1.address)).to.equal(1);
    });

    it("Should not allow an NFT to be used for multiple votes", async function () {
        await donationToken.mint(donor1.address, 1);
        await donationToken.markAsUsedForVoting(1);
        await expect(
            donationToken.markAsUsedForVoting(1)
        ).to.be.revertedWith("Token already used for voting");
    });
});