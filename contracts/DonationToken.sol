// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

contract DonationToken {
    struct DonationAsset {
        uint256 id;
        uint256 amount; // Donation amount
        address donor;  // Address of the donor
    }

    uint256 public nbtokens; 
    uint256[] public tokenIds;

    mapping(uint256 => DonationAsset) public donationAssets;
    mapping(address => uint256) public donorTokenCount; // Count of tokens held by each donor
    mapping(address => mapping(address => uint256)) private _allowances; // Allowances for token transfers

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    modifier onlyOwner(address owner, uint256 _tokenId) {
        require(donationAssets[_tokenId].donor == owner, "You are not the owner of this token");
        _;
    }

    function issueToken(uint256 _id, uint256 _amount) external {
        require(donationAssets[_id].id == 0, "Token with this ID already exists");

        donationAssets[_id] = DonationAsset({
            id: _id,
            amount: _amount,
            donor: msg.sender
        });

        donorTokenCount[msg.sender]++;
        tokenIds.push(_id);
        nbtokens++;
    }

    function transferToken(address _to, uint256 _tokenId) external onlyOwner(msg.sender, _tokenId) {
        require(_to != address(0), "Invalid address");
        require(donorTokenCount[donationAssets[_tokenId].donor] > 0, "Owner has no tokens");

        donationAssets[_tokenId].donor = _to;
        donorTokenCount[msg.sender]--;
        donorTokenCount[_to]++;

        emit Transfer(msg.sender, _to, _tokenId);
    }

    function viewToken(uint256 _tokenId) external view returns (uint256, uint256, address) {
        DonationAsset memory asset = donationAssets[_tokenId];
        return (asset.id, asset.amount, asset.donor);
    }

    function totalSupply() external view returns (uint256) {
        return nbtokens;
    }

    function balanceOf(address _donor) external view returns (uint256) {
        return donorTokenCount[_donor];
    }

    function approve(address _spender, uint256 _value) external returns (bool) {
        _allowances[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
        return true;
    }

    function transferFrom(address _from, address _to, uint256 _value) external returns (bool) {
        require(_from != address(0), "Invalid address");
        require(_to != address(0), "Invalid address");
        require(_value <= donorTokenCount[_from], "Insufficient balance");
        require(_value <= _allowances[_from][msg.sender], "Allowance exceeded");

        donorTokenCount[_from] -= _value;
        donorTokenCount[_to] += _value;
        _allowances[_from][msg.sender] -= _value;

        emit Transfer(_from, _to, _value);

        return true;
    }

    function viewAllTokens() external view returns (DonationAsset[] memory) {
        DonationAsset[] memory tokens = new DonationAsset[](nbtokens);
        for (uint256 i = 0; i < tokenIds.length; i++) {
            tokens[i] = donationAssets[tokenIds[i]];
        }
        return tokens;
    }

    function isTokenOwner(address _owner, uint256 _tokenId) external view returns (bool) {
        return donationAssets[_tokenId].donor == _owner;
    }
}
