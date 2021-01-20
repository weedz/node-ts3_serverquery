import { TSCommandList } from '../commands';
import Connection from '../Connection';
import Log from '../Log';

type ListCache = 
    |"clientlist"
    |"channellist";

type ItemCache = 
    |"clientinfo"
    |"channelinfo";

const ItemKeyMap: {[listName in ItemCache]: keyof TSCommandList[listName]} = <const> {
    clientinfo: "clid",
    channelinfo: "cid"
};

const Cache = new Map();

export default class DataStore {
    connection: Connection;

    constructor(connection: Connection) {
        this.connection = connection;
    }

    async fetchList(cacheName: ListCache) {
        let currentCache = Cache.get(cacheName);
        const time = Date.now();
        if (!currentCache || currentCache.time < time + 1000) {
            currentCache = {
                time,
                data: await this.connection.send<typeof cacheName>(cacheName)
            };
            Cache.set(cacheName, currentCache);
        } else {
            Log(`Cached data: ${cacheName}`, "DataStore", 5);
        }
        return currentCache.data;
    }

    async fetchItem(cacheName: ItemCache, id: number) {
        const key = ItemKeyMap[cacheName];
        let cacheList = Cache.get(cacheName);
        let cache;
        const time = Date.now();
        if (cacheList) {
            cache = cacheList.get(id);
        } else {
            cacheList = new Map();
            Cache.set(cacheName, cacheList);
        }
        if (!cache || cache.time < time + 1000) {
            cache = {
                time,
                // typeguarded by ItemKeyMap
                data: await this.connection.send<typeof cacheName>(cacheName, <any>{ [key]: id })
            };
            cacheList.set(id, cache);
        } else {
            Log(`Cached data: ${cacheName}, id=${id}`, "DataStore", 5);
        }
        return cache.data;
    }

    forceUpdateItem(cacheName: ItemCache, id: number, data: any) {
        // TODO: implement..
    }
    forceUpdateList(cacheName: ListCache, id: number, data: any) {
        // TODO: implement..
    }

    updateCacheItem() {

    }
    updateCacheList() {
        
    }
}
