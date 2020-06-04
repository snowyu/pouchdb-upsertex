import { throwError } from './src/utils';

// move to the transform(incoming: initRevision)
// const DEFAULT_INIT_VER = 'init';

// // 这个用来 post的时候定制 rev, filter用来设置默认，或者增加参数在options中而不是直接使用_rev.
// function initRevision(aDoc, aOptions) {
//   // first version revision should be customized.
//   aOptions.new_edits = false;
//   const vMatchRev = /^\d+-(.*)/.exec(aDoc._rev);
//   const vCustomRev = (vMatchRev && vMatchRev[1]) || DEFAULT_INIT_VER;
//   aDoc._revisions = {start: 1, ids: [vCustomRev]};
// }

// this is essentially the "update sugar" function from daleharvey/pouchdb#1388
// the diffFun tells us what delta to apply to the doc.  it either returns
// the doc, or false if it doesn't need to do an update after all
async function upsertInner(db, docId: string, diffFun, options?, count?: number) {
  // tslint:disable-next-line: strict-type-predicates
  if (typeof docId !== 'string') {
    throwError('doc id is required', 'upsertInner');
  }

  let doc: any;
  try {
    doc = await db.get(docId);
  } catch (err) {
    if (err.status !== 404) {
      throw err;
    }
    doc = false;
  }
  const docRev = doc._rev;
  const newDoc = diffFun(doc || {});

  if (!newDoc) {
    // if the diffFun returns falsy, we short-circuit as
    // an optimization
    return { ok: false, rev: docRev, id: docId };
  }

  // if (!doc) {
  //   // first created doc
  //   if (!options) options = {};
  //   initRevision(newDoc, options);
  // }

  // users aren't allowed to modify these values,
  // so reset them here
  newDoc._id = docId;
  if (docRev) newDoc._rev = docRev;
  const result = await tryAndPut(db, newDoc, diffFun, options, count);
  if (!doc) {
    delete newDoc._revisions;
  }
  return result;
}

async function tryAndPut(db, doc, diffFun, options= {}, count: number = 6) {
  let res;
  try {
    res = await db.put(doc, options);
    // if (Array.isArray(res)) res = {ok: true};
  } catch (err) {
    // 409: doc already exists
    if (err.status !== 409) {
      throw err;
    }
    if (--count > 0) {
      res = await upsertInner(db, doc._id, diffFun, options, count);
    }
  }
  return res;
}

export async function upsertEx(docId, diffFun, options?) {
  const db = this;
  return upsertInner(db, docId, diffFun, options);
}

export async function upsert(aDoc, options?) {
  if (aDoc._id === undefined) throwError('Missing _id', 'post', 404);
  const db = this;
  return upsertInner(db, aDoc._id, () => aDoc, options);
}

export async function putIfNotExists(docId, doc?, options?) {
  const db = this;

  if (typeof docId !== 'string') {
    options = doc;
    doc = docId;
    docId = doc._id;
  }

  const diffFun = function(existingDoc) {
    if (existingDoc._rev) {
      return false; // do nothing
    }
    return doc;
  };

  return upsertInner(db, docId, diffFun, options);
}

export async function postEx(aDoc, aOptions?) {
  if (aDoc._id === undefined) throwError('Missing _id', 'post', 404);

  const db = this;
  const diffFun = function(existingDoc) {
    if (existingDoc._rev) {
      throwError(existingDoc._id + ' already exists', {name: 'post', id: existingDoc._id}, 409);
    }
    return aDoc;
  };
  return upsertInner(db, aDoc._id, diffFun, aOptions);
}

// export default { postEx, putIfNotExists, upsert };
export default function(PouchDB) {
  // // fix[#7914](https://github.com/pouchdb/pouchdb/issues/7914)
  // // put with new_edits: false return an empty array(call the bulkDocs)
  // const oldPut = PouchDB.prototype.put;
  // PouchDB.prototype.put = async function(aDoc, aOptions?) {
  //   let result = await oldPut.apply(this, arguments);
  //   if (Array.isArray(result)) {
  //     if (!result.length) {
  //       result = {ok: true};
  //     } else {
  //       result = result[0];
  //     }
  //   }
  //   return result;
  // };

  // // fix[#5775](https://github.com/pouchdb/pouchdb/issues/5775)
  // // bulkDocs with new_edits: false always returns empty array
  // // Yeh its a little weird, but that is what CouchDB returns and
  // // we certainly arent deviating from compatibility here, its the core of the replicator
  // // But this make my afterIncoming error!!!
  // 这个bug只要在pouchdb-core中 _bulkDocs 注释掉filter即可，模仿couchdb连错误都要模仿，真可以。
  // 不可以，否则 当 连couchdb 时候照样[]。
  // const old_bulksDocs = PouchDB.prototype._bulkDocs;
  // console.log(PouchDB.prototype.bulkDocs.toString())
  // // can not work!!
  // PouchDB.prototype._bulkDocs = function(req, opts, callback) {
  //   old_bulksDocs.call(this, req, opts, function(err, res){
  //     if (!err && opts && opts.new_edits === false) opts.new_edits = true;
  //     callback(err, res);
  //   });
  // };

  PouchDB.prototype.postEx = postEx;
  PouchDB.prototype.putIfNotExists = putIfNotExists;
  PouchDB.prototype.upsertEx = upsertEx;
  PouchDB.prototype.upsert = upsert;
}
