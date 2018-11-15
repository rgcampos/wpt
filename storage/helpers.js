function openDB(dbname, objectStoreName, t) {
  return new Promise(async (resolve, reject) => {
    await indexedDB.deleteDatabase(dbname);
    const openRequest = indexedDB.open(dbname);
    t.add_cleanup(() => {
      indexedDB.deleteDatabase(dbname);
    });

    openRequest.onerror = () => {
      reject(openRequest.error);
    };
    openRequest.onsuccess = () => {
      resolve(openRequest.result);
    };
    openRequest.onupgradeneeded = event => {
      openRequest.result.createObjectStore(objectStoreName);
    };
  });
}

function transactionPromise(txn) {
  return new Promise((resolve, reject) => {
    txn.onabort = () => {
      reject(txn.error);
    };
    txn.oncomplete = () => {
      resolve();
    };
  });
}
