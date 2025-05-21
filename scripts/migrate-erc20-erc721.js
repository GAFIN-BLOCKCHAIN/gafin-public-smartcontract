const hre = require('hardhat');
const ethers = hre.ethers;
const { writeFileSync } = require("fs");
require('@openzeppelin/hardhat-upgrades');

const main = async () => {
    // Get network data from Hardhat config (see hardhat.config.js).
    const baseURI = 'ipfs://';
    const signer = '0x6eA155EC34c9E09Ac82C150f66feD996841B58fB';
    const networkName = network.name;
    // Check if the network is supported.
    console.log(`Deploying to ${networkName} network...`);

    const ERC721 = (
        await ethers.getContractFactory('Gafin721')
    )
    const gafin721 = await upgrades.deployProxy(ERC721, [baseURI, signer]);
    await gafin721.deployed();

    writeFileSync(
        `./deployments/${networkName}.json`,
        JSON.stringify(
            {
                ERC721: gafin721.address,
            },
            null,
            2
        )
    );
    console.log('gafin721', gafin721.address)
};

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
