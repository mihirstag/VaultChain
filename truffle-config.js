module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*", // Match any network id
      gas: 6721975,
      gasPrice: 2000000000, // 2 gwei
    },
  },

  mocha: {
    timeout: 40000,
  },

  compilers: {
    solc: {
      version: "0.8.20",
      settings: {
        evmVersion: "paris",
        optimizer: {
          enabled: false,
          runs: 200,
        },
      },
    },
  },
};
