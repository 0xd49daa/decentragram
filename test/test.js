import Web3 from 'web3';

const web3 = new Web3(Web3.givenProvider);

const Decentragram = artifacts.require('./Decentragram.sol');

require('chai').use(require('chai-as-promised')).should();

contract('Decentragram', ([deployer, author, tipper]) => {
	let decentragram;

	before(async () => {
		decentragram = await Decentragram.deployed();
	});

	describe('deployment', async () => {
		it('deploys successfully', async () => {
			const address = await decentragram.address;
			assert.notEqual(address, 0x0);
			assert.notEqual(address, '');
			assert.notEqual(address, null);
			assert.notEqual(address, undefined);
		});

		it('has a name', async () => {
			const name = await decentragram.name();
			assert.equal(name, 'Decentragram');
		});
	});

	describe('images', async () => {
		let result;
		let imageCount;

		const hash = 'abc123';

		before(async () => {
			result = await decentragram.uploadImage(hash, 'Description', /* meta data */ {
				from: author,
			});
			imageCount = await decentragram.imageCount();
		});

		it('create images', async () => {
			assert.equal(imageCount, 1);

			const event = result.logs[0].args;

			assert.equal(event.id.toNumber(), imageCount.toNumber(), 'id is correct');
			assert.equal(event.hash, hash, 'hash is correct');
			assert.equal(event.description, 'Description', 'description is correct');
			assert.equal(event.tipAmount, '0', 'tip amount is correct');
			assert.equal(event.author, author, 'author is correct');

			// failure
			await decentragram.uploadImage('', 'Description', /* meta data */ {
				from: author
			}).should.be.rejected;

			await decentragram.uploadImage(hash, '', /* meta data */ {
				from: author
			}).should.be.rejected;
		});

		it('lists images', async () => {
		  const image = await decentragram.images(imageCount);

          assert.equal(image.id.toNumber(), imageCount.toNumber(), 'id is correct');
          assert.equal(image.hash, hash, 'hash is correct');
          assert.equal(image.description, 'Description', 'description is correct');
          assert.equal(image.tipAmount, '0', 'tip amount is correct');
          assert.equal(image.author, author, 'author is correct');
        });

		it('allow users to tip images', async () => {
		  let oldAuthorBalance;

		  oldAuthorBalance = await web3.eth.getBalance(author);
		  oldAuthorBalance = new web3.utils.BN(oldAuthorBalance);

		  result = await decentragram.tipImageOwner(imageCount, { from: tipper, value: web3.utils.toWei('1', 'Ether')});

          const event = result.logs[0].args;

          assert.equal(event.id.toNumber(), imageCount.toNumber(), 'id is correct');
          assert.equal(event.hash, hash, 'hash is correct');
          assert.equal(event.description, 'Description', 'description is correct');
          assert.equal(event.tipAmount, web3.utils.toWei('1', 'Ether'), 'tip amount is correct');
          assert.equal(event.author, author, 'author is correct');

          let newAuthorBalance;

          newAuthorBalance = await web3.eth.getBalance(author);
          newAuthorBalance = new web3.utils.BN(newAuthorBalance);

          let tip;
          tip = web3.utils.toWei('1', 'Ether');
          tip = new web3.utils.BN(tip);

          const expectedBalance = oldAuthorBalance.add(tip);

          assert.equal(newAuthorBalance.toString(), expectedBalance.toString());

          // failure for non-existing id
          await decentragram.tipImageOwner(99, { from: tipper, value: web3.utils.toWei('1', 'Ether')}).should.be.rejected;
        })
	});
});
