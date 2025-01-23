require('@nomiclabs/hardhat-ethers');

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  networks: {
    hardhat: {
      gas: "auto",
      mining: {
        interval: 2000, //ms
      },
    },
    localhost: {
      url: "http://127.0.0.1:8545", // Connect to local Hardhat node
    },
  },
  defaultNetwork: "localhost",
  solidity: {
    compilers: [
      {
        version: '0.8.24',
        settings: {
          optimizer: {
            enabled: true,
            runs: 10000,
          },
        },
      },
    ],
  },
};
