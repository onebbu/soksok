'use strict';

const fs = require('fs');
const path = require('path');

// 1. connection profile을 객체화
exports.buildCCPOrg1 = () => {
    const ccpPath = path.resolve(__dirname, '..', 'config', 'connection-org1.json');
    const fileExists = fs.existsSync(ccpPath);
    if(!fileExists) {
        throw new Error(`no such file or directory: ${ccpPath}`);
    }

    const contents = fs.readFileSync(ccpPath, 'utf8');

    const ccp = JSON.parse(contents);

    console.log(`Loaded the network configuration located at ${ccpPath}`);

    return ccp;
};

exports.buildCCPOrg2 = () => {
	// load the common connection configuration file
	const ccpPath = path.resolve(__dirname, 'connection-org2.json');
	const fileExists = fs.existsSync(ccpPath);
	if (!fileExists) {
		throw new Error(`no such file or directory: ${ccpPath}`);
	}
	const contents = fs.readFileSync(ccpPath, 'utf8');

	// build a JSON object from the file contents
	const ccp = JSON.parse(contents);

	console.log(`Loaded the network configuration located at ${ccpPath}`);
	return ccp;
};

// 2. wallet 디렉토리를 객체화

exports.buildWallet = async (Wallets, walletPath) => {
    let wallet;
    if(walletPath) {
        wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Built a file system wallet at ${walletPath}`);
    } else {
        wallet = await Wallets.newInMemoryWallet();
        console.log('built an in memory wallet');
    }

    return wallet;
};