// META: title=StorageManager: estimate() usage details for indexeddb
// META: script=helpers.js
// META: script=../IndexedDB/support-promises.js

promise_test(async t => {
  const estimate = await navigator.storage.estimate()
  assert_equals(typeof estimate.usageDetails, 'object');
}, 'estimate() resolves to dictionary with usageDetails member');

promise_test(async t => {
  const arraySize = 1024 * 100;
  const objectStoreName = 'storageManager';
  const dbname = self.location.pathname;

  let usageDetailsAfterPut, usageDetailsBeforeCreate;

  // TODO: Clean this test up when possible
  // The for loop here is to help make this test less flaky.  The reason it is
  // flaky is that compaction could happen in the middle of this loop.  Suppose
  // the initial estimate shows 1000 usage before creating the db.  Compaction
  // could happen after this step and before we measure usage at the end,
  // meaning the 1000 could be wiped to 0, an extra 1024 * 100 is put in, and
  // the actual increase in usage does not reach our expected increase.  We
  // loop 10 times here to be safe (and reduce the number of bot builds that
  // fail); all it takes is one iteration without compaction for this to pass.
  for (let i = 0; i < 10; i++) {
    let estimate = await navigator.storage.estimate();
    usageDetailsBeforeCreate = estimate.usageDetails.indexedDB;

    const db = await openDB(dbname, objectStoreName, t);
    const txn = db.transaction(objectStoreName, 'readwrite');
    const buffer = new ArrayBuffer(arraySize);
    const view = new Uint8Array(buffer);

    for (let i = 0; i < arraySize; i++) {
      view[i] = Math.floor(Math.random() * 255);
    }

    const testBlob = new Blob([buffer], {
      type: 'application/octet-stream'
    });
    txn.objectStore(objectStoreName).add(testBlob, 1);

    await transactionPromise(txn);

    estimate = await navigator.storage.estimate();
    usageDetailsAfterPut = estimate.usageDetails.indexedDB;

    if (usageDetailsAfterPut - usageDetailsBeforeCreate > arraySize) {
      break;
    }
    db.close();
  }

  assert_true(usageDetailsAfterPut - usageDetailsBeforeCreate > arraySize);
}, 'estimate() usage details reflects increase in indexedDB after large ' +
   'value is stored');
