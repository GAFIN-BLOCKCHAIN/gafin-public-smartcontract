const chai = require('chai');
const { solidity } = require('ethereum-waffle');

chai.use(solidity);
const expect = chai.expect;

// https://ethereum-waffle.readthedocs.io/en/latest/matchers.html
describe('Gafin721', () => {
  let Gafin721;
  let gafin721;
  let owner, signer, user1, user2, user3, user4, user5;

  const baseURI = 'ipfs://';
  const allocation = 5;

  const generateAccounts = (owner, quantity) => {
    const ret = [];

    for (let i = 0; i < quantity; i++) {
      const privateKey = web3.eth.accounts.create().privateKey;
      const signer = new ethers.Wallet(privateKey, ethers.provider);

      owner.sendTransaction({
        to: signer.address,
        value: web3.utils.toWei('10'),
      });

      signer.privateKey = privateKey;

      ret.push(signer);
    }

    return ret;
  };

  beforeEach(async () => {
    [owner, user1, user2, user3, user4] = await ethers.getSigners();
    [signer, user5] = generateAccounts(owner, 2);

    Gafin721 = await ethers.getContractFactory('Gafin721');
    gafin721 = await upgrades.deployProxy(Gafin721, [baseURI, signer.address]);
    await gafin721.deployed();
  });

  it('works', async () => {
    let tokenId = 0;
    let hash, sig;

    tokenId++;
    hash = ethers.utils.solidityKeccak256(
      ['uint256', 'address'],
      [tokenId, user1.address]
    );
    sig = web3.eth.accounts.sign(hash, signer.privateKey);
    await gafin721
      .connect(user1)
      ['mintTo(uint256,address,bytes)'](tokenId, user1.address, sig.signature);
    expect(await gafin721.ownerOf(tokenId)).to.equal(user1.address);

    await expect(
      gafin721.connect(user1).mintTo(tokenId, user1.address, sig.signature)
    ).to.be.revertedWith('ERC721: token already minted');

    tokenId++;
    tokenId++;
    hash = ethers.utils.solidityKeccak256(
      ['uint256', 'address'],
      [tokenId, user1.address]
    );
    sig = web3.eth.accounts.sign(hash, user5.privateKey);
    await expect(
      gafin721.connect(user1).mintTo(tokenId, user1.address, sig.signature)
    ).to.be.revertedWith('Incorrect signature');

    hash = ethers.utils.solidityKeccak256(
      ['uint256', 'address'],
      [tokenId, user1.address]
    );
    sig = web3.eth.accounts.sign(hash, signer.privateKey);
    await gafin721.connect(user1).mintTo(tokenId, user1.address, sig.signature);
    expect(await gafin721.ownerOf(tokenId)).to.equal(user1.address);
    await expect(gafin721.ownerOf(tokenId - 1)).to.be.revertedWith(
      'ERC721: invalid token ID'
    );

    await gafin721
      .connect(user1)
      ['safeTransferFrom(address,address,uint256)'](
        user1.address,
        user3.address,
        tokenId
      );
    expect(await gafin721.ownerOf(tokenId)).to.equal(user3.address);

    tokenId++;
    tokenId++;
    hash = ethers.utils.solidityKeccak256(
      ['uint256[]', 'address[]'],
      [
        [tokenId - 1, tokenId],
        [user2.address, user2.address],
      ]
    );
    sig = web3.eth.accounts.sign(hash, signer.privateKey);
    await gafin721
      .connect(user2)
      .batchMintTo(
        [tokenId - 1, tokenId],
        [user2.address, user2.address],
        sig.signature
      );
    expect(await gafin721.ownerOf(tokenId)).to.equal(user2.address);

    await gafin721
      .connect(user2)
      .batchTransferFrom(
        user2.address,
        [user3.address, user4.address],
        [tokenId - 1, tokenId]
      );
    expect(await gafin721.ownerOf(tokenId - 1)).to.equal(user3.address);
    expect(await gafin721.ownerOf(tokenId)).to.equal(user4.address);

    await expect(gafin721.connect(user3).burn(tokenId)).to.be.revertedWith(
      'ERC721: caller is not token owner nor approved'
    );

    await gafin721.connect(user4).burn(tokenId);
    await expect(gafin721.ownerOf(tokenId)).to.be.revertedWith(
      'ERC721: invalid token ID'
    );
  });
});
