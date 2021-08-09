/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Contract } = require('fabric-contract-api');


class Reconcile extends Contract {

    async InitLedger(ctx) {

        let sgx = await ctx.stub.invokeChaincode("sgx", ["GetAllAssets"], "mychannel");
        if (sgx.status !== 200) {
            throw new Error(sgx.message);
        }

        let primo = await ctx.stub.invokeChaincode("primo", ["GetAllAssets"], "mychannel");
        if (primo.status !== 200) {
            throw new Error(primo.message);
        }

        // const allassets = sgx.concat(primo)

        const sgx_assets = JSON.parse(sgx.payload.toString('utf8'));
        const primo_assets = JSON.parse(primo.payload.toString('utf8'));
        const parsed_primo_assets = []
        const parsed_sgx_assets = []

        for(var i=0;i<sgx_assets.length;i++){
            if(sgx_assets[i]['Record']['Status']=='pending'){
                parsed_sgx_assets.push(sgx_assets[i])
            }
        }

        const ISIN = []

        for(var i=0; i<parsed_sgx_assets.length; i++){
            if(!ISIN.includes(parsed_sgx_assets[i]['Record']['ISIN'])){
                ISIN.push(parsed_sgx_assets[i]['Record']['ISIN'])
            }
        }

        var includes = false;

        for(var j=0; j<primo_assets.length; j++){
            if(primo_assets[j]['Record']['Status']=='pending'){
            for(var i=0; i<ISIN.length; i++){
                if(primo_assets[j]['Record']['ISIN'].includes(ISIN[i])){
                includes = true;
                parsed_primo_assets.push({'ID':primo_assets[j]['Record']['ID'],'Quantity':primo_assets[j]['Record']['Quantity'],'Execution_date':primo_assets[j]['Record']['Execution_date'],'ISIN':ISIN[i],'RT':primo_assets[j]['Record']['RT'],'CLINO':primo_assets[j]['Record']['CLINO'],'Settlement_price':primo_assets[j]['Record']['Settlement_price']})
                break
                }
                
            }

            if(includes == true){
                includes = false;
            }else{
                parsed_primo_assets.push({'ID':primo_assets[j]['Record']['ID'],'Quantity':primo_assets[j]['Record']['Quantity'],'Execution_date':primo_assets[j]['Record']['Execution_date'],'ISIN':primo_assets[j]['Record']['ISIN'],'RT':primo_assets[j]['Record']['RT'],'CLINO':primo_assets[j]['Record']['CLINO'],'Settlement_price':primo_assets[j]['Record']['Settlement_price']})
            }
        
        }
        }

        const sgx_dict = {}
        const primo_dict = {}

        for(var i=0; i<parsed_sgx_assets.length; i++){
            var elements = [parsed_sgx_assets[i]['Record']['ISIN'],parsed_sgx_assets[i]['Record']['RT'],parsed_sgx_assets[i]['Record']['CLINO'],parsed_sgx_assets[i]['Record']['Settlement_price'],parsed_sgx_assets[i]['Record']['Execution_date']]
            var sgx_string = elements.join('_');
            if(sgx_dict[sgx_string]){
                sgx_dict[sgx_string]['Quantity'] += parseInt(parsed_sgx_assets[i]['Record']['Quantity']);
                sgx_dict[sgx_string]['ID_list'].push(parsed_sgx_assets[i]['Record']['ID'])
            }else{
                sgx_dict[sgx_string] = {'Quantity':parseInt(parsed_sgx_assets[i]['Record']['Quantity']), 'ID_list':[parsed_sgx_assets[i]['Record']['ID']]};
            }
        }

        for(var i=0; i<parsed_primo_assets.length; i++){
            var elements = [parsed_primo_assets[i]['ISIN'],parsed_primo_assets[i]['RT'],parsed_primo_assets[i]['CLINO'],parsed_primo_assets[i]['Settlement_price'],parsed_primo_assets[i]['Execution_date']]
            var primo_string = elements.join('_');
            if(primo_dict[primo_string]){
                primo_dict[primo_string]['Quantity'] += parseInt(parsed_primo_assets[i]['Quantity']);
                primo_dict[primo_string]['ID_list'].push(parsed_primo_assets[i]['ID'])
            }else{
                primo_dict[primo_string] = {'Quantity':parseInt(parsed_primo_assets[i]['Quantity']), 'ID_list':[parsed_primo_assets[i]['ID']]};
            }
        }

        const failed_sgx = []
        const failed_primo = []
        const reconciled_sgx = []
        const reconciled_primo = []

        for (const trade in sgx_dict) {
            
            if(!(trade in primo_dict)){

                var empty_dict = {}
                empty_dict[trade] = JSON.stringify(sgx_dict[trade])
                failed_sgx.push(empty_dict)
                continue
            }
            
            if(trade in primo_dict && primo_dict[trade]['Quantity']!=sgx_dict[trade]['Quantity']){
            
                var empty_dict = {}
                empty_dict[trade] = JSON.stringify(sgx_dict[trade])
                failed_sgx.push(empty_dict)
                continue
            }

            var empty_dict = {}
            empty_dict[trade] = JSON.stringify(sgx_dict[trade])
            reconciled_sgx.push(empty_dict)
          }


        for (const trade in primo_dict) {
            
            if(!(trade in sgx_dict)){

                var empty_dict = {}
                empty_dict[trade] = JSON.stringify(primo_dict[trade])
                failed_primo.push(empty_dict)
                continue
            }
            
            if(trade in sgx_dict && sgx_dict[trade]['Quantity']!=primo_dict[trade]['Quantity']){
            
                var empty_dict = {}
                empty_dict[trade] = JSON.stringify(primo_dict[trade])
                failed_primo.push(empty_dict)
                continue
            }

            var empty_dict = {}
            empty_dict[trade] = JSON.stringify(primo_dict[trade])
            reconciled_primo.push(empty_dict)
          }

        return {'failed_sgx':failed_sgx,'failed_primo': failed_primo,'reconciled_sgx':reconciled_sgx, 'reconciled_primo':reconciled_primo};
        // return {'parsed': parsed_primo_assets, primo_dict: primo_dict}
    }

    // CreateAsset issues a new asset to the world state with given details.
    async CreateAsset(ctx, id, owner, quantity, execution_date, ISIN, rt, clino, settlement_price) {
        const exists = await this.AssetExists(ctx, id);
        if (exists) {
            throw new Error(`The asset ${id} already exists`);
        }

        const asset = {
            ID: id,
            Owner: owner,
            Quantity: quantity,
            Execution_date: execution_date,
            ISIN: ISIN,
            RT: rt,
            CLINO: clino,
            Settlement_price: settlement_price,
        };
        
        await ctx.stub.putState(id, Buffer.from(JSON.stringify(asset)));
        return JSON.stringify(asset);
    }

    async CreateBlock(ctx, id,recon_id, quantity, sgx_list, primo_list) {
        const exists = await this.AssetExists(ctx, id);
        if (exists) {
            throw new Error(`The asset ${id} already exists`);
        }

        const asset = {
            Block_ID: id,
            Recon_ID: recon_id,
            Quantity: quantity,
            sgx_list: sgx_list,
            Primo_list: primo_list,
        };
        
        await ctx.stub.putState(id, Buffer.from(JSON.stringify(asset)));
        return JSON.stringify(asset);
    }

    // ReadAsset returns the asset stored in the world state with given id.
    async ReadAsset(ctx, id) {
        const assetJSON = await ctx.stub.getState(id); // get the asset from chaincode state
        if (!assetJSON || assetJSON.length === 0) {
            throw new Error(`The asset ${id} does not exist`);
        }
        return assetJSON.toString();
    }

    // UpdateAsset updates an existing asset in the world state with provided parameters.
    async UpdateAsset(ctx, id, owner, quantity, execution_date, ISIN, rt, clino, settlement_price) {
        const exists = await this.AssetExists(ctx, id);
        if (!exists) {
            throw new Error(`The asset ${id} does not exist`);
        }

        // overwriting original asset with new asset
        const updatedAsset = {
            ID: id,
            Owner: owner,
            Quantity: quantity,
            Execution_date: execution_date,
            ISIN: ISIN,
            RT: rt,
            CLINO: clino,
            Settlement_price: settlement_price,
        };

        return ctx.stub.putState(id, Buffer.from(JSON.stringify(updatedAsset)));
    }

    // DeleteAsset deletes an given asset from the world state.
    async DeleteAsset(ctx, id) {
        const exists = await this.AssetExists(ctx, id);
        if (!exists) {
            throw new Error(`The asset ${id} does not exist`);
        }
        return ctx.stub.deleteState(id);
    }

    // AssetExists returns true when asset with given ID exists in world state.
    async AssetExists(ctx, id) {
        const assetJSON = await ctx.stub.getState(id);
        return assetJSON && assetJSON.length > 0;
    }

  
    async GetAllAssets(ctx) {
        const allResults = [];
        // range query with empty string for startKey and endKey does an open-ended query of all assets in the chaincode namespace.
        const iterator = await ctx.stub.getStateByRange('', '');
        let result = await iterator.next();
        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            allResults.push({ Key: result.value.key, Record: record });
            result = await iterator.next();
        }
        return JSON.stringify(allResults);
    }

    async GetLength(ctx) {
        const allResults = [];
        // range query with empty string for startKey and endKey does an open-ended query of all assets in the chaincode namespace.
        const iterator = await ctx.stub.getStateByRange('', '');
        let result = await iterator.next();
        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            allResults.push({ Key: result.value.key, Record: record });
            result = await iterator.next();
        }
        return allResults.length;
    }

    async reconcile(ctx) {
        const sgx = [];
        const primo = []
        // range query with empty string for startKey and endKey does an open-ended query of all assets in the chaincode namespace.
        const iterator = await ctx.stub.getStateByRange('', '');
        let result = await iterator.next();
        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }

            if (record.Owner == "Sgx"){
                sgx.push({ Key: result.value.key, Record: record });
            }else if (record.Owner == "Primo"){
                primo.push({ Key: result.value.key, Record: record });
            }

            result = await iterator.next();
        }
        return "Length of SGX is "+sgx.length+". Length of Primo is "+primo.length;
    }
}

module.exports = Reconcile;
