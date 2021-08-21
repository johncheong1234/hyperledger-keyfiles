/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Contract } = require('fabric-contract-api');


class Primo extends Contract {

    async InitLedger(ctx) {

        const assets = []

        for (const asset of assets) {
            asset.docType = 'asset';
            await ctx.stub.putState(asset.ID, Buffer.from(JSON.stringify(asset)));
            console.info(`Asset ${asset.ID} initialized`);
        }
    }

    // CreateAsset issues a new asset to the world state with given details.
    async CreateAsset(ctx, id, owner, quantity, execution_date, ISIN, rt, clino, settlement_price,status,block_id,request_ty,trade_id,trade_version_id, source_system_id,source_system,fii,book,counterparty,settlement_date,alpha_status,pricing_currency,principal,order_id,order_slang) {
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
            Status: status,
            Block_ID: block_id,
            Request_Ty: request_ty,
            Trade_ID: trade_id,
            Trade_Version_ID: trade_version_id, 
            Source_System_ID: source_system_id,
            Source_System: source_system,
            FII: fii,
            Book: book,
            Counterparty: counterparty,
            Settlement_Date: settlement_date,
            Alpha_status: alpha_status,
            Pricing_Currency:pricing_currency,
            Principal: principal,
            Order_ID: order_id,
            Order_Slang: order_slang
        };
        
        await ctx.stub.putState(id, Buffer.from(JSON.stringify(asset)));
        return JSON.stringify(asset);
    }

    async CreateAssetArray(ctx, array){
        const assets = JSON.parse(array);

        for(var i=0;i<assets.length;i++){
            const exists = await this.AssetExists(ctx, assets[i]['ID'].toString());
            if (exists) {
                throw new Error(`The asset ${assets[i]['ID']} already exists`);
            }

            const asset = {
                ID: assets[i]['ID'],
                Owner: assets[i]['Owner'],
                Quantity: assets[i]['Quantity'],
                Execution_date: assets[i]['Execution_date'],
                ISIN: assets[i]['ISIN'],
                RT: assets[i]['RT'],
                CLINO: assets[i]['CLINO'],
                Settlement_price: assets[i]['Settlement_price'],
                Status: assets[i]['Status'],
                Block_ID: assets[i]['Block_ID'],
                Request_Ty: assets[i]['Request_Ty'],
                Trade_ID: assets[i]['Trade_ID'],
                Trade_Version_ID: assets[i]['Trade_Version_ID'], 
                Source_System_ID: assets[i]['Source_System_ID'],
                Source_System: assets[i]['Source_System'],
                FII: assets[i]['FII'],
                Book: assets[i]['Book'],
                Counterparty: assets[i]['Counterparty'],
                Settlement_Date: assets[i]['Settlement_Date'],
                Alpha_status: assets[i]['Alpha_status'],
                Pricing_Currency:assets[i]['Pricing_Currency'],
                Principal: assets[i]['Principal'],
                Order_ID: assets[i]['Order_ID'],
                Order_Slang: assets[i]['Order_Slang']
            };
            
            await ctx.stub.putState(assets[i]['ID'].toString(), Buffer.from(JSON.stringify(asset)));
        }

        return 'Assets Created'

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
    async UpdateAsset(ctx, id, owner, quantity, execution_date, ISIN, rt, clino, settlement_price, status) {
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
            Status: status
        };

        return ctx.stub.putState(id, Buffer.from(JSON.stringify(updatedAsset)));
    }

    async UpdateAssetStatus(ctx, id, status) {

        const assetString = await this.ReadAsset(ctx, id);
        const asset = JSON.parse(assetString);
        asset.Status = status;
        return ctx.stub.putState(id, Buffer.from(JSON.stringify(asset)));

    }

    async UpdateAssetStatusArray(ctx, array){
        const assets = JSON.parse(array);

        for(var i=0;i<assets.length;i++){
            const assetString = await this.ReadAsset(ctx, assets[i]['ID'].toString());
            const asset = JSON.parse(assetString);
            asset.Status = assets[i]['Status'];
            await ctx.stub.putState(assets[i]['ID'].toString(), Buffer.from(JSON.stringify(asset)));
        }

        return 'Assets Status Updated'

    }

    async UpdateAssetBlockIDArray(ctx, array){
        const assets = JSON.parse(array);

        for(var i=0;i<assets.length;i++){
            const assetString = await this.ReadAsset(ctx, assets[i]['ID'].toString());
            const asset = JSON.parse(assetString);
            asset.Block_ID = assets[i]['Block_ID'];
            await ctx.stub.putState(assets[i]['ID'].toString(), Buffer.from(JSON.stringify(asset)));
        }

        return 'Block IDs Updated'

    }   

    async UpdateAssetBlockID(ctx, id, block_id) {

        const assetString = await this.ReadAsset(ctx, id);
        const asset = JSON.parse(assetString);
        asset.Block_ID = block_id;
        return ctx.stub.putState(id, Buffer.from(JSON.stringify(asset)));

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

    // TransferAsset updates the owner field of asset with given id in the world state.
    // async TransferAsset(ctx, id, newOwner) {
    //     const assetString = await this.ReadAsset(ctx, id);
    //     const asset = JSON.parse(assetString);
    //     asset.Owner = newOwner;
    //     return ctx.stub.putState(id, Buffer.from(JSON.stringify(asset)));
    // }

    // GetAllAssets returns all assets found in the world state.
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


    async GetLength(ctx){
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

    // async reconcile(ctx) {
    //     const sgx = [];
    //     const primo = []
    //     // range query with empty string for startKey and endKey does an open-ended query of all assets in the chaincode namespace.
    //     const iterator = await ctx.stub.getStateByRange('', '');
    //     let result = await iterator.next();
    //     while (!result.done) {
    //         const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
    //         let record;
    //         try {
    //             record = JSON.parse(strValue);
    //         } catch (err) {
    //             console.log(err);
    //             record = strValue;
    //         }

    //         if (record.Owner == "sgx"){
    //             sgx.push({ Key: result.value.key, Record: record });
    //         }else if (record.Owner == "primo"){
    //             primo.push({ Key: result.value.key, Record: record });
    //         }

    //         result = await iterator.next();
    //     }
    //     return "Length of SGX is "+sgx.length+". Length of Primo is "+primo.length;
    // }
}

module.exports = Primo;
