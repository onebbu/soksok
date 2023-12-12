'use strict';

// 모듈포함
// express, fabric-ca-client, fabric-network
var express = require('express');

const { Gateway, Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const fs = require('fs');

// lib/APPUtil.js, CAUtils.js
const { buildCAClient, enrollAdmin, registerAndEnrollUser } = require('./lib/CAUtils.js');
const { buildCCPOrg1, buildWallet } = require('./lib/APPUtils.js');

// connection profile 빌드
const ccp = buildCCPOrg1();

// 서버설정 - 미들웨어(static, body-parser), app객체
var app = express();
app.use('/public', express.static( path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({extended: true}));

// constant 설정 - 채널명, 체인코드명, 월렛경로, 연결할 기관 ID
const mspOrg = 'Org1MSP';
const walletPath = path.join(__dirname, 'wallet');
const channelName = 'companychannel';
const chaincodeName = 'exp';

// HTML 라우팅 '/' GET index_theme.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index_theme.html'));
})
// admin 페이지
app.get('/wallet', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'wallet.html'));
})
// campaign register 페이지
app.get('/registerexp', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'exp-register.html'));
})
// campaign query 페이지
app.get('/queryexp', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'exp-query.html'));
})

// REST 라우팅
// /admin, POST 라우팅 - 관리자 인증서 생성
app.post('/admin', async(req, res) => {
    var aid = req.body.adminid;
    var apw = req.body.adminpw;

    console.log('/admin POST - ', aid, apw);

    try {
        const caClient = buildCAClient(FabricCAServices, ccp, 'ca.org1.example.com');
        const wallet = await buildWallet(Wallets, walletPath);
        await enrollAdmin(caClient, wallet, mspOrg, aid, apw);

        var rObj = {};
        rObj.result = "success";
        rObj.message = "An admin id is created";
        res.status(200).json(rObj);

    } catch (error) {
        console.log(error);
        var rObj = {};
        rObj.result = "fail";
        rObj.error = error.message;
        res.status(200).json(rObj);
    }
})

// /user, POST 라우팅 - 사용자 인증서 생성
app.post('/user', async(req, res) => {
    var uid = req.body.userid;
    var affiliation = req.body.affiliation;

    console.log('/user POST - ', uid, affiliation);
    try {
        const caClient = buildCAClient(FabricCAServices, ccp, 'ca.org1.example.com');
        const wallet = await buildWallet(Wallets, walletPath);
        await registerAndEnrollUser(caClient, wallet, mspOrg, uid, affiliation);

        var rObj = {};
        rObj.result = "success";
        rObj.message = `An user id is created - ${uid}`;
        res.status(200).json(rObj);
    } catch (error) {
        console.log(error);
        var rObj = {};
        rObj.result = "fail";
        rObj.error = error.message;
        res.status(200).json(rObj);
    }
});

// 1. '/campaign' POST          - RegisterEXP
app.post('/campaign', async(req, res) => {
    var cert = req.body.r_cert;
    var cid = req.body.r_cid;
    var did = req.body.r_did;

    console.log("/campaign POST : ", cert, cid, did);

    const wallet = await buildWallet(Wallets, walletPath);
    const gateway = new Gateway();

    try {
        await gateway.connect(ccp, {
            wallet,
            identity: cert,
            discovery: { enabled: true, asLocalhost: true }
        });

        const network = await gateway.getNetwork(channelName);
        const contract = await network.getContract(chaincodeName);

        await contract.submitTransaction('RegisterEXP', cid, did);
        
        //성공응답
        var rObj = {};
        rObj.result = "success";
        rObj.message = "tx has been submitted";
        res.json(rObj);
    } catch (error) {
        //실패응답
        console.log(error.message);
        var rObj = {};
        rObj.result = "fail";
        rObj.error = error.message;
        res.json(rObj);

    } finally {
        gateway.disconnect();
    }
});

// 2. '/campaign' GET           - QueryEXP
app.get('/campaign', async(req, res) => {
    var cert = req.query.q_cert;
    var cid = req.query.q_cid;

    console.log("/campaign GET : ", cert, cid);

    const wallet = await buildWallet(Wallets, walletPath);
    const gateway = new Gateway();

    try {
        await gateway.connect(ccp, {
            wallet,
            identity: cert,
            discovery: { enabled: true, asLocalhost: true }
        });

        const network = await gateway.getNetwork(channelName);
        const contract = await network.getContract(chaincodeName);

        let result = await contract.evaluateTransaction('Readexp', cid);
        var parsed_data = JSON.parse(result);
        console.log(parsed_data)
        //성공응답
        var rObj = {};
        rObj.result = "success";
        rObj.message = parsed_data;
        res.json(rObj);

    } catch (error) {
        //실패응답
        console.log(error.message);
        var rObj = {};
        rObj.result = "fail";
        rObj.error = error.message;
        res.json(rObj);

    } finally {
        gateway.disconnect();
    }
});
// 3 '/donate/:cid' PUT         - ConfirmEXP

// 4 '/campaign/history' GET    - QueryEXPHistory
app.get('/campaign/history', async(req, res) => {
    var cert = req.query.h_cert;
    var id = req.query.h_id;

    console.log("/campaign/history GET : ", cert, id);

    const wallet = await buildWallet(Wallets, walletPath);
    const gateway = new Gateway();

    try {
        await gateway.connect(ccp, {
            wallet,
            identity: cert,
            discovery: { enabled: true, asLocalhost: true }
        });

        const network = await gateway.getNetwork(channelName);
        const contract = await network.getContract(chaincodeName);

        let result = await contract.evaluateTransaction('GetEXPHistory', id);
        var parsed_data = JSON.parse(result);
        console.log(parsed_data)
        //성공응답
        var rObj = {};
        rObj.result = "success";
        rObj.message = parsed_data;
        res.json(rObj);

    } catch (error) {
        //실패응답
        console.log(error.message);
        var rObj = {};
        rObj.result = "fail";
        rObj.error = error.message;
        res.json(rObj);

    } finally {
        gateway.disconnect();
    }
});

// 서버시작
app.listen(3000, function() {
    console.log("Server is started. : 3000");
});