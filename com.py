import os
import sys

os.system("./network.sh up createChannel -ca")
os.system("./network.sh deployCC -ccn sgx -ccp ../reconcile/chaincode-javascript-sgx/ -ccl javascript")
os.system("./network.sh deployCC -ccn primo -ccp ../reconcile/chaincode-javascript-primo/ -ccl javascript")
os.system("./network.sh deployCC -ccn reconcile -ccp ../reconcile/chaincode-javascript-reconcile/ -ccl javascript")