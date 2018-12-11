import Log from '../Log';
import Connection from '../Connection';

type AllowedCacheNames = 
    |"clientlist"
    |"clientinfo"
    |"channellist"
    |"channeninfo";

type ListCache = 
    |"clientlist"
    |"channellist";

type ItemCache = 
    |"clientinfo"
    |"channelinfo";

const ItemKeyMap: {[listName in ItemCache]: string} = {
    clientinfo: "clid",
    channelinfo: "cid"
};

export default class DataStore {
    connection: Connection;

    constructor(connection: Connection) {
        this.connection = connection;
    }

    fetchList<T>(cacheName: ListCache) {
        return this.connection.send<T>(cacheName);
    }

    fetchItem<T>(cacheName: ItemCache, id:number) {
        const key = ItemKeyMap[cacheName];
        return this.connection.send<T>(cacheName, {[key]: id});
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
