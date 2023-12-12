#!/bin/bash

set -e

# org1 환경설정
export FABRIC_CFG_PATH=~/fabric-samples/config/

export ORDERER_CA="/home/bstudent/fabric-samples/test-network/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem"
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=~/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=~/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/users/User1@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051
export PEER_PARAMS="--peerAddresses localhost:7051 --tlsRootCertFiles /home/bstudent/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt --peerAddresses localhost:9051 --tlsRootCertFiles /home/bstudent/fabric-samples/test-network/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt"

set -x
# RegisterEXP
peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile $ORDERER_CA --channelID companychannel --name exp $PEER_PARAMS -c '{"Args":["RegisterEXP", "E003", "F001"]}'

sleep 3

# QueryEXP
peer chaincode query -C companychannel -n exp -c '{"Args":["ReadEXP", "E002"]}'

# ConfirmEXP
peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile $ORDERER_CA --channelID companychannel --name exp $PEER_PARAMS -c '{"Args":["ConfirmEXP", "E003"]}'

sleep 3

# QueryEXP
peer chaincode query -C companychannel -n exp -c '{"Args":["ReadEXP", "E003"]}'

# QueryEXPHISTORY
peer chaincode query -C companychannel -n exp -c '{"Args":["QueryEXPHistory", "E003"]}'

set +x