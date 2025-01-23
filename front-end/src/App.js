import React, { useEffect, useState } from 'react';
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
    const [provider] = useState(new ethers.providers.JsonRpcProvider("http://localhost:8545"));
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
    const [hasVoted, setHasVoted] = useState(false);
    const [currentProposalIndex, setCurrentProposalIndex] = useState(0); 
    const [donationPercentages, setDonationPercentages] = useState([]);

    useEffect(() => {
        async function fetchAccountData() {
            try {
                const accounts = await provider.listAccounts();
                setAccountData(accounts || []);
            } catch (error) {
                alert('Error fetching account data: ' + error.message);
            }
        }
        fetchAccountData();
    }, [provider]);

    useEffect(() => {
        async function initializeContracts() {
            if (signerIndex !== null && provider) {
                const signer = provider.getSigner(signerIndex);
    
                try {
                    const campaignAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
                    const campaign = new ethers.Contract(campaignAddress, campaignAbi.abi, signer);
                    setCampaignContract(campaign);
    
                    const donationTokenAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
                    const donationToken = new ethers.Contract(donationTokenAddress, donationTokenAbi.abi, signer);
                    setDonationTokenContract(donationToken);

                    const proposalAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
                    const proposal = new ethers.Contract(proposalAddress, proposalAbi.abi, signer);
                    setProposalContract(proposal);  

                    const owner = await campaign.owner();
                    setIsOwner(accountAddress.toLowerCase() === owner.toLowerCase()); 
                    setIsContractsLoaded(true);
                } catch (error) {
                    alert('Error initializing contracts: ' + error.message);
                }
            }
        }
        initializeContracts();
    }, [signerIndex, provider, accountAddress]);
    
    useEffect(() => {
        async function fetchCampaignData() {
            if (campaignContract) {
                try {
                    const currentTotalDonations = await campaignContract.totalDonations();
                    const currentTargetAmount = await campaignContract.targetAmount();
                    const currentProgress = (parseFloat(currentTotalDonations) * 100) / parseFloat(currentTargetAmount);
    
                    setTotalDonations(ethers.utils.formatEther(currentTotalDonations));
                    setTargetAmount(ethers.utils.formatEther(currentTargetAmount));
                    setProgress(currentProgress || 0);
    
                } catch (error) {
                    alert('Error fetching campaign data: ' + error.message);
                }
            }
        }
        fetchCampaignData();
    }, [campaignContract]);
    
    useEffect(() => {
        if (totalDonations && targetAmount) {
            const currentProgress = (parseFloat(totalDonations) * 100) / parseFloat(targetAmount);
            setProgress(currentProgress || 0);
    
            if (parseFloat(totalDonations) >= parseFloat(targetAmount)) {
                setIsTargetReached(true);
            }
            else{
                setIsTargetReached(false);
            }
        }
    }, [totalDonations, targetAmount]);

    async function handleLogin(address) {
        try {
            setIsLoggedIn(true);
            setAccountAddress(address);
            const balance = await provider.getBalance(address);
            setAccountBalance(ethers.utils.formatEther(balance));

            const index = accountData.indexOf(address);
            if (index === -1) {
                alert("Address not found in accountData.");
            } else {
                setSignerIndex(index);
                alert("Logged in successfully.");
            }
        } catch (error) {
            alert('Error during login: ' + error.message);
        }
    }

    async function handleLogout() {
        setIsLoggedIn(false);
        setAccountAddress('');
        setAccountBalance('');
        setSignerIndex(null);
        setCampaignContract(null);
        setDonationTokenContract(null);
        setTotalDonations(0);
        setTargetAmount('');
        setDonationAmount('');
        setProgress(0);
        alert("You have logged out successfully.");
    }

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

            if (donationAmount && parseFloat(donationAmount) > 0) {
                const donationValue = ethers.utils.parseEther(donationAmount);

                const balance = await provider.getBalance(accountAddress);
                if (balance.lt(donationValue)) {
                    alert("Insufficient balance for the donation.");
                    return;
                }

                const donationTx = await campaignContract.donate({ value: donationValue });
                await donationTx.wait();

                const updatedBalance = await provider.getBalance(accountAddress);
                setAccountBalance(ethers.utils.formatEther(updatedBalance));

                const currentTotalDonations = await campaignContract.totalDonations();
                const currentTargetAmount = await campaignContract.targetAmount();

                setTotalDonations(ethers.utils.formatEther(currentTotalDonations));
                setTargetAmount(ethers.utils.formatEther(currentTargetAmount));
                setHasVoted(false);

                setShowThankYouPopup(true);
                fetchProposals();
            } else {
                alert("Please enter a valid donation amount.");
            }
        } catch (error) {
            alert('An error occurred while making the donation. Please check the console for details.');
        }
    }

    async function setCampaignTarget() {
        try {
            if (campaignContract && parseFloat(targetAmount) > 0) {
                const campaignOwner = await campaignContract.owner();

                if (accountAddress !== campaignOwner) {
                    alert("Only the campaign owner can set the target amount.");
                    return;
                }

                const targetValue = ethers.utils.parseEther(targetAmount);

                const currentTotalDonations = await campaignContract.totalDonations();
                if (targetValue.lte(currentTotalDonations)) {
                    alert("Target amount must be greater than total donations.");
                    return;
                }

                const setTargetTx = await campaignContract.setTargetAmount(targetValue);
                await setTargetTx.wait();

                alert("Target amount set successfully!");
            } else {
                alert("Please enter a valid target amount.");
            }
        } catch (error) {
            alert('An error occurred while setting the target amount. Please check the console for details.');
        }
    }

    async function fetchProposals() {
      // Fetch proposals from the contract
      const fetchedProposals = await proposalContract.getProposals();
    
      // Proposal details with description and image URLs
      const proposalsDetails = [
        {
          id: 1,
          descriptionUrl: 'https://bafybeig7eytlutb4bhjt7hp35py6uyhdbdeqayr2dzddkbrjjd5eoon4im.ipfs.w3s.link/proposal1.txt',
          imageUrl: 'https://bafybeidemydfmxzi22eitoto6ypgdbvythlpwxp7esnydjedj734t5p3w4.ipfs.w3s.link/proposal1.webp',
        },
        {
          id: 2,
          descriptionUrl: 'https://bafybeigkod6hknxfrfs4yvjkwq6yqkly2ug3t47knigd4senza5y2arivm.ipfs.w3s.link/proposal2.txt',
          imageUrl: 'https://bafybeiccplvm3a4s4ullyli65y3222bhwiia25b3xjvtmbk57whcwp6rgm.ipfs.w3s.link/proposal2.jpeg',
        },
        {
          id: 3,
          descriptionUrl: 'https://bafybeihd5on7ovlevvz6hmnbejuk5gzenfoilba4qlhymtmbugl7eotduy.ipfs.w3s.link/proposal3.txt',
          imageUrl: 'https://bafybeifipnkxtonmy4xcj2lwg6hbg36ovr45tt4wzll2go6k2ib3jqcfdm.ipfs.w3s.link/proposal3.webp',
        },
      ];
    
      // Fetch descriptions for all proposals
      const descriptions = await Promise.all(
        proposalsDetails.map(async (proposal) => {
          const response = await fetch(proposal.descriptionUrl);
          return await response.text();
        })
      );
    
    
      // Save fetched proposals and descriptions to state
      setProposalsDetails(proposalsDetails);
      setProposals(fetchedProposals);
      setDescriptions(descriptions); // Use a separate state for descriptions if needed
      setShowVotePopup(true);
    }
    async function fetchDonationPercentages() {
      try {
          if (campaignContract) {
              const percentages = await campaignContract.getDonationPercentages();
              setDonationPercentages(percentages.map(p => p.toNumber())); // Convert BigNumber to plain numbers
          } else {
              alert("Campaign contract is not initialized.");
          }
      } catch (error) {
          console.error("Error fetching donation percentages:", error);
      }
  }

  // Call the function once contracts are loaded
  useEffect(() => {
      if (isContractsLoaded) {
          fetchDonationPercentages();
      }
  }, [isContractsLoaded]);
  
    const handleNextProposal = () => {
      if (currentProposalIndex < proposalsDetails.length - 1) {
          setCurrentProposalIndex(currentProposalIndex + 1);
      }
  };

  const handlePrevProposal = () => {
      if (currentProposalIndex > 0) {
          setCurrentProposalIndex(currentProposalIndex - 1);
      }
  };

  async function handleVote(proposalId) {
    try {
        if (proposalContract) {
            const voteTx = await proposalContract.vote(proposalId);
            await voteTx.wait();
            setHasVoted(true);
            fetchDonationPercentages();
        }
    } catch (error) {
        alert('An error occurred while voting. Please check the console for details.');
    }
}
    const campaignImageUrl ="https://bafybeia3oxbhfxrzyrvrgnp2gft3tvi7zhcqdvo2nyher2qna72agkaabq.ipfs.w3s.link/photo2.webp";
    const campaignDescriptionUrl="https://bafybeibq7ek3iezsk75gjfmqdn7yz7haw5f54l3uk5ky3yzmvwsxfuj65m.ipfs.w3s.link/description.txt"
    useEffect(() => {
      fetch(campaignDescriptionUrl)
        .then((response) => response.text())
        .then((data) => setCampaignDescription(data))
        .catch((error) => console.error("Error fetching campaign description:", error));
    }, []);

    return (
        <div className="campaign-container">
          {!isLoggedIn ? (
            <Login accountData={accountData} onLogin={handleLogin} placeholder="Enter address" />
          ) : (
            <div>
              <header className="campaign-header">
                <h1>Support Our Campaign</h1>
              </header>
      
              <div className="account-info">
                <button className="logout-button" onClick={handleLogout}>
                  Logout
                </button>
                <button className="button" onClick={() => setShowAccountInfoPopup(true)}>
                  Account Information
                </button>
              </div>
      
              {showAccountInfoPopup && (
                <div className="popup">
                  <div className="popup-content">
                    <button
                      className="close-popup-button"
                      onClick={() => setShowAccountInfoPopup(false)}
                    >
                      X
                    </button>
                    <h3>Account Information</h3>
                    <p>Account: {accountAddress}</p>
                    <p>Balance: {accountBalance} ETH</p>
                  </div>
                </div>
              )}
              <button className="button" onClick={() => setShowCampaignInfoPopup(true)}>
                  Campaign Information
                </button>
                {showCampaignInfoPopup && (
                <div className="popup">
                  <div className="popup-content">
                    <button
                      className="close-popup-button"
                      onClick={() => setShowCampaignInfoPopup(false)}
                    >
                      X
                    </button>
                    <h3>Campaign Information</h3>
                    <p>{campaignDescription}</p>
                    <img src={campaignImageUrl} alt="Campaign" />
                    
                  </div>
                </div>
              )}

<button className="p-button" onClick={() => setShowCampaignCausesPopup(true)}>
  Campaign Percenteges
</button>

{showCampaignCausesPopup && (
  <div className="popup">
    <div className="popup-content">
      <button 
        className="close-popup-button"
        onClick={() => setShowCampaignCausesPopup(false)}
      >
        X
      </button>
      <h3>Campaign Percenteges</h3>
      <ul>
        {proposalsDetails.map((proposal, index) => (
          <li key={proposal.id} style={{ marginBottom: '20px' }}>
            <img 
              src={proposal.imageUrl} 
              style={{ width: '100px', height: '100px', objectFit: 'cover', marginBottom: '10px' }}
            />
            <p>{descriptions[index]}</p>
            <p>{donationPercentages[index]}%</p>
          </li>
        ))}
      </ul>
    </div>
  </div>
)}
      
              <div className="campaign-progress">
                <h2>Campaign Progress</h2>
                <p>Total Donations: {totalDonations} ETH</p>
                {targetAmount && <p>Target Amount: {targetAmount} ETH</p>}
                <p>Progress: {progress.toFixed(2)}%</p>
                <progress value={progress} max="100"></progress>
              </div>
              <div>
  <h2>Make a Donation</h2>
  <label>Amount (ETH):</label>
  <input
    type="number"
    value={donationAmount}
    onChange={(e) => setDonationAmount(e.target.value)}
  />
  <button onClick={donate}>Donate</button>
</div>

{/* Vote Popup with pagination */}
{showVotePopup && (
                        <div className="popup">
                            <div className="popup-content">
                                <button
                                    className="close-popup-button"
                                    onClick={() => setShowVotePopup(false)}
                                    disabled={!hasVoted} 
                                >
                                    X
                                </button>
                                <h3>Donate for a cause</h3>
                                <div className="proposal">
                                    <img
                                        src={proposalsDetails[currentProposalIndex].imageUrl}
                                        style={{
                                            width: '300px',
                                            height: '300px',
                                            objectFit: 'cover',
                                            marginBottom: '10px',
                                        }}
                                    />
                                    <p>{descriptions[currentProposalIndex]}</p>
                                    <button onClick={() => handleVote(proposalsDetails[currentProposalIndex].id)}>Choose</button>
                                </div>
                                <div className="pagination-controls">
                                    <button className="next-button" 
                                        onClick={handlePrevProposal}
                                        disabled={currentProposalIndex === 0} // Disable "Previous" button on first proposal
                                    >
                                        Previous
                                    </button>
                                    <button className="next-button" 
                                        onClick={handleNextProposal}
                                        disabled={currentProposalIndex === proposalsDetails.length - 1} // Disable "Next" button on last proposal
                                    >
                                        Next 
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}     
      
              {isOwner && (
                <div className="set-target-section">
                  <h2>Set Campaign Target</h2>
                  <label>Target Amount (ETH):</label>
                  <input
                    type="number"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                  />
                  <button onClick={setCampaignTarget}>Set Target</button>
                </div>
              )}
      
              {showThankYouPopup && hasVoted && (
                <div className="popup">
                  <div className="popup-content">
                    <h2>Thank You!</h2>
                    <p>Your generosity makes a difference. Thank you for your support!</p>
                    <button onClick={() => setShowThankYouPopup(false)}>Close</button>
                  </div>
                </div>
              )}
      
              {isTargetReached && showThankYouPopup && hasVoted && (
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