pragma solidity >=0.5.0 <0.7.0;

import "./SponsorWhitelistControl.sol";

contract Coin {
    address public minter;
    mapping (address => uint) private balances;

    SponsorWhitelistControl constant private SPONSOR = SponsorWhitelistControl(address(0x0888000000000000000000000000000000000001));

    event Sent(address from, address to, uint amount);

    constructor() public {
        minter = msg.sender;
    }

    function mint(address receiver, uint amount) public {
        require(msg.sender == minter);
        require(amount < 1e60);
        balances[receiver] += amount;
    }

    function send(address receiver, uint amount) public {
        require(amount <= balances[msg.sender], "Insufficient balance.");
        balances[msg.sender] -= amount;
        balances[receiver] += amount;
        emit Sent(msg.sender, receiver, amount);
    }
    
    function balanceOf(address tokenOwner) public view returns(uint balance){
      return balances[tokenOwner];
    }

    function addPrivilege(address account) public payable {
        address[] memory a = new address[](1);
        a[0] = account;
        SPONSOR.addPrivilege(a);
    }

    function removePrivilege(address account) public payable {
        address[] memory a = new address[](1);
        a[0] = account;
        SPONSOR.removePrivilege(a);
    }
}