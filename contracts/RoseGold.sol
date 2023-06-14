// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract RoseGold is ERC721, Pausable, Ownable {
    event AllowListMintCalled(address caller);

    using Counters for Counters.Counter;
    uint256 maxSupply = 2000;

    uint256 public totalSupply;

    bool public publicMintOpen = true;
    bool public allowListMintOpen = true;

    mapping(address => bool) public allowList;
    address[] public allowListAddresses;

    Counters.Counter private _tokenIdCounter;

    constructor() ERC721("RoseGold", "RG") {}

    function _baseURI() internal pure override returns (string memory) {
        return
            "https://ipfs.io/ipfs/QmbCt1X7HzNZsS8s5qJVNmSGPjQx6RpkmLvYvcKSDAoYVT?filename=Rose%20Gold";
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    // Modify the mint windows
    function editMintWindows(bool _publicMintOpen, bool _allowListMintOpen)
        external
        onlyOwner
    {
        publicMintOpen = _publicMintOpen;
        allowListMintOpen = _allowListMintOpen;
    }

    function allowListMint() public payable {
        require(allowListMintOpen, "Allowlist Mint Closed");
        require(allowList[msg.sender], "You are not on the allow list");
        require(msg.value == 0.001 ether, "Insufficient Funds");

        emit AllowListMintCalled(msg.sender);

        internalMint();
    }

    function publicMint() public payable {
        require(publicMintOpen, "Public Mint Closed");
        require(msg.value == 0.01 ether, "Insufficient Funds");

        internalMint();
    }

    function internalMint() internal {
        require(totalSupply < maxSupply, "We Sold Out!");
        require(
            publicMintOpen || (allowListMintOpen && allowList[msg.sender]),
            "Minting is not available"
        );

        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(msg.sender, tokenId);
    }

    function withdraw(address _addr) external onlyOwner {
        // get the balance of the contract
        uint256 balance = address(this).balance;
        payable(_addr).transfer(balance);
    }

    // Populate the Allow List
    function setAllowList(address[] memory addressesToAdd) public onlyOwner {
        // Delete all addresses from the allowList
        for (uint256 i = 0; i < allowListAddresses.length; i++) {
            delete allowList[allowListAddresses[i]];
        }

        // Clear the allowListAddresses array
        delete allowListAddresses;

        // Add the new addresses to the allowList and allowListAddresses
        for (uint256 i = 0; i < addressesToAdd.length; i++) {
            address addressToAdd = addressesToAdd[i];
            allowList[addressToAdd] = true;
            allowListAddresses.push(addressToAdd);
        }
    }

    function getAllowList() public view returns (address[] memory) {
        return allowListAddresses;
    }

    function addAddressToAllowList(address newAddress) external onlyOwner {
        allowList[newAddress] = true;
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override(ERC721) whenNotPaused {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
