# Hyperledger-Keyfiles
Key Files for the hyperledger fabric for Equities Trade Reconciliation

Clone the repo to your local computer.

Create a directory, cd into it and execute a bashscript by using these commands: 
1) mkdir -p $HOME/go/src/github.com/<your_github_userid>
2) cd $HOME/go/src/github.com/<your_github_userid>
3) curl -sSL https://bit.ly/2ysbOFE | bash -s

Refer to https://hyperledger-fabric.readthedocs.io/en/latest/install.html for more details

Add the com.py file into the 'fabric-samples/test-network' sub-directory that would have been committed.
Add the folders 'reconcile' and 'parse-service' into the 'fabric-samples' directory that would have been committed.

In the test-network sub-directory, enter:
python com.py

cd into reconcile/application-javascript, enter:
nodemon app.js

If this fails, you might need to enter: 
npm install -g nodemon

If there are issues with discovery service, delete the wallet directory in app-javascript.

cd into parse-service, enter:
nodemon app.js

7 Key Endpoints:

1) http://localhost:3000/read_sgx (GET REQUEST: For reading SGX rows on the blockchain)
2) http://localhost:3000/read_primo (GET REQUEST: For reading Primo rows on the blockchain)
3) http://localhost:3002/upload_sgx_complex (POST REQUEST (with xlsx file in form data): For uploading SGX rows to the blockchain)
4) http://localhost:3002/upload_primo_complex (POST REQUEST (with xlsx file in form data): For uploading Primo rows to the blockchain)
5) http://localhost:3002/update_status_complex (GET REQUEST For modifying the reconciliation status of SGX and Primo rows on the blockchain - MUST BE CALLED AFTER 7 because after modification of status, reconcile end point not listed here will not work, causing 7 to fail)
6) http://localhost:3000/read_reconcile (GET REQUEST For reading Reconcile blocks on blockchain)
7) http://localhost:3002/create_reconcile_complex (GET REQUEST For uploading Reconcile blocks onto blockchain - MUST BE CALLED BEFORE 5 because after modification of status, reconcile end point not listed here will not work, causing 7 to fail)
8) http://localhost:3002/update_block_id_complex (GET REQUEST For modifiying the Block ID of each SGX and Primo row on the blockchain - MUST BE CALLED after 7 as this requires the updated set of blocks)
8) http://localhost:3000/one_sgx/:asset (GET REQUEST For retrieving single SGX transaction by ID)
9) http://localhost:3000/one_primo/:asset (GET REQUEST For retrieving single Primo transaction by ID)
10) http://localhost:3000/one_reconcile/:asset (GET REQUEST For retrieving single Reconcile transaction by ID)
