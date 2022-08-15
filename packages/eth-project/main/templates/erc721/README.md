# How to mint your own NFT(ERC-721) on any mainnet and testnet using Black IDE

> This tutorial teaches you to deploy your own ERC721 token on ETH Rinkeby testnet.
> The steps to deploy on the mainnet are identical and the differences are mentioned in the tutorial.


![process](https://ide-assets.oss-cn-hangzhou.aliyuncs.com/erc721/v2/ERC721_readme_process.png)

## Contents
1. Getting images ready to be uploaded to decentralized storage.
2. Getting metadata ready to be uploaded to decentralized storage.
3. Deploy a contract for your NFT ****in Black IDE
4. Check the NFT on the Opensea testnet.

## Getting images ready to be uploaded to decentralized storage

> In order to create NFT we first need to have the image/video content hosted on a decentralized storage solution like IPFS. IPFS in itself won't be enough because if you host it on IPFS and garbage collection takes place your assets will be gone and the NFT will not show your image/video.
> Here is a brief description of each element we use throughout the process.

**For this we need a pinning service like Pinata. So you can make an account on Pinata here.**

Here I have a single image named “Black IDE Icon” .

![process](https://ide-assets.oss-cn-hangzhou.aliyuncs.com/erc721/v2/logo.png)

Login Pinata. On the dashboard you should see an upload button.

![pinata-upload-button](https://ide-assets.oss-cn-hangzhou.aliyuncs.com/erc721/v2/pinata-upload-button.png)

Select a file from your computer and then upload it. You could change the file name if you want to. In this case, I am going to keep the original file name.

![pinata-upload-select](https://ide-assets.oss-cn-hangzhou.aliyuncs.com/erc721/v2/pinata-upload-select.png)

Once done you should see the file as shown in the image below.

![pinata-upload](https://ide-assets.oss-cn-hangzhou.aliyuncs.com/erc721/v2/pinata-upload.png)

So now we have the baseURI for the assets to get any asset all we need to do is append the tokenID and extension to the baseURI.

## Getting metadata ready to be uploaded to decentralized storage
> Now that we have the baseURI for assets we need to prepare the metadata that the marketplaces parse in order to extract attributes and artwork from it.

The content of metadata files is expected to be in .json format. 

Here is the metadata format expected by marketplaces like OpenSea. You could copy the following code and paste it in notepad, VS code, or text editor of your choice, and edit the attributes as needed. Make sure to save this file in .json format.

```JSON
{
	"name": "Black IDE Icon",
	"description": "Black IDE's Logo",
	"image": "https://gateway.pinata.cloud/ipfs/Qmcq6QsxTCDn1oUHqXbty73yUwEVbFxt1ba6CNtTdvv32i",
	"attributes": [
			{
				"trait_type": "Category",
				"value": "Ethereum IDE"
			},
			{
				"trait_type": "Rank",
				"value": "No.1"
			}
	],
}
```

Attribute：
- name - specify the name of the NFT.
- image - specify the URL where the assets for the NFT are hosted. This is the same URL I have given above. Make sure to include the complete URL including the tokenID and extension part.
- description - specify some description about the entire NFT collection.
- attributes - specify the attributes of the NFT. These attributes will be displayed under your NFT on OpenSea. You could custom value and the amount of attributes groups. Please notice the format to specify the attributes.

Upload this .json file to Pinata in the same way as before.
![pinata-metadata](https://ide-assets.oss-cn-hangzhou.aliyuncs.com/erc721/v2/pinata-metadata.png)

## Deploy a contract for your NFT in Black IDE
> Let's create an ERC721 token project using built-in template in Black IDE.
Before we start, please make sure to have a MetaMask account and it's connected with Black IDE.

Click the New button, Enter the project name, select the ERC-721 template, and then click the Create Project button to create a new Project.

![create-project](https://ide-assets.oss-cn-hangzhou.aliyuncs.com/erc721/v2/create-project.png)

Open the “Gameltem.sol” in the “Contracts” folder to make changes or additions to the code (This step is not necessary, and for beginners we recommend not making changes to the code.）

![contract-file](https://ide-assets.oss-cn-hangzhou.aliyuncs.com/erc721/v2/contract-file.png)

Choose a network you prefer to use and click it to connect. (the following steps will base on the Rinkeby TestNet)

![switch-network](https://ide-assets.oss-cn-hangzhou.aliyuncs.com/erc721/v2/switch-network.png)

The following steps will involve paying gas fee. In case you don't possess Rinkeby TestNet ETH, you could always pick it up through a built-in faucet portal on the Black IDE.
1. Click on the "Explorer" button on the Tab to open the Explorer page.
2. Click on the "Faucet" button to open the Rinkeby TestNet ETH claim page for claiming.

![facuet](https://ide-assets.oss-cn-hangzhou.aliyuncs.com/erc721/v2/facuet.png)

Click the "Build" button to compile the contract.

![compile](https://ide-assets.oss-cn-hangzhou.aliyuncs.com/erc721/v2/compile.png)

Once it is done building, click the "Deploy" button to open the deploy window.

![deploy](https://ide-assets.oss-cn-hangzhou.aliyuncs.com/erc721/v2/deploy.png)

1. Select ”GameItem.json” in the contract selection field.
2. Select the MetaMask address you logged into in the Signer field.
3. Click the "Estimate & Deploy" button to estimate Gas limit.

![deploy-params](https://ide-assets.oss-cn-hangzhou.aliyuncs.com/erc721/v2/deploy-params.png)

Click the "Deploy" button and sign the MetaMask popup to deploy the contract.

![ready-deploy](https://ide-assets.oss-cn-hangzhou.aliyuncs.com/erc721/v2/ready-deploy.png)

When the status changes to "CONFIRMED", click on the contract address to open this contract in Black IDE. The three columns of contract page are meant for you to Write, Examine, and Check History of the current contract.

![contract-inspector](https://ide-assets.oss-cn-hangzhou.aliyuncs.com/erc721/v2/contract-inspector.png)

Select the "awardItem" function in the first column.

![contract-execute](https://ide-assets.oss-cn-hangzhou.aliyuncs.com/erc721/v2/contract-excute.png)

1. Select the address which you want the NFT item to be accepted in the “player”.（Choosing your own MetaMask account is recommended.）
2. Select your MetaMask address in “Signer”, the address will be deducted gas fee.

![contract-params](https://ide-assets.oss-cn-hangzhou.aliyuncs.com/erc721/v2/contract-params.png)

Back to Pinata, https://app.pinata.cloud/.

Click on the metadata file‘s name and copy the URI of this file to your clipboard.

![pinata-metadata](https://ide-assets.oss-cn-hangzhou.aliyuncs.com/erc721/v2/pinata-metadata.png)

![pinata-ipfs-uri](https://ide-assets.oss-cn-hangzhou.aliyuncs.com/erc721/v2/pinata-ipfs-uri.png)

Then paste the URI of the metadata into the "tokenURI" box.

![tokenrui](https://ide-assets.oss-cn-hangzhou.aliyuncs.com/erc721/v2/fill-tokenuri.png)

Click the "Start" button and sign the MetaMask pop-up to deploy the contract. After the successful deployment popup, the deployment is completed.

![tokenrui](https://ide-assets.oss-cn-hangzhou.aliyuncs.com/erc721/v2/mint-execute.png)

Congratulations! Now your NFT is successfully minted and transferred to your account. Let’s check it out.

## Check the NFT on the Opensea testnet
> You can check the NFT on the Opensea testnet or explorer.

Open the Opensea Testnet page: https://testnets.opensea.io/ , and link to the Player's MetaMask account which filled in the contract page.

Click on your avatar, and then click the Profile button to view the list of NFT's in your account.

![opensea](https://ide-assets.oss-cn-hangzhou.aliyuncs.com/erc721/v2/opensea.png)

Click on your NFT which using Black IDE to mint and see more information.

![nft-information](https://ide-assets.oss-cn-hangzhou.aliyuncs.com/erc721/v2/nft-information.png)

Now you are ready to mint more NFTs on Black IDE. Have fun!

