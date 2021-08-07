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

5 Key Endpoints:

1) http://localhost:3000/read_sgx (For reading SGX rows on the blockchain)
2) http://localhost:3000/read_primo (For reading Primo rows on the blockchain)
3) http://localhost:3002/upload_sgx (For uploading SGX rows to the blockchain)
4) http://localhost:3002/upload_primo (For uploading Primo rows to the blockchain)
5) http://localhost:3002/update_status_complex (For modifying the reconciliation status of SGX and Primo rows on the blockchain)
