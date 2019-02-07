import { TSCommandList } from '../commands';
import Connection from '../Connection';

type ListCache = 
    |"clientlist"
    |"channellist";

type ItemCache = 
    |"clientinfo"
    |"channelinfo";

const ItemKeyMap: {[listName in ItemCache]: keyof TSCommandList[listName]} = {
    clientinfo: "clid",
    channelinfo: "cid"
};

export default class DataStore {
    connection: Connection;

    constructor(connection: Connection) {
        this.connection = connection;
    }

    fetchList(cacheName: ListCache) {
        return this.connection.send<typeof cacheName>(cacheName);
    }

    fetchItem(cacheName: ItemCache, id:number) {
        const key = ItemKeyMap[cacheName];
        // typeguarded by ItemKeyMap
        return this.connection.send<typeof cacheName>(cacheName, <any>{ [key]: id });
    }

    forceUpdateItem() {

    }
    forceUpdateList() {

    }

    updateCacheItem() {

    }
    updateCacheList() {
        
    }
}
