// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract ERC721Token is ERC721, ERC721URIStorage, AccessControl {
    using Counters for Counters.Counter;

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    Counters.Counter private _tokenIdCounter;
    string private _uri;

    constructor(string memory name, string memory symbol, uint256 quantity, string memory uri)
        ERC721(name, symbol)
    {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);

        _uri = uri;

        for (uint256 i = 0; i < quantity; i++) {
            safeMint(msg.sender);
        }
    }

    function _baseURI() internal view override returns (string memory) {
        string memory uri = string.concat(_uri, Strings.toHexString(uint256(uint160(address(this))), 20));
        return string.concat(uri, "/");
    }

    function safeMint(address to) public onlyRole(MINTER_ROLE) {
        _tokenIdCounter.increment();
        uint256 tokenId = _tokenIdCounter.current();
        _safeMint(to, tokenId);
    }

    function safeBatchMint(address[] calldata addresses)
        public
        onlyRole(MINTER_ROLE)
    {
        for (uint256 i = 0; i < addresses.length; i++) {
            safeMint(addresses[i]);
        }
    }

    // The following functions are overrides required by Solidity.
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
