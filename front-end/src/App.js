import React, { useEffect, useState, useCallback } from 'react';
import { ethers } from 'ethers';
import campaignAbi from './Campaign.json';
import donationTokenAbi from './DonationToken.json';
import proposalAbi from './Proposal.json';
import Login from './Login';
import './App.css';

function CampaignInteraction() {
    const [accountAddress, setAccountAddress] = useState('');
    const [accountBalance, setAccountBalance] = useState('');
    const [donationAmount, setDonationAmount] = useState('');
    const [targetAmount, setTargetAmount] = useState('');
    const [progress, setProgress] = useState(0);
    const [totalDonations, setTotalDonations] = useState(0);
    const [provider, setProvider] = useState(null);
    const [signerIndex, setSignerIndex] = useState(null);
    const [isTargetReached, setIsTargetReached] = useState(false);
    const [campaignContract, setCampaignContract] = useState(null);
    const [donationTokenContract, setDonationTokenContract] = useState(null);
    const [proposalContract, setProposalContract] = useState(null);
    const [accountData, setAccountData] = useState([]);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isContractsLoaded, setIsContractsLoaded] = useState(false);
    const [showThankYouPopup, setShowThankYouPopup] = useState(false);
    const [showAccountInfoPopup, setShowAccountInfoPopup] = useState(false);
    const [isOwner, setIsOwner] = useState(false);
    const [campaignDescription, setCampaignDescription] = useState(null);
    const [descriptions, setDescriptions] = useState([]);
    const [showCampaignInfoPopup, setShowCampaignInfoPopup] = useState(false);
    const [showCampaignCausesPopup, setShowCampaignCausesPopup] = useState(false);
    const [showVotePopup, setShowVotePopup] = useState(false); 
    const [proposals, setProposals] = useState([]);
    const [proposalsDetails, setProposalsDetails] = useState([]);
    const [currentProposalIndex, setCurrentProposalIndex] = useState(0); 
    const [donationPercentages, setDonationPercentages] = useState([]);
    const [tokenBalance, setTokenBalance] = useState(0);
    const [humanitarianAddresses, setHumanitarianAddresses] = useState([]);
    const [isActive, setIsActive] = useState(true);
    const [fundsDistributed, setFundsDistributed] = useState(false);
    const [userVotes, setUserVotes] = useState({});
    const [userTokens, setUserTokens] = useState([]);
    const [selectedTokenId, setSelectedTokenId] = useState(null);

    async function fetchUserNFTs() {
        if (!donationTokenContract || !accountAddress) return;
    
        try {
            const tokens = await donationTokenContract.getTokensByOwner(accountAddress);
            const formattedTokens = tokens.length > 0 ? tokens.map(tokenId => tokenId.toNumber()) : [];
            
            console.log("📌 User NFTs:", formattedTokens); 
            
            setUserTokens(formattedTokens);
        } catch (error) {
            console.error("Error fetching user NFTs:", error);
            setUserTokens([]);
        }
    }
    useEffect(() => {
        if (donationTokenContract && accountAddress) {
            fetchUserNFTs();
        }
    }, [donationTokenContract, accountAddress]);

    useEffect(() => {
        async function fetchHumanitarianAddresses() {
            if (!proposalContract || proposals.length === 0) return;
            let addresses = [];
            for (let i = 0; i < proposals.length; i++) {
                const beneficiary = await proposalContract.getProposalBeneficiary(i);
                addresses.push(beneficiary.toLowerCase());
            }
            setHumanitarianAddresses(addresses);
        }
        if (proposals.length > 0) {
            fetchHumanitarianAddresses();
        }
    }, [proposalContract, proposals]);
    
    const fetchBalance = async (address) => {
        if (!address || !window.ethereum) return;
        try {
            const balance = await window.ethereum.request({
                method: 'eth_getBalance',
                params: [address, 'latest'],
            });
            setAccountBalance(ethers.utils.formatEther(balance));
        } catch (error) {
            console.error("Error fetching balance: ", error);
        }
    };
    
    async function fetchTokenBalance() {
        if (!donationTokenContract || !accountAddress) return; 
        try {
            const tokens = await donationTokenContract.getTokensByOwner(accountAddress);
            setTokenBalance(tokens.length);
        } catch (error) {
            console.error("Error fetching token balance:", error);
            setTokenBalance(0); 
        }
    }
    
    useEffect(() => {
        if (!donationTokenContract || !accountAddress) return;
    
        const updateBalanceOnMintOrBurn = async (from, to, tokenId) => {
            console.log(`🔄 NFT Transfer Event: Token #${tokenId} moved from ${from} to ${to}`);
    
            //transfer catre 0x0 (burn), elimina NFT-ul din lista
            if (to === ethers.constants.AddressZero) {
                setUserTokens(prevTokens => prevTokens.filter(id => id !== tokenId));
            }
    
            await fetchTokenBalance();
            await fetchUserNFTs();
        };
    
        donationTokenContract.removeAllListeners("TokenIssued");
        donationTokenContract.on("TokenIssued", updateBalanceOnMintOrBurn);
    
        return () => {
            donationTokenContract.off("TokenIssued", updateBalanceOnMintOrBurn);
        };
    }, [donationTokenContract, accountAddress]);

    async function initializeContracts(provider, address) {
        if (!provider || campaignContract) return;
    
        const signer = provider.getSigner();
        try {
            const campaign = new ethers.Contract("0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0", campaignAbi.abi, signer);
            setCampaignContract(campaign);
    
            const donationToken = new ethers.Contract("0x5FbDB2315678afecb367f032d93F642f64180aa3", donationTokenAbi.abi, signer);
            setDonationTokenContract(donationToken);
    
            const proposal = new ethers.Contract("0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512", proposalAbi.abi, signer);
            setProposalContract(proposal);
    
            const owner = await campaign.owner();
            console.log("Owner of contract:", owner);
            console.log("User's account:", address);
            setIsOwner(address?.toLowerCase() === owner.toLowerCase());
    
            const isActive = await campaign.isCampaignActive();
            console.log("Campaign active:", isActive);
            
            const fundsDistributed = await campaign.fundsDistributed();
            console.log("Funds distributed:", fundsDistributed);
    
            const totalDonations = await campaign.getTotalDonations();
            console.log("Total donations:", ethers.utils.formatEther(totalDonations));
    
            setIsContractsLoaded(true);
        } catch (error) {
            alert('Error initializing contracts: ' + error.message);
        }
    }
  
    
    async function fetchCampaignData() {
        if (!campaignContract) return; 
        try {
            const currentTotalDonations = await campaignContract.totalDonations();
            const currentTargetAmount = await campaignContract.targetAmount();
            
            const formattedDonations = ethers.utils.formatEther(currentTotalDonations);
            const formattedTarget = ethers.utils.formatEther(currentTargetAmount);
            
            setTotalDonations(formattedDonations);
            setTargetAmount(formattedTarget);

            const progress = (parseFloat(formattedDonations) * 100) / parseFloat(formattedTarget);
            setProgress(progress || 0);

            setIsTargetReached(parseFloat(formattedDonations) >= parseFloat(formattedTarget)); 
        } catch (error) {
            console.error('Error fetching campaign data:', error);
        }
    }
    
    useEffect(() => {
        if (campaignContract) {
            fetchCampaignData();
        }
    }, [campaignContract]);
  

    async function connectWallet() {
        if (!window.ethereum) {
            alert("⚠️ Please install MetaMask!");
            return;
        }
        try {
            const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
            await window.ethereum.request({ method: "eth_requestAccounts" });
    
            const signer = web3Provider.getSigner();
            const address = await signer.getAddress();
            const balance = await web3Provider.getBalance(address);
    
            setProvider(web3Provider);
            setAccountAddress(address);
            setAccountBalance(ethers.utils.formatEther(balance));
            setIsLoggedIn(true);
    
            initializeContracts(web3Provider, address);
            fetchBalance(address);
            fetchTokenBalance();
            fetchUserNFTs();
    
            window.ethereum.removeListener("accountsChanged", handleAccountChange);
            window.ethereum.removeListener("chainChanged", handleNetworkChange);
    
            window.ethereum.on("accountsChanged", handleAccountChange);
            window.ethereum.on("chainChanged", handleNetworkChange);
    
        } catch (error) {
            console.error("❌ Error connecting to wallet:", error);
            alert("❌ Connection failed. Try again.");
        }
    }
    
    const handleAccountChange = (accounts) => {
        if (accounts.length > 0) {
            setAccountAddress(accounts[0]);
            fetchBalance(accounts[0]);
            fetchUserNFTs();
        } else {
            handleLogout();
        }
    };
    
    const handleNetworkChange = () => {
        alert("🔄 Network changed! Please reconnect.");
        handleLogout();
    };
  
    async function handleLogout() {
        try {
            setIsLoggedIn(false);
            setAccountAddress('');
            setAccountBalance('');
            setProvider(null);
            setCampaignContract(null);
            setDonationTokenContract(null);
            setProposalContract(null);
            setTotalDonations(0);
            setTargetAmount('');
            setProgress(0);
            setIsTargetReached(false);
            setIsContractsLoaded(false);
            setIsOwner(false);
            setUserTokens([]);
            setUserVotes({});
            setDonationPercentages([]);
    
            if (window.ethereum) {
                window.ethereum.removeListener("accountsChanged", handleAccountChange);
                window.ethereum.removeListener("chainChanged", handleNetworkChange);
            }
    
            alert("✅ Successfully logged out!");
        } catch (error) {
            console.error("Logout error:", error);
        }
    }
  
  
    useEffect(() => {
        async function checkConnection() {
            if(!window.ethereum || campaignContract) return; 
            if (window.ethereum) {
                try {
                    const accounts = await window.ethereum.request({ method: "eth_accounts" });
                    if (accounts.length > 0) {
                        const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
                        setProvider(web3Provider);
                        setAccountAddress(accounts[0]);
                        fetchBalance(accounts[0]);
                        initializeContracts(web3Provider, accounts[0]);
                        fetchUserNFTs();
                        setIsLoggedIn(true);
                    }
                } catch (error) {
                    console.error("Error checking wallet connection:", error);
                }
            }
        }
        checkConnection();
    }, []);

    async function donate() {
        try {
            if (!isContractsLoaded || !campaignContract) {
                alert("Contracts are still loading. Please wait.");
                return;
            }
    
            if (!ethers.utils.isAddress(accountAddress)) {
                alert("Invalid account address.");
                return;
            }
    
            if (!donationAmount || parseFloat(donationAmount) <= 0) {
                alert("Please enter a valid donation amount.");
                return;
            }
    
            const donationValue = ethers.utils.parseEther(donationAmount);
    
            const contractOwner = await campaignContract.owner();
            if (accountAddress?.toLowerCase() === contractOwner.toLowerCase()) {
                alert("The owner cannot make donations.");
                return;
            }
    
            console.log(`💰 Attempting donation of: ${ethers.utils.formatEther(donationValue)} ETH`);
    
            const donationTx = await campaignContract.donate({ value: donationValue });
            console.log("⏳ Transaction sent:", donationTx.hash);
    
            await donationTx.wait();
            console.log("✅ Transaction confirmed:", donationTx.hash);
    
            await fetchCampaignData();
    
            setShowThankYouPopup(true);
    
            setDonationAmount(""); 
    
            console.log("🎉 Donation successful!");
        } catch (error) {
            console.error("❌ Error during donation:", error);
    
            if (error.code === "INSUFFICIENT_FUNDS") {
                alert("❌ Insufficient funds to complete this transaction.");
            } else if (error.code === "UNPREDICTABLE_GAS_LIMIT") {
                alert("⚠️ Transaction might fail. Possible causes:\n1️⃣ Owner restriction in contract\n2️⃣ Contract is not properly deployed\n3️⃣ Network error.");
            } else {
                alert("⚠️ An unexpected error occurred. Please try again later.");
            }
        }
    }
    
    async function setCampaignTarget() {
        try {
            if (!campaignContract) {
                alert("❌ Campaign contract is not initialized.");
                console.error("❌ Error: campaignContract is undefined.");
                return;
            }
    
            if (!accountAddress) {
                alert("❌ Please connect your wallet first.");
                return;
            }
    
            if (parseFloat(targetAmount) <= 0) {
                alert("❌ Please enter a valid target amount.");
                return;
            }
    
            console.log("✅ Campaign Contract Instance:", campaignContract);
    
            const campaignOwner = await campaignContract.owner();
            console.log("✅ Campaign Owner:", campaignOwner);
    
            if (accountAddress?.toLowerCase() !== campaignOwner.toLowerCase()) {
                alert("❌ Only the campaign owner can set the target amount.");
                return;
            }
    
            const targetValue = ethers.utils.parseEther(targetAmount);
            
            const currentTotalDonations = await campaignContract.getTotalDonations();
            const currentTotalDonationsBN = ethers.BigNumber.from(currentTotalDonations);
    
            console.log("🔍 New Target Value:", ethers.utils.formatEther(targetValue));
            console.log("🔍 Current Total Donations:", ethers.utils.formatEther(currentTotalDonationsBN));
    
            if (targetValue.lte(currentTotalDonationsBN)) {
                alert(`❌ Target amount must be greater than total donations (${ethers.utils.formatEther(currentTotalDonationsBN)} ETH).`);
                return;
            }
    
            alert("⏳ Transaction submitted. Please wait for confirmation...");
    
            const tx = await campaignContract.setTargetAmount(targetValue);
            await tx.wait();

            await fetchCampaignData();
    
            alert("✅ Target amount set successfully!");
        } catch (error) {
            console.error("❌ Error setting campaign target:", error);
            alert("❌ An error occurred while setting the target amount. Check console for details.");
        }
    }
  

    async function fetchProposals() {
        try {
            if (!campaignContract || !proposalContract) {
                console.warn("⚠️ One or more contracts are not loaded.");
                return;
            }
    
            const fetchedProposals = await proposalContract.getProposals();
            if (!fetchedProposals || fetchedProposals.length === 0) {
                console.warn("⚠️ No proposals available.");
                alert("No proposals have been created yet.");
                return;
            }
    
            const formattedProposals = fetchedProposals.map((proposal) => ({
                id: proposal.id.toNumber(), 
                voteCount: proposal.voteCount.toNumber()
            }));
    
            const proposalsDetails = [
                {
                    id: 0,
                    descriptionUrl: 'https://bafybeig7eytlutb4bhjt7hp35py6uyhdbdeqayr2dzddkbrjjd5eoon4im.ipfs.w3s.link/proposal1.txt',
                    imageUrl: 'https://bafybeidemydfmxzi22eitoto6ypgdbvythlpwxp7esnydjedj734t5p3w4.ipfs.w3s.link/proposal1.webp',
                },
                {
                    id: 1,
                    descriptionUrl: 'https://bafybeigkod6hknxfrfs4yvjkwq6yqkly2ug3t47knigd4senza5y2arivm.ipfs.w3s.link/proposal2.txt',
                    imageUrl: 'https://bafybeiccplvm3a4s4ullyli65y3222bhwiia25b3xjvtmbk57whcwp6rgm.ipfs.w3s.link/proposal2.jpeg',
                },
                {
                    id: 2,
                    descriptionUrl: 'https://bafybeihd5on7ovlevvz6hmnbejuk5gzenfoilba4qlhymtmbugl7eotduy.ipfs.w3s.link/proposal3.txt',
                    imageUrl: 'https://bafybeifipnkxtonmy4xcj2lwg6hbg36ovr45tt4wzll2go6k2ib3jqcfdm.ipfs.w3s.link/proposal3.webp',
                },
            ];
    
            const descriptions = await Promise.all(proposalsDetails.map(async (proposal) => {
                try {
                    const response = await fetch(proposal.descriptionUrl);
                    if (!response.ok) throw new Error(`⚠️ Failed to fetch: ${proposal.descriptionUrl}`);
                    return await response.text();
                } catch (error) {
                    console.error(`⚠️ Error fetching description for proposal ${proposal.id}:`, error);
                    return "Description not available.";
                }
            }));
    
            const totalDonations = await campaignContract.getTotalDonations();

            const proposalFunds = await Promise.all(
                formattedProposals.map(async (proposal) => {
                    try {
                        const percentage = await proposalContract.getProposalPercentage(proposal.id); // obținem procentul de voturi

                        const percentageBN = ethers.BigNumber.from(percentage);
                        const divisorBN = ethers.BigNumber.from("100");

                        const funds = totalDonations.mul(percentageBN).div(divisorBN);

                        return funds;
                    } catch (error) {
                        console.error(`⚠️ Error calculating distributed funds for proposal ${proposal.id}:`, error);
                        return ethers.BigNumber.from("0");
                    }
                })
            );

            const proposalsWithFunds = formattedProposals.map((proposal, index) => ({
                ...proposal,
                funds: proposalFunds[index],
            }));
    
            setProposalsDetails(proposalsDetails);
            setProposals(proposalsWithFunds);
            setDescriptions(descriptions);
            setShowVotePopup(false);
            
            console.log("✅ Proposals updated successfully!");
        } catch (error) {
            console.error("❌ Error fetching proposals:", error);
            alert("❌ An error occurred while fetching proposals.");
        }
    }
  
  

    async function fetchDonationPercentages() {
        try {
            if (!campaignContract) {
                console.warn("Campaign contract is not initialized.");
                return;
            }
    
            if (!accountAddress) {
                console.warn("User is not connected.");
                return;
            }
    
            const percentages = await campaignContract.getDonationPercentages();
            
            if (!percentages || percentages.length === 0) {
                console.warn("No donation percentages available.");
                setDonationPercentages([]);
                return;
            }
    
            setDonationPercentages(percentages.map(p => p.toNumber())); // ✅ Conversie sigură
        } catch (error) {
            console.error("❌ Error fetching donation percentages:", error);
        }
    }
    
    useEffect(() => {
        if (!isContractsLoaded || !campaignContract) return;
        fetchDonationPercentages();
        fetchProposals();
    }, [isContractsLoaded, campaignContract]);
    
    const handleNextProposal = () => {
        setCurrentProposalIndex((prevIndex) => (proposalsDetails.length > 0 ? Math.min(prevIndex + 1, proposalsDetails.length - 1) : 0));
    };
    
    const handlePrevProposal = () => {
        setCurrentProposalIndex((prevIndex) => (proposalsDetails.length > 0 ? Math.max(prevIndex - 1, 0) : 0));
    };

    async function checkUserVotes() {
        if (!proposalContract || !accountAddress || proposals.length === 0) return;
    
        try {
            const voteResults = await Promise.all(
                proposals.map(proposal => proposalContract.hasVoted(proposal.id, accountAddress))
            );
    
            const votes = proposals.reduce((acc, proposal, index) => {
                acc[proposal.id] = voteResults[index];
                return acc;
            }, {});
    
            setUserVotes(votes);
        } catch (error) {
            console.error("❌ Error checking user votes:", error);
        }
    }
    
    useEffect(() => {
        if (!proposalContract || !accountAddress || proposals.length === 0) return;
        checkUserVotes();
    }, [proposalContract, accountAddress, proposals]);

    async function handleVote(proposalId, tokenId) {
        try {
            if (!proposalContract || !donationTokenContract || !campaignContract) {
                console.warn("⚠️ One or more contracts are not loaded.");
                return;
            }
    
            if (!tokenId) {
                alert("❌ You must select an NFT to vote.");
                return;
            }
    
            tokenId = Number(tokenId); 
            const ownerToken = await donationTokenContract.ownerOf(tokenId);
            console.log(`NFT #${tokenId} is owned by:`, ownerToken);

            const owner = await donationTokenContract.ownerOf(tokenId);
            if (owner.toLowerCase() !== accountAddress.toLowerCase()) {
                alert("❌ This NFT does not belong to you.");
                return;
            }
    
            console.log(`🗳️ Voting for proposal ${proposalId} with NFT #${tokenId}`);
    
            const voteTx = await proposalContract.vote(proposalId, tokenId);
            await voteTx.wait();
            console.log("✅ Vote confirmed:", voteTx.hash);
    
            setUserTokens(prevTokens => prevTokens.filter(id => id !== tokenId));
            
            setUserVotes((prevVotes) => ({
                ...prevVotes,
                [proposalId]: true,
            }));
            setSelectedTokenId(null);

            await fetchTokenBalance();
            await fetchDonationPercentages();
            await fetchUserNFTs();
            await fetchProposals();
    
            alert("✅ Vote successful!");
        } catch (error) {
            console.error("❌ Error during voting:", error);
    
            if (error.code === "UNPREDICTABLE_GAS_LIMIT") {
                alert("⚠️ Gas estimation failed. The transaction might fail.");
            } else if (error.code === "CALL_EXCEPTION") {
                alert("❌ You may not have permission to vote with this NFT.");
            } else {
                alert("❌ An unexpected error occurred. Check the console for details.");
            }
        }
    }
    
    async function distributeFunds() {
        try {
            if (!campaignContract) {
                console.warn("Campaign contract not loaded.");
                return;
            }
    
            if (!accountAddress) {
                console.warn("User is not connected.");
                return;
            }
    
            const contractOwner = await campaignContract.owner();
            if (accountAddress?.toLowerCase() !== contractOwner.toLowerCase()) {
                alert("❌ Only the campaign owner can distribute funds.");
                return;
            }
    
            const isActive = await campaignContract.isCampaignActive();
            console.log("Is campaign active?", isActive);
    
            if (isActive) {
                alert("❌ Campaign must be stopped before distributing funds.");
                return;
            }
    
            const fundsDistributed = await campaignContract.fundsDistributed();
            if (fundsDistributed) {
                alert("❌ Funds have already been distributed.");
                return;
            }
    
            alert("⏳ Transaction submitted. Please wait for confirmation...");
    
            const tx = await campaignContract.distributeFunds();
            await tx.wait();
    
            await fetchCampaignData();
    
            alert("✅ Funds distributed successfully!");
            setFundsDistributed(true);
        } catch (error) {
            console.error("❌ Error distributing funds:", error);
            alert("❌ An error occurred while distributing funds. Check the console for details.");
        }
    }
  
    async function withdrawFunds() {
        try {
            if (!campaignContract) {
                console.warn("Campaign contract not loaded.");
                return;
            }
    
            if (!accountAddress) {
                console.warn("User is not connected.");
                return;
            }
    
            const isBeneficiary = await campaignContract.isBeneficiary(accountAddress);
            if (!isBeneficiary) {
                alert("❌ You are not authorized to withdraw funds.");
                return;
            }
    
            alert("⏳ Transaction submitted. Please wait for confirmation...");
    
            const tx = await campaignContract.withdrawFunds();
            await tx.wait();
            console.log("✅ Funds withdrawn successfully:", tx.hash);
    
            alert("✅ Funds withdrawn successfully! Check your wallet balance.");
    
            await fetchCampaignData();
            fetchBalance(accountAddress);
        } catch (error) {
            console.error("❌ Error withdrawing funds:", error);
    
            if (error.code === "CALL_EXCEPTION") {
                alert("❌ Transaction failed. You might not be eligible to withdraw.");
            } else if (error.code === "INSUFFICIENT_FUNDS") {
                alert("❌ Insufficient gas balance for transaction.");
            } else {
                alert("❌ An unexpected error occurred. Check the console for details.");
            }
        }
    }

    async function stopCampaign() {
        try {
            if (!campaignContract) {
                console.warn("Campaign contract not loaded.");
                return;
            }
    
            if (!accountAddress) {
                console.warn("User is not connected.");
                return;
            }
    
            const totalDonations = await campaignContract.getTotalDonations();
            const targetAmount = await campaignContract.getTargetAmount();
    
            const totalDonationsETH = ethers.utils.formatEther(totalDonations);
            const targetAmountETH = ethers.utils.formatEther(targetAmount);
    
            console.log("Total donations:", totalDonationsETH);
            console.log("Target amount:", targetAmountETH);
    
            if (parseFloat(totalDonationsETH) < parseFloat(targetAmountETH)) {
                alert("❌ Target amount not reached yet.");
                return;
            }
    
            const contractOwner = await campaignContract.owner();
            if (accountAddress?.toLowerCase() !== contractOwner.toLowerCase()) {
                alert("❌ Only the campaign owner can stop the campaign.");
                return;
            }
    
            alert("⏳ Transaction submitted. Please wait for confirmation...");
    
            const tx = await campaignContract.stopCampaign();
            await tx.wait();
            console.log("✅ Campaign stopped successfully:", tx.hash);
    
            alert("✅ Campaign stopped successfully!");
    
            await fetchCampaignData();
        } catch (error) {
            console.error("❌ Error stopping campaign:", error);
            alert("❌ An error occurred while stopping the campaign. Check the console for details.");
        }
    }
  
    const campaignImageUrl = "https://bafybeia3oxbhfxrzyrvrgnp2gft3tvi7zhcqdvo2nyher2qna72agkaabq.ipfs.w3s.link/photo2.webp";
    const campaignDescriptionUrl = "https://bafybeibq7ek3iezsk75gjfmqdn7yz7haw5f54l3uk5ky3yzmvwsxfuj65m.ipfs.w3s.link/description.txt";

    const fetchCampaignDescription = useCallback(async () => {
        setCampaignDescription("Loading...");

        try {
            const response = await fetch(campaignDescriptionUrl);
            if (!response.ok) throw new Error(`Failed to fetch description: ${response.status}`);

            const data = await response.text();
            setCampaignDescription(data);
        } catch (error) {
            console.error("❌ Error fetching campaign description:", error);
            setCampaignDescription("Description not available.");
        }
    }, []);

    useEffect(() => {
        fetchCampaignDescription();
    }, [fetchCampaignDescription]);

    //event listeners 
    useEffect(() => {
        if (!campaignContract || !proposalContract || !accountAddress) return;
    
        const handleDonationReceived = async (donor, amount, tokenId) => {
            console.log(`💰 Donation received from ${donor}: ${ethers.utils.formatEther(amount)} ETH. Token ID: ${tokenId}`);
    
            await fetchBalance(accountAddress); 
            await fetchTokenBalance(); 
    
            const [updatedTotalDonations, updatedTargetAmount] = await Promise.all([
                campaignContract.totalDonations(),
                campaignContract.targetAmount(),
            ]);
    
            const formattedTotalDonations = ethers.utils.formatEther(updatedTotalDonations);
            const formattedTarget = ethers.utils.formatEther(updatedTargetAmount);
            setTotalDonations(formattedTotalDonations);
            setTargetAmount(formattedTarget);
    
            const newProgress = (parseFloat(formattedTotalDonations) * 100) / parseFloat(formattedTarget);
            setProgress(newProgress || 0);
            setIsTargetReached(parseFloat(formattedTotalDonations) >= parseFloat(formattedTarget));
    
            fetchDonationPercentages(); 
            fetchUserNFTs(); 
        };
    
        const handleFundsDistributed = () => {
            console.log("✅ Funds have been distributed successfully!");
            fetchProposals();
        };
    
        const handleCampaignClosed = () => {
            console.log("⚠️ Campaign has been closed by the owner.");
            setIsActive(false);
        };
    
        const handleFundsWithdrawn = async (beneficiary, amount) => {
            console.log(`🏦 ${beneficiary} withdrew ${ethers.utils.formatEther(amount)} ETH.`);
            await fetchCampaignData();
        };
    
        const handleVoteCast = async (voter, proposalId) => {
            console.log(`🗳️ ${voter} voted for proposal ID: ${proposalId}`);
            await fetchProposals();
        };
    
        campaignContract.on("DonationReceived", handleDonationReceived);
        campaignContract.on("FundsDistributed", handleFundsDistributed);
        campaignContract.on("CampaignClosed", handleCampaignClosed);
        campaignContract.on("FundsWithdrawn", handleFundsWithdrawn);
        proposalContract.on("VoteCast", handleVoteCast);
    
        return () => {
            campaignContract.off("DonationReceived", handleDonationReceived);
            campaignContract.off("FundsDistributed", handleFundsDistributed);
            campaignContract.off("CampaignClosed", handleCampaignClosed);
            campaignContract.off("FundsWithdrawn", handleFundsWithdrawn);
            proposalContract.off("VoteCast", handleVoteCast);
        };
    }, [campaignContract, proposalContract, accountAddress]);
  
  
  
    return (
      <div className="campaign-container">
          {!isLoggedIn ? (
              <Login accountData={accountData} onLogin={connectWallet} placeholder="Enter address" />
          ) : (
          <div>
              <header className="campaign-header">
                  <h1>Support Our Campaign</h1>
              </header>

              <div className="account-info">
                  <button className="logout-button" onClick={handleLogout}>Logout</button>
                  <button className="button" onClick={() => setShowAccountInfoPopup(true)}>Account Information</button>
              </div>

              {showAccountInfoPopup && (
                  <div className="popup">
                      <div className="popup-content">
                          <button className="close-popup-button" onClick={() => setShowAccountInfoPopup(false)}>X</button>
                          <h3>Account Information</h3>
                          <p>Account: {accountAddress}</p>
                          <p>ETH Balance: {accountBalance} ETH</p>
                          {/* <p>Token Balance: {tokenBalance} DONATE</p> */}
                      </div>
                  </div>
              )}

              <button className="button" onClick={() => setShowCampaignInfoPopup(true)}>Campaign Information</button>
              {showCampaignInfoPopup && (
                  <div className="popup">
                      <div className="popup-content">
                          <button className="close-popup-button" onClick={() => setShowCampaignInfoPopup(false)}>X</button>
                          <h3>Campaign Information</h3>
                          <p>{campaignDescription}</p>
                          <img src={campaignImageUrl} alt="Campaign" />
                      </div>
                  </div>
              )}

              <button className="p-button" onClick={() => setShowCampaignCausesPopup(true)}>Campaign Percentages</button>
              {showCampaignCausesPopup && (
                  <div className="popup">
                      <div className="popup-content">
                          <button className="close-popup-button" onClick={() => setShowCampaignCausesPopup(false)}>X</button>
                          <h3>Campaign Percentages</h3>
                          {proposalsDetails.length > 0 ? (
                          <ul>
                              {proposalsDetails.map((proposal, index) => (
                                  <li key={proposal.id} style={{ marginBottom: '20px' }}>
                                      <img src={proposal.imageUrl || "default.jpg"} style={{ width: '100px', height: '100px', objectFit: 'cover', marginBottom: '10px' }} />
                                      <p>{descriptions[index] || "No description available."}</p>
                                      <p>Funds Allocated: {ethers.utils.formatEther(proposals[index]?.funds) || "0"} ETH</p>
                                      <p>Donation Percentage: {donationPercentages[index] ? `${donationPercentages[index]}%` : "0%"}</p>
                                  </li>
                              ))}
                          </ul>
                          ) : (
                              <p>Loading campaign details...</p>
                          )}
                      </div>
                  </div>
              )}
              <button className="vote-button" onClick={() => setShowVotePopup(true)}>
                    Vote for a Proposal
            </button>
              <div className="campaign-progress">
                  <h2>Campaign Progress</h2>
                  <p>Total Donations: {totalDonations} ETH</p>
                  {targetAmount && <p>Target Amount: {targetAmount} ETH</p>}
                  <p>Progress: {progress.toFixed(2)}%</p>
                  <progress value={progress} max="100"></progress>
              </div>

              {isOwner && (
                  <div>
                      <h2>Manage Campaign</h2>
                      {isActive && isTargetReached && targetAmount > 0 && (
                          <button onClick={stopCampaign}>Stop Campaign</button>
                      )}
                      {!isActive && !fundsDistributed && (
                          <button onClick={distributeFunds}>Distribute Funds</button>
                      )}
                  </div>
              )}

              {humanitarianAddresses.includes(accountAddress.toLowerCase()) ? (
                  <div>
                      <h2>Withdraw Your Funds</h2>
                      <button onClick={withdrawFunds}>Withdraw</button>
                  </div>
              ) : (
                  <div>
                      {isActive && !isOwner ? (
                          <div>
                              <h2>Make a Donation</h2>
                              <label>Amount (ETH):</label>
                              <input type="number" value={donationAmount} onChange={(e) => setDonationAmount(e.target.value)} />
                              <button onClick={donate}>Donate</button>
                          </div>
                      ) : (
                          <p>The campaign is closed. Donations are no longer accepted.</p>
                      )}
                  </div>
              )}
              
              {/* Vote Popup with NFT Selection */}
              {showVotePopup && proposalsDetails.length > 0 && currentProposalIndex < proposalsDetails.length && (
              <div className="popup">
                  <div className="popup-content">
                      <button className="close-popup-button" onClick={() => setShowVotePopup(false)}>X</button>
                      <h3>Donate for a Cause</h3>
                      <div className="proposal">
                          <img src={proposalsDetails[currentProposalIndex].imageUrl} style={{ width: '300px', height: '300px', objectFit: 'cover', marginBottom: '10px' }} />
                          <p>{descriptions[currentProposalIndex]}</p>

                          {userTokens.length > 0 ? (
                              <>
                                  <select onChange={(e) => setSelectedTokenId(Number(e.target.value))}>
                                        <option value="">Select a DONATE Token</option>
                                        {userTokens.map((tokenId) => (
                                            <option key={tokenId} value={tokenId}>Token #{tokenId}</option>
                                        ))}
                                    </select>


                                  <button 
                                      onClick={() => handleVote(proposalsDetails[currentProposalIndex].id, selectedTokenId)} 
                                      disabled={userVotes[proposalsDetails[currentProposalIndex].id] || !selectedTokenId}
                                  >
                                      {userVotes[proposalsDetails[currentProposalIndex].id] ? "Already Voted" : "Vote"}
                                  </button>
                              </>
                          ) : (
                              <p>❌ You need at least one DONATE NFT to vote.</p>
                          )}
                      </div>

                      <div className="pagination-controls">
                          <button className="next-button" onClick={handlePrevProposal} disabled={currentProposalIndex === 0}>Previous</button>
                          <button className="next-button" onClick={handleNextProposal} disabled={currentProposalIndex === proposalsDetails.length - 1}>Next</button>
                      </div>
                  </div>
              </div>
          )}

              {isOwner && (
                  <div className="set-target-section">
                      <h2>Set Campaign Target</h2>
                      <label>Target Amount (ETH):</label>
                      <input type="number" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} />
                      <button onClick={setCampaignTarget}>Set Target</button>
                  </div>
              )}
              {showThankYouPopup && (
                <div className="popup">
                  <div className="popup-content">
                    <h2>Thank You!</h2>
                    <p>Your generosity makes a difference. Thank you for your support!</p>
                    <button onClick={() => setShowThankYouPopup(false)}>Close</button>
                  </div>
                </div>
              )}
    
              {isTargetReached && showThankYouPopup && (
                <div className="popup">
                  <div className="popup-content">
                    <h2>🎉 Target Reached! 🎉</h2>
                    <p>We have reached our goal, thanks to your kindness and support!</p>
                    <button onClick={() => setShowThankYouPopup(false)}>Close</button>
                  </div>
                </div>
              )}
          </div>
          )}
        </div>
    );
}
export default CampaignInteraction;