require("@nomiclabs/hardhat-ethers");
const { ethers } = require("hardhat");

async function deploy() {
    [owner] = await ethers.getSigners();

    let tokenFactory = await ethers.getContractFactory("DonationToken");
    let token = await tokenFactory.connect(owner).deploy();
    await token.deployed();
    console.log("DonationToken deployed to:", token.address);

    let proposalFactory = await ethers.getContractFactory("Proposal");
    let proposal = await proposalFactory.connect(owner).deploy();
    await proposal.deployed();
    console.log("Proposal contract deployed to:", proposal.address);

    let campaignFactory = await ethers.getContractFactory("Campaign");
    let campaign = await campaignFactory.connect(owner).deploy(token.address,proposal.address);
    await campaign.deployed();
    console.log("Campaign deployed to:", campaign.address);
}

deploy()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
