require("@nomiclabs/hardhat-ethers");
const { ethers } = require("hardhat");

async function deploy() {
    [owner] = await ethers.getSigners();
    beneficiaries = [
        "0x976EA74026E726554dB657fA54763abd0C3a0aa9",
        "0x14dC79964da2C08b23698B3D3cc7Ca32193d9955",
        "0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f",
    ]
    let tokenFactory = await ethers.getContractFactory("DonationToken");
    let token = await tokenFactory.connect(owner).deploy();
    await token.deployed();
    console.log("DonationToken deployed to:", token.address);

    let proposalFactory = await ethers.getContractFactory("Proposal");
    let proposal = await proposalFactory.connect(owner).deploy(token.address); // 🔹 Transmitem corect adresa `DonationToken`
    await proposal.deployed();
    console.log("Proposal contract deployed to:", proposal.address);

    let campaignFactory = await ethers.getContractFactory("Campaign");
    let campaign = await campaignFactory.connect(owner).deploy(token.address, proposal.address, beneficiaries); // 🔹 Corectat ordinea parametrilor
    await campaign.deployed();
    console.log("Campaign deployed to:", campaign.address);
}

deploy()
    .then(() => process.exit(0))
    .catch(error => {
        console.error("Deployment failed:", error);
        process.exit(1);
    });
