/// <reference types="pouchdb-core" />

declare namespace PouchDB {
  interface Database<Content extends {} = {}> {
    upsertEx(docId: any, diffFun: any, options?: any): Promise<any>;
    upsert(aDoc: any, options?: any): Promise<any>;
    putIfNotExists(docId: any, doc?: any, options?: any): Promise<any>;
    postEx(aDoc: any, aOptions?: any): Promise<any>;
  }
  interface Static extends EventEmitter {
    plugin(plugin: Static): Static;
  }
}

