/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Gateway, Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const { buildCAClient, registerAndEnrollUser, enrollAdmin } = require('../../test-application/javascript/CAUtil.js');
const { buildCCPOrg1, buildWallet } = require('../../test-application/javascript/AppUtil.js');

const channelName = 'mychannel';
const chaincodesgx = 'sgx';
const chaincodeprimo = 'primo';
const chaincodereconcile = 'reconcile'

const mspOrg1 = 'Org1MSP';
const walletPath = path.join(__dirname, 'wallet');
const org1UserId = 'appUser';

const express = require('express');
const { start } = require('repl');
const { response } = require('express');
const app = express()
const cors = require('cors');
app.use(cors({
    origin: '*'
}));
const port = 3000

var contract_sgx;
var contract_primo;
var contract_reconcile;



function prettyJSONString(inputString) {
	return JSON.stringify(JSON.parse(inputString), null, 2);
}

// pre-requisites:
// - fabric-sample two organization test-network setup with two peers, ordering service,
//   and 2 certificate authorities
//         ===> from directory /fabric-samples/test-network
//         ./network.sh up createChannel -ca
// - Use any of the asset-transfer-basic chaincodes deployed on the channel "mychannel"
//   with the chaincode name of "basic". The following deploy command will package,
//   install, approve, and commit the javascript chaincode, all the actions it takes
//   to deploy a chaincode to a channel.
//         ===> from directory /fabric-samples/test-network
//         ./network.sh deployCC -ccn sgx -ccp ../reconcile/chaincode-javascript-sgx/ -ccl javascript
//         ./network.sh deployCC -ccn primo -ccp ../reconcile/chaincode-javascript-primo/ -ccl javascript
// - Be sure that node.js is installed
//         ===> from directory /fabric-samples/reconcile/application-javascript
//         node -v
// - npm installed code dependencies
//         ===> from directory /fabric-samples/reconcile/application-javascript
//         npm install
// - to run this test application
//         ===> from directory /fabric-samples/reconcile/application-javascript
//         nodemon app.js

// NOTE: If you see  kind an error like these:
/*
    2020-08-07T20:23:17.590Z - error: [DiscoveryService]: send[mychannel] - Channel:mychannel received discovery error:access denied
    ******** FAILED to run the application: Error: DiscoveryService: mychannel error: access denied


   Failed to register user : Error: fabric-ca request register failed with errors [[ { code: 20, message: 'Authentication failure' } ]]
   ******** FAILED to run the application: Error: Identity not found in wallet: appUser
*/
// Delete the /fabric-samples/asset-transfer-basic/application-javascript/wallet directory
// and retry this application.
//
// The certificate authority must have been restarted and the saved certificates for the
// admin and application user are not valid. Deleting the wallet store will force these to be reset
// with the new certificate authority.
//

/**
 *  A test application to show basic queries operations with any of the asset-transfer-basic chaincodes
 *   -- How to submit a transaction
 *   -- How to query and check the results
 *
 * To see the SDK workings, try setting the logging to show on the console before running
 *        export HFC_LOGGING='{"debug":"console"}'
 */

async function core(){
	try {
		// build an in memory object with the network configuration (also known as a connection profile)
		const ccp = buildCCPOrg1();

		// build an instance of the fabric ca services client based on
		// the information in the network configuration
		const caClient = buildCAClient(FabricCAServices, ccp, 'ca.org1.example.com');

		// setup the wallet to hold the credentials of the application user
		const wallet = await buildWallet(Wallets, walletPath);

		// in a real application this would be done on an administrative flow, and only once
		await enrollAdmin(caClient, wallet, mspOrg1);

		// in a real application this would be done only when a new user was required to be added
		// and would be part of an administrative flow
		await registerAndEnrollUser(caClient, wallet, mspOrg1, org1UserId, 'org1.department1');

		// Create a new gateway instance for interacting with the fabric network.
		// In a real application this would be done as the backend server session is setup for
		// a user that has been verified.
		const gateway = new Gateway();

		try {
			// setup the gateway instance
			// The user will now be able to create connections to the fabric network and be able to
			// submit transactions and query. All transactions submitted by this gateway will be
			// signed by this user using the credentials stored in the wallet.
			await gateway.connect(ccp, {
				wallet,
				identity: org1UserId,
				discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
			});

			// Build a network instance based on the channel where the smart contract is deployed
			const network = await gateway.getNetwork(channelName);

			// Get the contract from the network.
			contract_sgx = network.getContract(chaincodesgx);
			contract_primo = network.getContract(chaincodeprimo)
			contract_reconcile = network.getContract(chaincodereconcile)

		} finally {
			// Disconnect from the gateway when the application is closing
			// This will close all connections to the network
			gateway.disconnect();
		}
	} catch (error) {
		console.error(`******** FAILED to run the application: ${error}`);
	}
}

core()

var main = async function (req, res, next){
	try {
			console.log('\n--> Submit Transaction: InitLedger, function creates the initial set of assets on the ledger');
			await contract_sgx.submitTransaction('InitLedger');
			console.log('*** Result: committed');

			console.log('\n--> Submit Transaction: InitLedger, function creates the initial set of assets on the ledger');
			await contract_primo.submitTransaction('InitLedger');
			console.log('*** Result: committed');

			// // Let's try a query type operation (function).
			// // This will be sent to just one peer and the results will be shown.
			// console.log('\n--> Evaluate Transaction: GetAllAssets, function returns all the current assets on the ledger');
			// let result = await contract.evaluateTransaction('GetAllAssets');
			// console.log(`*** Result: ${prettyJSONString(result.toString())}`);

			// req.all = prettyJSONString(result.toString())

			// console.log('\n--> Evaluate Transaction: ReadAsset, function returns an asset with a given assetID');
			// result = await contract.evaluateTransaction('ReadAsset', 'asset13');
			// console.log(`*** Result: ${prettyJSONString(result.toString())}`);

			// console.log('\n--> Evaluate Transaction: AssetExists, function returns "true" if an asset with given assetID exist');
			// result = await contract.evaluateTransaction('AssetExists', 'asset1');
			// console.log(`*** Result: ${prettyJSONString(result.toString())}`);



			// console.log('\n--> Evaluate Transaction: ReadAsset, function returns "asset1" attributes');
			// let one = await contract.evaluateTransaction('ReadAsset', 'asset1');
			// console.log(`*** one: ${prettyJSONString(one.toString())}`);

			// req.one = prettyJSONString(one.toString())

			// try {
			// 	// How about we try a transactions where the executing chaincode throws an error
			// 	// Notice how the submitTransaction will throw an error containing the error thrown by the chaincode
			// 	console.log('\n--> Submit Transaction: UpdateAsset asset70, asset70 does not exist and should return an error');
			// 	await contract.submitTransaction('UpdateAsset', 'asset70', 'blue', '5', 'Tomoko', '300');
			// 	console.log('******** FAILED to return an error');
			// } catch (error) {
			// 	console.log(`*** Successfully caught the error: \n    ${error}`);
			// }

			// // console.log('\n--> Submit Transaction: TransferAsset asset1, transfer to new owner of Tom');
			// // await contract.submitTransaction('TransferAsset', 'asset1', 'Tom');
			// // console.log('*** Result: committed');

			// console.log('\n--> Evaluate Transaction: ReadAsset, function returns "asset1" attributes');
			// result = await contract.evaluateTransaction('ReadAsset', 'asset1');
			// console.log(`*** Result: ${prettyJSONString(result.toString())}`);

		
	} catch (error) {
		console.error(`******** FAILED to run the application: ${error}`);
	}
	next()
}

app.use(main)

app.get('/read_sgx', (req, res) => {
	//read entire chain
	// res.send(req.all)
	contract_sgx.evaluateTransaction('GetAllAssets').then(function(value){
		const all = value.toString()
		res.send(all)
	})
})

app.get('/read_primo', (req, res) => {
	//read entire chain
	// res.send(req.all)
	contract_primo.evaluateTransaction('GetAllAssets').then(function(value){
		const all = value.toString()
		res.send(all)
	})
})

app.get('/one_sgx/:asset',(req,res)=>{
	//read one node in chain
	contract_sgx.evaluateTransaction('ReadAsset', req.params.asset).then(function(value){
		const one = value.toString()
		console.log(one)
		res.send(one)
	})
	
})

app.get('/one_primo/:asset',(req,res)=>{
	//read one node in chain
	contract_primo.evaluateTransaction('ReadAsset', req.params.asset).then(function(value){
		const one = value.toString()
		console.log(one)
		res.send(one)
	})
	
})

app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb'}));

app.post('/test', function(request, response){
	console.log(request.body);      // your JSON
	contract_sgx.submitTransaction('CreateAsset','169','Sgx','100','190623','696969','B','12345','69.69')
	 response.send(request.body);    // echo the result back
});

app.post('/create_sgx', function(request, response){

	contract_sgx.evaluateTransaction('GetLength').then(function(value){
		// var number = parseInt(value.toString())
		// response.send(value)
		for(let i=0; i<request.body.length; i++){
			var id = parseInt(i)+parseInt(value);
			contract_sgx.submitTransaction('CreateAsset',id.toString(),"Sgx",request.body[i][3],request.body[i][4],request.body[i][5],request.body[i][0],request.body[i][1],request.body[i][2],'pending').then(function(value){
				console.log(request.body[i])
			}).catch((error) => {
				console.error(error);
			  });
	
		}
		

	})
	
	response.send("SGX Create Transaction complete")

});

app.post('/create_primo', function(request, response){
	
	contract_primo.evaluateTransaction('GetLength').then(function(value){

		for(let i=0; i<request.body.length; i++){
		var id = parseInt(i)+parseInt(value);
		contract_primo.submitTransaction('CreateAsset',id.toString(),"Primo",request.body[i][10],request.body[i][12],request.body[i][6],request.body[i][5],request.body[i][19],request.body[i][11],'pending').then(function(value){
			console.log(request.body[i])
		}).catch((error) => {
			console.error(error);
		  });

	}
	})

	response.send("Primo Create Transaction complete")
});

app.post('/update_sgx', function(request, response){
	
	for(let i=0; i<request.body.length; i++){
		
		contract_sgx.submitTransaction('UpdateAsset',request.body[i]['id'],request.body[i]['Owner'],request.body[i]['quantity'],request.body[i]['date'],request.body[i]['ISIN'],request.body[i]['RT'],request.body[i]['CLINO'],request.body[i]['price'],request.body[i]['Status']).then(function(value){
			console.log(request.body[i])
		}).catch((error) => {
			console.error(error);
		  });

	}

	response.send("SGX Update Transaction complete")
});

app.post('/update_sgx_status', function(request, response){

	for(let i=0; i<request.body.length; i++){
	
		contract_sgx.submitTransaction('UpdateAssetStatus',request.body[i]['ID'],request.body[i]['Status']).then(function(value){
			console.log(value.toString())
		}).catch((error) => {
			console.error(error);
		  });

	}

	response.send("SGX Status Update Transaction complete")

});

app.post('/update_primo_status', function(request, response){

	for(let i=0; i<request.body.length; i++){
	
	contract_primo.submitTransaction('UpdateAssetStatus',request.body[i]['ID'],request.body[i]['Status']).then(function(value){
		console.log(value.toString())
	}).catch((error) => {
		console.error(error);
	  });

}

response.send("Primo Status Update Transaction complete")

});

app.post('/update_primo', function(request, response){
	
	for(let i=0; i<request.body.length; i++){
		
		contract_primo.submitTransaction('UpdateAsset',request.body[i]['id'],request.body[i]['Owner'],request.body[i]['quantity'],request.body[i]['date'],request.body[i]['ISIN'],request.body[i]['RT'],request.body[i]['CLINO'],request.body[i]['price'],request.body[i]['Status']).then(function(value){
			console.log(request.body[i])
		}).catch((error) => {
			console.error(error);
		  });

	}

	response.send("Primo Update Transaction complete")
});

app.post('/delete_sgx',function(request,response){
	console.log(request.body)
	for(let i=0; i<request.body.length; i++){
		contract_sgx.submitTransaction("DeleteAsset",request.body[i]['id']).then(function(value){
			console.log(request.body[i])
		}).catch((error) => {
			console.error(error);
		  });
	}
	
	response.send("SGX Delete Transaction complete")
})

app.post('/delete_primo',function(request,response){
	console.log(request.body)
	for(let i=0; i<request.body.length; i++){
		contract_primo.submitTransaction("DeleteAsset",request.body[i]['id']).then(function(value){
			console.log(request.body[i])
		}).catch((error) => {
			console.error(error);
		  });
	}
	
	response.send("Primo Delete Transaction complete")
})

app.get('/reconcile',function(request,response){
	contract_reconcile.submitTransaction("InitLedger").then(function(value){
		response.send(value)
	}	
	)
})

app.post('/create_reconcile',function(request,response){
	contract_reconcile.evaluateTransaction('GetLength').then(function(value){
	for(let i=0; i<request.body.length; i++){
	var id = parseInt(i)+parseInt(value);
	contract_reconcile.submitTransaction('CreateBlock',id,request.body[i].recon_id, request.body[i].Quantity, request.body[i].SGX_ID, request.body[i].PRIMO_ID).then(function(value){
		console.log(request.body[i])
	}).catch((error) => {
		console.error(error);
	  });
	
	}
	})
	response.send('Reconcile blocks made')
})

app.get('/read_reconcile', (req, res) => {
	//read entire chain
	// res.send(req.all)
	contract_reconcile.evaluateTransaction('GetAllAssets').then(function(value){
		const all = value.toString()
		res.send(all)
	})
})


app.listen(port, () => {
	console.log(`Example app listening at http://localhost:${port}`)
})