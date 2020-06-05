# PouchDB Upsert Ex

Modified from [pouchdb-upsert](https://github.com/pouchdb/upsert).

### Usage

PouchDB Upsertex
=====

A tiny plugin for PouchDB that provides convenience methods:

* `upsert()` - update a document, or insert a new one if it doesn't exist ("upsert"). Will keep retrying (default is 6 times) if it gets 409 conflicts.
* `upsertEx()` -
* `putIfNotExists()` - create a new document if it doesn't exist. Does nothing if it already exists.
* `postEx()` - create a new document if it doesn't exist. throw 409 error if it already exists.

So basically, if you're tired of manually dealing with 409s or 404s in your PouchDB code, then this is the plugin for you.

Installation
------

```
npm install pouchdb-upsertex
```

Then attach it to the `PouchDB` object:

```js
var PouchDB = require('pouchdb');
PouchDB.plugin(require('pouchdb-upsertex'));
```

API
--------


### Overview

* [`async db.upsert(doc [, options])`](#dbupsertdoc--options)
* [`async db.upsertEx(docId, diffFunc [, options])`](#dbupsertexdocid-difffunc--options)
* [`async db.putIfNotExists([docId, ] doc [, options])`](#dbputifnotexistsdocid--doc--options)
* [`async db.postEx(doc [, options])`](#dbupsertdoc--options)

### db.postEx(doc [, options])

async perform an insert operation. It will throw error if doc already exists.

* options: optional options which pass to `db.put` .
  * retry: the keep retry number, defaults to 6.

### db.upsert(doc [, options])

async perform an upsert (update or insert) operation.

* doc: the upserted document.
* options: optional options which pass to `db.put` .
  * retry: the keep retry number, defaults to 6.

### db.upsertEx(docId, diffFunc [, callback])

async perform an upsert (update or insert) operation.

* `docId` - the `_id` of the document.
* `diffFunc` - function that takes the existing doc as input and returns an updated doc.
  * If this `diffFunc` returns falsey, then the update won't be performed (as an optimization).
  * If the document does not already exist, then `{}` will be the input to `diffFunc`.
* options: optional options which pass to `db.put` .
  * retry: the keep retry number, defaults to 6.

##### Example 1

A doc with a basic counter:

```js
db.upsertEx('myDocId', function (doc) {
  if (!doc.count) {
    doc.count = 0;
  }
  doc.count++;
  return doc;
}).then(function (res) {
  // success, res is {rev: '1-xxx', updated: true, id: 'myDocId'}
}).catch(function (err) {
  // error
});
```

Resulting doc (after 1 `upsert`):

```js
{
  _id: 'myDocId',
  _rev: '1-cefef1ec19869d9441a47021f3fd4710',
  count: 1
}
```

Resulting doc (after 3 `upsert`s):

```js
{
  _id: 'myDocId',
  _rev: '3-536ef59f3ed17a181dc683a255caf1d9',
  count: 3
}
```

##### Example 2

A `diffFunc` that only updates the doc if it's missing a certain field:

```js
db.upsertEx('myDocId', function (doc) {
  if (!doc.touched) {
    doc.touched = true;
    return doc;
  }
  return false; // don't update the doc; it's already been "touched"
}).then(function (res) {
  // success, res is {rev: '1-xxx', updated: true, id: 'myDocId'}
}).catch(function (err) {
  // error
});
```

Resulting doc:

```js
{
  _id: 'myDocId',
  _rev: '1-cefef1ec19869d9441a47021f3fd4710',
  touched: true
}
```

The next time you try to `upsert`, the `res` will be `{rev: '1-xxx', updated: false, id: 'myDocId'}`. The `updated: false` indicates that the `upsert` function did not actually update the document, and the `rev` returned will be the previous winning revision.

##### Example 3

You can also return a new object. The `_id` and `_rev` are added automatically:

```js
db.upsertEx('myDocId', function (doc) {
  return {thisIs: 'awesome!'};
}).then(function (res) {
  // success, res is {rev: '1-xxx', updated: true, id: 'myDocId'}
}).catch(function (err) {
  // error
});
```

Resulting doc:

```js
{
  _id: 'myDocId',
  _rev: '1-cefef1ec19869d9441a47021f3fd4710',
  thisIs: 'awesome!'
}
```

### db.putIfNotExists([docId, ] doc [, options])

async put a new document with the given `docId`, if it doesn't already exist.

* `docId` - the `_id` of the document. Optional if you already include it in the `doc`
* `doc` - the document to insert. Should contain an `_id` if `docId` is not specified

If the document already exists, then the Promise will just resolve immediately.

##### Example 1

Put a doc if it doesn't exist

```js
db.putIfNotExists('myDocId', {yo: 'dude'}).then(function (res) {
  // success, res is {rev: '1-xxx', updated: true, id: 'myDocId'}
}).catch(function (err) {
  // error
});
```

Resulting doc:

```js
{
  _id: 'myDocId',
  _rev: '1-cefef1ec19869d9441a47021f3fd4710',
  yo: 'dude'
}
```

If you call `putIfNotExists` multiple times, then the document will not be updated the 2nd, 3rd, or 4th time (etc.).

If it's not updated, then the `res` will be `{rev: '1-xxx', updated: false, id: 'myDocId'}`, where `rev` is the first revision and `updated: false` indicates that it wasn't updated.

##### Example 2

You can also just include the `_id` inside the document itself:

```js
db.putIfNotExists({_id: 'myDocId', yo: 'dude'}).then(function (res) {
  // success, res is {rev: '1-xxx', updated: true, id: 'myDocId'}
}).catch(function (err) {
  // error
});
```

Resulting doc (same as example 1):

```js
{
  _id: 'myDocId',
  _rev: '1-cefef1ec19869d9441a47021f3fd4710',
  yo: 'dude'
}
```

