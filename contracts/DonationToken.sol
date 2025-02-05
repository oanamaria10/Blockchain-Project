// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract DonationToken is ERC721, Ownable {
    uint256 private _nextTokenId = 1;
    mapping(uint256 => bool) public usedForVoting;
    mapping(uint256 => uint256) public donationAmounts; 
    mapping(address => uint256[]) private ownedTokens;  

    constructor() ERC721("DonationToken", "DNT") Ownable(msg.sender) {}

    event TokenIssued(address indexed to, uint256 tokenId, uint256 amount);

    function issueToken(address to, uint256 amount) external returns (uint256) {
        uint256 tokenId = _nextTokenId;
        _nextTokenId++;
        donationAmounts[tokenId] = amount;  
        _mint(to, tokenId);
        ownedTokens[to].push(tokenId); 
        usedForVoting[tokenId] = false;
        emit TokenIssued(to, tokenId, amount); 
        return tokenId;
    }

    function burn(address _ownerToken, uint256 tokenId) external {
        require(usedForVoting[tokenId], "Token must be used for voting before burn"); 
        
        emit TokenIssued(msg.sender, tokenId, donationAmounts[tokenId]);

        _removeTokenFromOwnerList(_ownerToken, tokenId);

        _burn(tokenId);
        
        delete donationAmounts[tokenId]; 
    }
    function hasVoted(uint256 tokenId) external view returns (bool) {
        return usedForVoting[tokenId];
    }
    function setUsedForVoting(uint256 tokenId) external {
        require(!usedForVoting[tokenId], "Token already used for voting");

        usedForVoting[tokenId] = true;
    }
    function getNextTokenId() external view returns (uint256) {
        return _nextTokenId;
    }

    function getTokensByOwner(address _owner) external view returns (uint256[] memory) {
        return ownedTokens[_owner]; 
    }

    function getDonationAmount(uint256 tokenId) external view returns (uint256) {
        return donationAmounts[tokenId];  
    }

    function _removeTokenFromOwnerList(address _owner, uint256 tokenId) internal {
        uint256 length = ownedTokens[_owner].length;
        for (uint256 i = 0; i < length; i++) {
            if (ownedTokens[_owner][i] == tokenId) {
                ownedTokens[_owner][i] = ownedTokens[_owner][length - 1]; 
                ownedTokens[_owner].pop(); 
                return;
            }
        }
    }   
}
