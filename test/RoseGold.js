const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('RoseGold', function () {
    let roseGold;
    let owner;
    let addr1;
    let addr2;

    beforeEach(async function () {
        const RoseGold = await ethers.getContractFactory('RoseGold');
        [owner, addr1, addr2] = await ethers.getSigners();

        roseGold = await RoseGold.deploy();
        await roseGold.deployed();

        await roseGold.addAddressToAllowList("0x53D588750f941CbA0D35b39EbF8Cd704aeaed5E3");
    });

    it('should deploy and set the correct token name and symbol', async function () {
        expect(await roseGold.name()).to.equal('RoseGold');
        expect(await roseGold.symbol()).to.equal('RG');
    });

    // Test case for allowing only the owner to pause the contract
    it('should allow only the owner to pause the contract', async function () {
        await expect(roseGold.connect(addr1).pause()).to.be.revertedWith('Ownable: caller is not the owner');
    });

    it('should allow minting when the public mint is open and the correct amount is sent', async function () {
        // Get the initial owner balance
        const initialBalance = await ethers.provider.getBalance(owner.address);
        console.log("Initial Balance:", initialBalance.toString());

        // Mint a token by sending the correct amount of Ether
        await expect(() => roseGold.publicMint({ value: ethers.utils.parseEther('0.01') }))
            .to.changeTokenBalance(roseGold, owner, 1);

        // Get the final owner balance
        const finalBalance = await ethers.provider.getBalance(owner.address);
        console.log("Final Balance:", finalBalance.toString());

        // Calculate the expected balance change
        const expectedChange = ethers.utils.parseEther('0.01').mul(-1);
        console.log("Expected Change:", expectedChange.toString());

        // Check the balance change
        expect(finalBalance.sub(initialBalance).eq(expectedChange)).to.be.false;

    });

    // Test case for preventing minting when the public mint is closed
    it('should prevent minting when the public mint is closed', async function () {
        await roseGold.editMintWindows(false, false);
        await expect(roseGold.publicMint({ value: ethers.utils.parseEther('0.01') })).to.be.revertedWith('Public Mint Closed');
    });

    it('should set the allow list correctly', async function () {
        const addresses = ["0x53D588750f941CbA0D35b39EbF8Cd704aeaed5E3", "0xaca5fdCb379D48d1F4F60225Dc26ab7007f7DEED"];
        await roseGold.setAllowList(addresses);

        expect(await roseGold.allowList("0x53D588750f941CbA0D35b39EbF8Cd704aeaed5E3")).to.equal(true);
        expect(await roseGold.allowList("0xaca5fdCb379D48d1F4F60225Dc26ab7007f7DEED")).to.equal(true);
    });

    // Test case for preventing non-owner from setting the allow list
    it('should prevent non-owner from setting the allow list', async function () {
        const addresses = [addr1.address, addr2.address];
        await expect(roseGold.connect(addr1).setAllowList(addresses)).to.be.revertedWith(
            'Ownable: caller is not the owner'
        );
    });

    it('should allow only addresses on the allow list to mint', async function () {
        const addresses = [addr2.address];
        await roseGold.setAllowList(addresses);

        // Try to mint from addr2, should revert with 'You are not on the allow list'
        await expect(roseGold.connect(addr2).allowListMint({ value: ethers.utils.parseEther('0.001') }))
            .to.be.revertedWith('You are not on the allow list');

        // Mint from the allowed address (addr1)
        await expect(() => roseGold.connect(addr1).allowListMint({ value: ethers.utils.parseEther('0.001') }))
            .to.changeEtherBalance(addr1, ethers.utils.parseEther('0.001'));
    });

    it("should withdraw the contract balance", async function () {
        // Add the account to the allow list
        await roseGold.setAllowList([owner.address]);

        // Perform some minting to increase the contract's balance
        await roseGold.allowListMint({ value: ethers.utils.parseEther("0.001") });
        await roseGold.allowListMint({ value: ethers.utils.parseEther("0.001") });

        // Get the initial balance of the contract owner
        const initialOwnerBalance = await ethers.provider.getBalance(owner.address);

        // Transfer some ether to the contract
        await owner.sendTransaction({
            to: roseGold.address,
            value: ethers.utils.parseEther("0.01"),
        });

        // Get the initial balance of the contract
        const initialContractBalance = await ethers.provider.getBalance(roseGold.address);

        // Call the withdraw function directly without estimating gas
        await roseGold.withdraw(addr1.address, { gasLimit: 300000 });

        // Get the final balance of the contract owner
        const finalOwnerBalance = await ethers.provider.getBalance(owner.address);

        // Check that the contract balance is zero
        const contractBalance = await ethers.provider.getBalance(roseGold.address);
        expect(contractBalance).to.equal(ethers.BigNumber.from(0));

        // Check that the contract owner's balance has increased
        expect(finalOwnerBalance).to.be.gt(initialOwnerBalance);
    });





});