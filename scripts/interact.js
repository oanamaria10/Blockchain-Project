require("@nomiclabs/hardhat-ethers");
const { ethers } = require("hardhat");

async function interact() {
    [owner, user1] = await ethers.getSigners();

    // Replace with your deployed contract address
    let deployedCampaignAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"; // Replace with your actual deployed Campaign address
    let deployedTokenAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Replace with your actual deployed DonationToken address

    let campaign = await ethers.getContractAt("Campaign", deployedCampaignAddress);
    let token = await ethers.getContractAt("DonationToken", deployedTokenAddress);

    // Set campaign target (only the owner can do this)
    let targetAmount = ethers.utils.parseEther("1000"); // Set target to 1000 ETH
    let setTargetTx = await campaign.setTargetAmount(targetAmount);
    await setTargetTx.wait();
    console.log("Campaign target set to 1000 ETH");

    // View current campaign progress
    let totalDonations = await campaign.totalDonations();
    let target = await campaign.targetAmount();
    console.log("Current Total Donations:", ethers.utils.formatEther(totalDonations));
    console.log("Target Amount:", ethers.utils.formatEther(target));
    
    let progress = (parseFloat(ethers.utils.formatEther(totalDonations)) * 100) / parseFloat(ethers.utils.formatEther(target));
    console.log(`Campaign Progress: ${progress.toFixed(2)}%`);

    // Donate to the campaign (using the owner address or any address)
    let donationAmount = ethers.utils.parseEther("1"); // Donate 1 ETH
    let tokenId = 100000;
    let donateTx = await campaign.donate(tokenId, { value: donationAmount });
    await donateTx.wait();
    console.log("Donated 1 ETH to the campaign");

    // View updated campaign progress after donation
    totalDonations = await campaign.totalDonations();
    progress = (parseFloat(ethers.utils.formatEther(totalDonations)) * 100) / parseFloat(ethers.utils.formatEther(target));
    console.log("Updated Campaign Progress:", progress.toFixed(2) + "%");

    let transferTx = await token.transferToken(owner.address,user1.address,tokenId);
    await transferTx.wait();
    console.log(`Token ${tokenId} transferred from ${owner.address} to ${user1.address}`);

    let tokenInfo = await token.viewToken(tokenId);
    console.log("Updated Token Information:");
    console.log("ID:", tokenInfo[0].toString());         
    console.log("Amount:", ethers.utils.formatEther(tokenInfo[1].toString()));
    console.log("Owner:", tokenInfo[2]);                   
    
}

interact()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
