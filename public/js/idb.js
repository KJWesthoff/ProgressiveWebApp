let db;

const request = indexedDB.open('budget-tracker', 1);

request.onupgradeneeded = function(event){
    const db = event.target.result;
    db.createObjectStore('transaction', {autoIncrement:true});
};

// fired a lot.. at startup, after 
request.onsuccess = function(event) {
    db = event.target.result;

    // if online upload all the content og indexedDB budget-tracker
    if(navigator.online) {
        uploadTransactions();
    }
};

// error handler
request.onerror = function(event){
    console.log(event.target.errorCode);
};


// function if submit transaction and no internet
function saveRecord(record) {
    alert("offline transaction, will be uploaded later")
    // open up a new db R/W transaction
    const transaction = db.transaction(['transaction'], 'readwrite');

    // access the transaction ObjectStore in indexedDB 
    const transactionObjectStore = transaction.objectStore('transaction');

    // add the record
    transactionObjectStore.add(record)

};

function uploadTransactions(){
    // open up a new db R/W transaction
    const transaction = db.transaction(['transaction'], 'readwrite');

    // access the transaction ObjectStore in indexedDB 
    const transactionObjectStore = transaction.objectStore('transaction');

    const getAll = transactionObjectStore.getAll();

    getAll.onsuccess = function(){
        // if there is data in the transaction ObjectStore in indexedDB

        if(getAll.result.length > 0){
            //console.log(getAll.result);
            fetch("/api/transaction/bulk", {
                method:"POST",
                body:JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(serverResponse => {
                if(serverResponse.message){
                    throw new Error(serverResponse);
                }

                // open up a new db R/W transaction
                const transaction = db.transaction(['transaction'], 'readwrite');

                // access the transaction ObjectStore in indexedDB 
                const transactionObjectStore = transaction.objectStore('transaction');

                 // clear all items in your store
                transactionObjectStore.clear();

                alert("All offline transactions have been submitted")


            })
            .catch(err =>console.log)
        }

    }


}



// listen for app coming back online
window.addEventListener('online', uploadTransactions);

// addEventListener version
//window.addEventListener('offline', (event) => {
//    console.log("The network connection has been lost.");
//});

// onoffline version
window.onoffline = (event) => {
    alert("The network connection has been lost \n Transactions will be updated when connection is up again");
  };