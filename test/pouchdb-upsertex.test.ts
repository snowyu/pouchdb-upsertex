/// <reference path="../types/typings.d.ts" />

import PouchDB from 'pouchdb-core';
import memPlugin from 'pouchdb-adapter-memory';
import upsertExPlugin from "../src/pouchdb-upsertex";

function setTimeoutPromise(time) {
  return new Promise(function (resolve) {
    setTimeout(resolve, time);
  });
}

PouchDB.plugin(memPlugin as any);
PouchDB.plugin(upsertExPlugin as any);

jest.setTimeout(30000)
describe('basic test suite', function () {
  let db: PouchDB.Database;
  beforeEach(function () {
    db = new PouchDB('dbname', {adapter: 'memory'});
    return db;
  }, 30000);
  afterEach(function () {
    return db.destroy();
  }, 30000);

  it('expect upsertEx a new doc', async function () {
    const res = await db.upsertEx('myid', function () {
      return {some: 'doc'};
    });
    expect(res.ok).toBeTruthy();
    expect(res.rev).toMatch(/1-/);
    expect(res.id).toStrictEqual('myid');
    let doc = await db.get('myid');
    expect(doc).toHaveProperty('_rev');
    delete doc._rev;
    expect(doc).toEqual({
      _id: 'myid',
      some: 'doc'
    });
  });

  it('expect upsertEx a new doc in parallel', async function () {

    function diff() {
      return {some: 'doc'};
    }

    let promises = [
      db.upsertEx('myid', diff),
      db.upsertEx('myid', diff),
      db.upsertEx('myid', diff)
    ];

    await Promise.all(promises);
    let doc = await db.get('myid');
    expect(doc._rev).toBeDefined();
    delete doc._rev;
    expect(doc).toEqual({
      _id: 'myid',
      some: 'doc'
    });
  });

  it('expect upsertEx a new doc in parallel, still gen-1', async function () {

    function diff(doc) {
      if (doc.version) {
        return false;
      }
      return {version: 1};
    }

    let promises = [
      db.upsertEx('myid', diff),
      db.upsertEx('myid', diff),
      db.upsertEx('myid', diff)
    ];

    await Promise.all(promises);
    let doc = await db.get('myid');
    expect(doc._rev).toMatch(/1-/);
    delete doc._rev;
    expect(doc).toEqual({
      _id: 'myid',
      version: 1
    });
  });

  it('expect throw if no doc _id', async function () {
    return expect(db.upsertEx({}, function () {
      return {some: 'doc'};
    })).rejects.toThrow();
  });

  it('expect upsertEx an existing doc', async function () {
    let res = await db.upsertEx('myid', function () {
      return {some: 'doc'};
    })
    expect(res.ok).toStrictEqual(true);
    expect(res.rev).toMatch(/1-/);
    res = await db.upsertEx('myid', function (doc) {
      doc.version = 2;
      return doc;
    });
    expect(res.ok).toStrictEqual(true);
    expect(res.rev).toMatch(/2-/);
    expect(res.id).toStrictEqual('myid');
    let doc = await db.get('myid');
    expect(doc._rev).toBeDefined();
    delete doc._rev;
    expect(doc).toEqual({
      _id: 'myid',
      some: 'doc',
      version: 2
    });
  });

  it('expect not upsertEx if diffFun returns falsy', async function () {
    let res = await db.upsertEx('myid', function () {
      return {some: 'doc'};
    })
    expect(res.ok).toStrictEqual(true);
    expect(res.rev).toMatch(/1-/);
    expect(res.id).toStrictEqual('myid');
    res = await db.upsertEx('myid', function () {
      return false;
    });
    expect(res.ok).toStrictEqual(false);
    expect(res.rev).toMatch(/1-/);
    expect(res.id).toStrictEqual('myid');
    let doc = await db.get('myid');
    expect(doc._rev).toBeDefined();
    delete doc._rev;
    expect(doc).toEqual({
      _id: 'myid',
      some: 'doc',
    });
  });

  it('expect create a new doc, with sugar', async function () {
    let res = await db.putIfNotExists({_id: 'foo', hey: 'yo'})
    expect(res.ok).toStrictEqual(true);
    expect(res.rev).toMatch(/1-/);
    expect(res.id).toStrictEqual('foo');
    let doc = await db.get('foo');
    expect(doc._rev).toBeDefined();
    delete doc._rev;
    expect(doc).toEqual({
      _id: 'foo',
      hey: 'yo',
    });
  });

  it('expect not recreate a doc, with sugar', async function () {
    let res = await db.putIfNotExists({_id: 'foo', hey: 'yo'})
    expect(res.ok).toStrictEqual(true);
    expect(res.rev).toMatch(/1-/);
    expect(res.id).toStrictEqual('foo');
    await db.putIfNotExists({_id: 'foo', another: 'thing'})
    let doc = await db.get('foo');
    expect(doc._rev).toMatch(/1-/);
    delete doc._rev;
    expect(doc).toEqual({
      _id: 'foo',
      hey: 'yo',
    });
  });

  it('expect not recreate a doc, with sugar 2', async function () {
    let res = await db.putIfNotExists('foo', {hey: 'yo'})
    expect(res.ok).toStrictEqual(true);
    expect(res.rev).toMatch(/1-/);
    expect(res.id).toStrictEqual('foo');
    await db.putIfNotExists({_id: 'foo', another: 'thing'})
    let doc = await db.get('foo');
    expect(doc._rev).toMatch(/1-/);
    delete doc._rev;
    expect(doc).toEqual({
      _id: 'foo',
      hey: 'yo',
    });
  });

  it('expect not recreate a doc, with sugar, in parallel', async function () {

    let promises = [
      db.putIfNotExists('foo', {hey: 'yo'}),
      db.putIfNotExists('foo', {hey: 'yo'}),
      db.putIfNotExists('foo', {hey: 'yo'})
    ];

    await Promise.all(promises)
    let doc = await db.get('foo');
    expect(doc._rev).toMatch(/1-/);
    delete doc._rev;
    expect(doc).toEqual({
      _id: 'foo',
      hey: 'yo',
    });
  });

  it('expect not recreate a doc, with sugar, first wins', async function () {

    let promises = [
      db.putIfNotExists('foo', {hey: 'yo'}),
      setTimeoutPromise(500).then(function () {
        return db.putIfNotExists('foo', {hey: 'dude'});
      }),
      setTimeoutPromise(1000).then(function () {
        return db.putIfNotExists('foo', {hey: 'sista'});
      })
    ];

    await Promise.all(promises);
    let doc = await db.get('foo');
    expect(doc._rev).toMatch(/1-/);
    delete doc._rev;
    expect(doc).toEqual({
      _id: 'foo',
      hey: 'yo',
    });
  });

  it('expect not allow users to mutate the original doc', async function () {

    await db.put({_id: 'foo'})
    await db.upsertEx('foo', function (doc) {
      doc._rev = 'uh oh a bad rev!';
      doc._id = 'whoops I messed up the id too!';
      doc.newValue = 'newValue';
      return doc;
    });
    let doc = await db.get('foo');
    expect(doc._rev).toMatch(/2-/);
    delete doc._rev;
    expect(doc).toEqual({
      _id: 'foo',
      newValue: 'newValue',
    });
  });

  it('expect pass the right _id/_rev into the diffFun', async function () {

    let rev1;
    let id1;
    let rev2;
    let id2;

    await db.upsertEx('foo', function (doc) {
      rev1 = doc._rev;
      id1 = doc._id;
      return doc;
    });
    await db.upsertEx('foo', function (doc) {
      rev2 = doc._rev;
      id2 = doc._id;
      return doc;
    });
    expect(rev1).not.toBeDefined()
    expect(id1).not.toBeDefined();
    expect(rev2).toMatch(/^1-/); // first-gen
    expect(id2).toStrictEqual('foo');

  });

  it('errors thrown in diff function expectn\'t crash the system', async function () {
    return expect(db.upsertEx('foo', function () {
      throw new Error("An upsertEx diff error.");
    })).rejects.toThrow('An upsertEx diff error');
  });

  it('expect postEx a new doc', async function () {
    const res = await db.postEx({_id: 'myid', some: 'doc'});
    expect(res.ok).toBeTruthy();
    expect(res.rev).toMatch(/1-/);
    expect(res.id).toStrictEqual('myid');
    let doc = await db.get('myid');
    expect(doc).toHaveProperty('_rev');
    delete doc._rev;
    expect(doc).toEqual({
      _id: 'myid',
      some: 'doc'
    });
  });

  it('expect postEx throw if no doc _id', async function () {
    return expect(db.postEx({some: 'doc'})).rejects.toThrow();
  });

  it('expect postEx throw if doc exists', async function () {
    const res = await db.postEx({_id: 'myid', some: 'doc'});
    expect(res.ok).toBeTruthy();
    expect(res.rev).toMatch(/1-/);
    expect(res.id).toStrictEqual('myid');
    return expect(db.postEx({_id: 'myid', some: 'doc2'})).rejects.toThrow();
  });

  it('expect upsert a new doc', async function () {
    const res = await db.upsert({_id: 'myid', some: 'doc'});
    expect(res.ok).toBeTruthy();
    expect(res.rev).toMatch(/1-/);
    expect(res.id).toStrictEqual('myid');
    let doc = await db.get('myid');
    expect(doc).toHaveProperty('_rev');
    delete doc._rev;
    expect(doc).toEqual({
      _id: 'myid',
      some: 'doc'
    });
  });

  it('expect upsert throw if no doc _id', async function () {
    return expect(db.upsert({some: 'doc'})).rejects.toThrow();
  });

});
