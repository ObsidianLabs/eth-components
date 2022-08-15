# ERC-20 TOKEN

The ERC20 token contract tracks alternative tokens: any one token is fully equivalent to any other token; no token has special rights or behaviours associated with it. This allows ERC20 tokens to be used as a medium of **exchange for currency**, **voting rights**, **staking**, etc.

*For more information, please refer to:* [https://docs.openzeppelin.com/contracts/4.x/api/token/erc20#IERC20-balanceOf-address-](https://docs.openzeppelin.com/contracts/4.x/api/token/erc20#IERC20-balanceOf-address-)

# About this sample project

This project is a sample project for the ERC-20 which contains the following elements and functions：

## **IERC20**

### Functions

- [totalSupply()](https://docs.openzeppelin.com/contracts/4.x/api/token/erc20#IERC20-totalSupply--): Returns the amount of tokens in existence.
- [balanceOf(account)](https://docs.openzeppelin.com/contracts/4.x/api/token/erc20#IERC20-balanceOf-address-): Returns the amount of tokens owned by `account`.
- [transfer(to, amount)](https://docs.openzeppelin.com/contracts/4.x/api/token/erc20#IERC20-transfer-address-uint256-): Moves `amount` tokens from the caller’s account to `to`.
- [allowance(owner, spender)](https://docs.openzeppelin.com/contracts/4.x/api/token/erc20#IERC20-allowance-address-address-): Returns the remaining number of tokens that `spender` will be allowed to spend on behalf of `owner` through [transferFrom](https://docs.openzeppelin.com/contracts/4.x/api/token/erc20#IERC20-transferFrom-address-address-uint256-).
- [approve(spender, amount)](https://docs.openzeppelin.com/contracts/4.x/api/token/erc20#IERC20-approve-address-uint256-): Sets `amount` as the allowance of `spender` over the caller’s tokens.
- [transferFrom(from, to, amount)](https://docs.openzeppelin.com/contracts/4.x/api/token/erc20#IERC20-transferFrom-address-address-uint256-): Moves `amount` tokens from `from` to `to` using the allowance mechanism. `amount` is then deducted from the caller’s allowance.
- [Transfer(from, to, value)](https://docs.openzeppelin.com/contracts/4.x/api/token/erc20#IERC20-Transfer-address-address-uint256-): Emitted when `value` tokens are moved from one account (`from`) to another (`to`).
- [Approval(owner, spender, value)](https://docs.openzeppelin.com/contracts/4.x/api/token/erc20#IERC20-Approval-address-address-uint256-): Emitted when the allowance of a `spender` for an `owner` is set by a call to [approve](https://docs.openzeppelin.com/contracts/4.x/api/token/erc20#IERC20-approve-address-uint256-). `value` is the new allowance.

## **IERC20Metadata**

### Functions(Extra functions based on **IERC20)**

- [name()](https://docs.openzeppelin.com/contracts/4.x/api/token/erc20#IERC20Metadata-name--): Returns the name of the token.
- [symbol()](https://docs.openzeppelin.com/contracts/4.x/api/token/erc20#IERC20Metadata-symbol--): Returns the symbol of the token.
- [decimals()](https://docs.openzeppelin.com/contracts/4.x/api/token/erc20#IERC20Metadata-decimals--): Returns the decimals places of the token.

## **ERC20**

### Functions(Extra functions based on **IERC20)**

- [constructor(name_, symbol_)](https://docs.openzeppelin.com/contracts/4.x/api/token/erc20#ERC20-constructor-string-string-): Sets the values for [name](https://docs.openzeppelin.com/contracts/4.x/api/token/erc20#ERC20-name--) and [symbol](https://docs.openzeppelin.com/contracts/4.x/api/token/erc20#ERC20-symbol--).
- [name()](https://docs.openzeppelin.com/contracts/4.x/api/token/erc20#ERC20-name--): Returns the name of the token.
- [symbol()](https://docs.openzeppelin.com/contracts/4.x/api/token/erc20#ERC20-symbol--): Returns the symbol of the token, usually a shorter version of the name.
- [decimals()](https://docs.openzeppelin.com/contracts/4.x/api/token/erc20#ERC20-decimals--): Returns the number of decimals used to get its user representation.
- [increaseAllowance(spender, addedValue)](https://docs.openzeppelin.com/contracts/4.x/api/token/erc20#ERC20-increaseAllowance-address-uint256-): Atomically increases the allowance granted to `spender` by the caller.
- [decreaseAllowance(spender, subtractedValue)](https://docs.openzeppelin.com/contracts/4.x/api/token/erc20#ERC20-decreaseAllowance-address-uint256-): Atomically decreases the allowance granted to `spender` by the caller.
- [_transfer(from, to, amount)](https://docs.openzeppelin.com/contracts/4.x/api/token/erc20#ERC20-_transfer-address-address-uint256-): Moves `amount` of tokens from `from` to `to`.
- [_mint(account, amount)](https://docs.openzeppelin.com/contracts/4.x/api/token/erc20#ERC20-_mint-address-uint256-): Creates `amount` tokens and assigns them to `account`, increasing the total supply.
- [_burn(account, amount)](https://docs.openzeppelin.com/contracts/4.x/api/token/erc20#ERC20-_burn-address-uint256-): Destroys `amount` tokens from `account`, reducing the total supply.
- [_approve(owner, spender, amount)](https://docs.openzeppelin.com/contracts/4.x/api/token/erc20#ERC20-_approve-address-address-uint256-): Sets `amount` as the allowance of `spender` over the `owner` s tokens.
- [_spendAllowance(owner, spender, amount)](https://docs.openzeppelin.com/contracts/4.x/api/token/erc20#ERC20-_spendAllowance-address-address-uint256-): Updates `owner` s allowance for `spender` based on spent `amount`.
- [_beforeTokenTransfer(from, to, amount)](https://docs.openzeppelin.com/contracts/4.x/api/token/erc20#ERC20-_beforeTokenTransfer-address-address-uint256-): Hook that is called before any transfer of tokens. This includes minting and burning.
- [_afterTokenTransfer(from, to, amount)](https://docs.openzeppelin.com/contracts/4.x/api/token/erc20#ERC20-_afterTokenTransfer-address-address-uint256-): Hook that is called after any transfer of tokens. This includes minting and burning.

*For more information, please refer to:* [https://docs.openzeppelin.com/contracts/4.x/api/token/erc20#IERC20-balanceOf-address-](https://docs.openzeppelin.com/contracts/4.x/api/token/erc20#IERC20-balanceOf-address-)

# Preset information for this example project

## Location of source code files for this sample project

https://ide.black/UserName/ProjectName/contracts

## Location of the files that have been built for this example project

https://ide.black/UserName/ProjectName/build/contracts

## The network deployed for this example project contract

The project contract is preset to be deployed in BNB Chain and users can choose the target network for deployment through the Network menu located in the top function bar.

# Other operations

## 1. How to switch networks

Users can select the network to which the contract is to be deployed through the Network Selection menu located in the top function bar.

![switch-network](https://ide-assets.oss-cn-hangzhou.aliyuncs.com/erc20/%E6%88%AA%E5%B1%8F2022-06-23_10.55.49.png)

Black IDE now supports the following 10 blockchain networks Including mainnets and testnets.

1. Ethereum
2. BNB Chain
3. Avalanche C-Chain
4. Polygon
5. Fantom
6. Harmony
7. Conflux Espace
8. Gnosis (XDAI)
9. Aurora (Near)
10. Evmos 

Black IDE also supports custom networks.

## 2. How to build projects

When the user finishes developing the code, click the "Build" button on the left side of the function bar to compile, and the compiled output file will be displayed in the left side file directory.

![build-project](https://ide-assets.oss-cn-hangzhou.aliyuncs.com/erc20/%E6%88%AA%E5%B1%8F2022-06-23_10.51.07.png)

## 3. How to deploy contracts

When the user finishes compiling the code, click the "Deploy" button in the left column and fill in the information in the Deploy Contract window to deploy the contract.

![截屏2022-06-23 10.52.24.png](https://ide-assets.oss-cn-hangzhou.aliyuncs.com/erc20/%E6%88%AA%E5%B1%8F2022-06-23_10.52.24.png)

## 4. How to commission the deployed contract using the contract inspector

After users successfully deploy the contract, click the "Contract" button in the top function bar to jump to the contract commission page and enter the contract address in the address input field or open the ABI file to commission the contract.

![contract-inspector](https://ide-assets.oss-cn-hangzhou.aliyuncs.com/erc20/%E6%88%AA%E5%B1%8F2022-06-23_10.53.23.png)

## 5. How to use the block browser

Users can click the "Explorer" button in the top function bar to jump to the contract block browser page, enter the wallet address in the address input field to check the balance, transfer records, or make transfers.

![block-browser](https://ide-assets.oss-cn-hangzhou.aliyuncs.com/erc20/%E6%88%AA%E5%B1%8F2022-06-23_10.54.12.png)

## 6. How to use the ABI Storage function

Users can click the "ABI Storage" button at the bottom of the function bar and then create a new ABI for contract commission:

![abi-storage](https://ide-assets.oss-cn-hangzhou.aliyuncs.com/erc20/%E6%88%AA%E5%B1%8F2022-06-23_10.57.41.png)

## 7. How to use the RPC Client function

Users can open the RPC Client window by clicking the "Network Tools" button in the bottom function bar and then clicking the "RPC Client" button in the menu. The "RPC Client" tool supports all API interfaces of "ETH" compliant networks, and you can view the actual feedback results of all APIs that interact with the underlying blockchain.

![rpc-client](https://ide-assets.oss-cn-hangzhou.aliyuncs.com/erc20/%E6%88%AA%E5%B1%8F2022-06-23_11.01.23.png)

## 8. How to use the Transactions function

Users can click on the "Transactions" button at the bottom of the function bar to view all transactions made through Black IDE and their details.

![transactions-history](https://ide-assets.oss-cn-hangzhou.aliyuncs.com/erc20/%E6%88%AA%E5%B1%8F2022-06-23_11.02.12.png)