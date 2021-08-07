/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const sgx = require('./lib/sgx');

module.exports.Sgx = sgx;
module.exports.contracts = [sgx];
