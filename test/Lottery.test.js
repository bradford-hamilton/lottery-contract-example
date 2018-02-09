const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
const provider = ganache.provider();

const web3 = new Web3(provider);
const { interface, bytecode } = require('../compile.js');

let accounts;
let lottery;

beforeEach(async () => {
  accounts = await web3.eth.getAccounts();
  lottery = await new web3.eth.Contract(JSON.parse(interface))
    .deploy({ data: bytecode })
    .send({ from: accounts[0], gas: '1000000' });

  lottery.setProvider(provider);
});

describe('Lottery contract', () => {
  it('deploys the contract', () => {
    assert.ok(lottery.options.address);
  });

  it('allows one account to enter', async () => {
    await lottery.methods.enterLottery()
      .send({
        from: accounts[0],
        value: web3.utils.toWei('0.02', 'ether'),
      });

    const players = await lottery.methods.getAllPlayers()
      .call({ from: accounts[0] });

    assert.equal(accounts[0], players[0]);
    assert.equal(1, players.length);
  });

  it('allows multiple account to enter', async () => {
    await lottery.methods.enterLottery()
      .send({
        from: accounts[0],
        value: web3.utils.toWei('0.02', 'ether'),
      });

    await lottery.methods.enterLottery()
      .send({
        from: accounts[1],
        value: web3.utils.toWei('0.02', 'ether'),
      });

    await lottery.methods.enterLottery()
      .send({
        from: accounts[2],
        value: web3.utils.toWei('0.02', 'ether'),
      });

    const players = await lottery.methods.getAllPlayers()
      .call({ from: accounts[0] });

    assert.equal(accounts[0], players[0]);
    assert.equal(accounts[1], players[1]);
    assert.equal(accounts[2], players[2]);
    assert.equal(3, players.length);
  });

  it('requires a minimum amount of ether to enter the lottery', async () => {
    try {
      await lottery.methods.enterLottery()
        .send({
          from: accounts[0],
          value: web3.utils.toWei('0.001', 'ether'),
        })

      assert(false);
    } catch (error) {
      assert(error);
    }
  });

  it('only allows the manager of the contract to call selectWinner', async () => {
    try {
      await lottery.methods.selectWinner()
        .send({ from: accounts[1] })

      assert(false)
    } catch (error) {
      assert(error);
    }
  });

  it('sends ether to the winner and resets the players array to empty', async () => {
    await lottery.methods.enterLottery()
      .send({
        from: accounts[0],
        value: web3.utils.toWei('1', 'ether'),
      });

    let playersArray = await lottery.methods.getAllPlayers().call({ from: accounts[0] })
    assert(playersArray.length === 1);

    const initialBalance = await web3.eth.getBalance(accounts[0]);
    await lottery.methods.selectWinner().send({ from: accounts[0] });
    const finalBalance = await web3.eth.getBalance(accounts[0]);
    const difference = finalBalance - initialBalance;

    assert(difference > web3.utils.toWei('0.95', 'ether'));

    playersArray = await lottery.methods.getAllPlayers().call({ from: accounts[0] })
    assert(playersArray.length === 0);
  });
});
