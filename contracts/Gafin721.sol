// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";

contract Gafin721 is
    Initializable,
    ERC721BurnableUpgradeable,
    OwnableUpgradeable
{
    string private _baseURIExtended;
    address private _signer;

    event Minted(address recipient, uint256 tokenId);
    event BatchMinted(address[] recipients, uint256[] tokenIds);
    event BatchTransferredFrom(
        address from,
        address[] toArr,
        uint256[] tokenIdArr
    );

    function initialize(string memory baseURI, address signer)
        external
        initializer
    {
        __ERC721_init_unchained("Gafin721", "GAFIN721");
        __Ownable_init_unchained();

        _baseURIExtended = baseURI;
        _signer = signer;
    }

    function mintTo(
        uint256 tokenId,
        address recipient,
        bytes memory signature
    ) external {
        bytes32 messageHash = getMessageHash(tokenId, recipient);
        bytes32 ethSignedMessageHash = getEthSignedMessageHash(messageHash);

        require(
            recoverSigner(ethSignedMessageHash, signature) == _signer,
            "Incorrect signature"
        );

        _mint(recipient, tokenId);

        emit Minted(recipient, tokenId);
    }

    function batchMintTo(
        uint256[] calldata tokenIds,
        address[] calldata recipients,
        bytes memory signature
    ) external {
        require(tokenIds.length > 0, "Incorrect parameters");
        require(tokenIds.length == recipients.length, "Incorrect parameters");

        bytes32 messageHash = getMessageHash(tokenIds, recipients);
        bytes32 ethSignedMessageHash = getEthSignedMessageHash(messageHash);

        require(
            recoverSigner(ethSignedMessageHash, signature) == _signer,
            "Incorrect signature"
        );

        for (uint16 i = 0; i < tokenIds.length; i++) {
            _mint(recipients[i], tokenIds[i]);
        }

        emit BatchMinted(recipients, tokenIds);
    }

    function batchTransferFrom(
        address sender,
        address[] calldata recipients,
        uint256[] calldata tokenIds
    ) external {
        require(recipients.length > 0, "Incorrect parameters");
        require(recipients.length == tokenIds.length, "Incorrect parameters");

        for (uint16 i = 0; i < recipients.length; i++) {
            transferFrom(sender, recipients[i], tokenIds[i]);
        }

        emit BatchTransferredFrom(sender, recipients, tokenIds);
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return _baseURIExtended;
    }

    function setBaseURI(string memory baseURI) external onlyOwner {
        _baseURIExtended = baseURI;
    }

    function setSigner(address signer) external onlyOwner {
        _signer = signer;
    }

    function getMessageHash(uint256 tokenId, address recipient)
        internal
        pure
        returns (bytes32)
    {
        return keccak256(abi.encodePacked(tokenId, recipient));
    }

    function getMessageHash(
        uint256[] calldata tokenIds,
        address[] calldata recipients
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(tokenIds, recipients));
    }

    function getEthSignedMessageHash(bytes32 _messageHash)
        internal
        pure
        returns (bytes32)
    {
        return
            keccak256(
                abi.encodePacked(
                    "\x19Ethereum Signed Message:\n32",
                    _messageHash
                )
            );
    }

    function recoverSigner(
        bytes32 _ethSignedMessageHash,
        bytes memory _signature
    ) internal pure returns (address) {
        (bytes32 r, bytes32 s, uint8 v) = splitSignature(_signature);

        return ecrecover(_ethSignedMessageHash, v, r, s);
    }

    function splitSignature(bytes memory sig)
        internal
        pure
        returns (
            bytes32 r,
            bytes32 s,
            uint8 v
        )
    {
        require(sig.length == 65, "invalid signature length");

        assembly {
            /*
            First 32 bytes stores the length of the signature

            add(sig, 32) = pointer of sig + 32
            effectively, skips first 32 bytes of signature

            mload(p) loads next 32 bytes starting at the memory address p into memory
            */

            // first 32 bytes, after the length prefix
            r := mload(add(sig, 32))
            // second 32 bytes
            s := mload(add(sig, 64))
            // final byte (first byte of the next 32 bytes)
            v := byte(0, mload(add(sig, 96)))
        }

        // implicitly return (r, s, v)
    }
}
