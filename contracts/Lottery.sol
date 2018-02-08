pragma solidity ^0.4.17;

contract Lottery {
  address public manager;
  address[] public players;

  function Lottery() public {
    manager = msg.sender;
  }

  function enterLottery() public payable {
    require(msg.value > 0.01 ether);

    players.push(msg.sender);
  }

  function randomNumGenerator() private view returns (uint) {
    return uint(keccak256(block.difficulty, now, players));
  }

  function selectWinner() public restrictedToManager {
    uint index = randomNumGenerator() % players.length;
    players[index].transfer(this.balance);
    players = new address[](0);
  }

  modifier restrictedToManager() {
    require(msg.sender == manager);
    _;
  }

  function getAllPlayers() public view returns (address[]) {
    return players;
  }
}
