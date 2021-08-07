/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const reconcile = require('./lib/reconcile');

module.exports.Reconcile = reconcile;
module.exports.contracts = [reconcile];
