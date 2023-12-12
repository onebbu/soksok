package main

// 외부모듈 가져오기
import (
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/golang/protobuf/ptypes"
	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// SmartContract 객체 정의
type SmartContract struct {
	contractapi.Contract
}

// Campaign 구조체 정의
type ExpCampaign struct {
	CampaignID				string	`json:"cid"`
	DonateCorporationID		string	`json:"did"`
	Schedule				string	`json:"schedule"`
	Status					string	`json:"status"`		//registered, progressed, closed
}

type HistoryQueryResult struct {
	Record    	*ExpCampaign    `json:"record"`
	TxId     	string	    	`json:"txId"`
	Timestamp 	time.Time 		`json:"timestamp"`
	IsDelete  	bool 	     	`json:"isDelete"`
}


// EXP 등록
func (s *SmartContract) RegisterEXP(ctx contractapi.TransactionContextInterface, cid string, did string) error {

	// 기 등록된 campaign id가 있는지 검증
	exists, err := s.EXPExists(ctx, cid)
	if err != nil {
		return err
	}
	if exists {	// id가 이미 등록되어 있으면
		return fmt.Errorf("the Campaign %s already exists", cid)
	}

	// 캠페인, 기부단체, 일정, 상태
	exp := ExpCampaign{
		CampaignID:				cid,
		DonateCorporationID:	did,
		Schedule:				"",
		Status:					"registered",
	}
	expJSON, err := json.Marshal(exp)
	if err != nil {
		return err
	}
	return ctx.GetStub().PutState(cid, expJSON)
}

// EXP 확인
func (s *SmartContract) EXPExists(ctx contractapi.TransactionContextInterface, cid string) (bool, error) {
	expJSON, err := ctx.GetStub().GetState(cid)
	if err != nil {
		return false, fmt.Errorf("failed to read from world state: %v", err)
	}

	// return assetJSON != nil, nil
	if expJSON == nil {
		return false, nil
	} else {
		return true, nil
	}
}

// EXP 조회
func (s *SmartContract) ReadEXP(ctx contractapi.TransactionContextInterface, cid string) (*ExpCampaign, error) {
	expJSON, err := ctx.GetStub().GetState(cid)
	if err != nil {
		return nil, fmt.Errorf("failed to read from world state: %v", err)
	}
	if expJSON == nil {
		return nil, fmt.Errorf("the Campaign %s does not exist", cid)
	}

	var exp ExpCampaign
	err = json.Unmarshal(expJSON, &exp)
	if err != nil {
		return nil, err
	}

	return &exp, nil
}

// EXP 승인
func (s *SmartContract) ConfirmEXP(ctx contractapi.TransactionContextInterface, cid string) error {
	exp, err := s.ReadEXP(ctx, cid)
	if err != nil {
		return err
	}
	// 검증1 registered -> 등록한 대상운영기관의 인증서인지 검증
	// 검증2 해당이벤트 Status == registered
	if exp.Status != "registered" {
		return fmt.Errorf("the Campaign: %v is not in registered status", cid)
	}

	exp.Status = "confirmed"
	expJSON, err := json.Marshal(exp)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(cid, expJSON)
}

// QueryHistory
func (s *SmartContract) QueryEXPHistory(ctx contractapi.TransactionContextInterface, cid string) ([]HistoryQueryResult, error) {
	log.Printf("QueryEXPHistory: ID %v", cid)

	resultsIterator, err := ctx.GetStub().GetHistoryForKey(cid)
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var records []HistoryQueryResult

	for resultsIterator.HasNext() {
		response, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var exp ExpCampaign
		if len(response.Value) > 0 {
			err = json.Unmarshal(response.Value, &exp)
			if err != nil {
				return nil, err
			}
		} else {
			exp = ExpCampaign{
				CampaignID: cid,
			}
		}

		timestamp, err := ptypes.Timestamp(response.Timestamp)
		if err != nil {
			return nil, err
		}

		record := HistoryQueryResult{
			TxId: 		response.TxId,
			Timestamp:	timestamp,
			Record:		&exp,
			IsDelete:	response.IsDelete,
		}
		records = append(records, record)
	}
	return records, nil
}

// main
func main() {
	expChaincode, err := contractapi.NewChaincode(&SmartContract{})
	if err != nil {
		log.Panicf("Error creating exp Campaign chaincode: %v", err)
	}

	if err := expChaincode.Start(); err != nil {
		log.Panicf("Error starting exp Campaign chaincode: %v", err)
	}
}