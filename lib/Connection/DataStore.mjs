const CACHE_EXPIRE = {
    "clientlist": 30000,
    "clientinfo": 30000,
    "channellist": 30000,
    "channelinfo": 30000
};

export default class DataStore {
    constructor(connection) {
        this.connection = connection;
        this.store = {};
    }

    getCacheTime(cache, default_expire, noCache) {
        if (!cache.expire) {
            return 0;
        }
        let cacheAge = cache.expire;
        if (noCache) {
            cacheAge -= default_expire + 1000;
        }
        return cacheAge;
    }

    updateCache(cache, default_expire, noCache) {
        return !cache || this.getCacheTime(cache, default_expire, noCache) < Date.now();
    }

    async handleFetch(cache, list, resolve, reject, params) {
        if (cache.fetching) {
            if (!cache.queue) {
                cache.queue = [];
            }
            cache.queue.push({resolve,reject});
        } else {
            cache.fetching = true;
            try {
                const data = await this.connection.send(list, params, {noOutput: false, expectData: true}, 1);
                cache.data = data;
                cache.expire = Date.now() + CACHE_EXPIRE[list];
                resolve(data);
                if (cache.queue && cache.queue.length) {
                    let item;
                    while (item = cache.queue.shift()) {
                        item.resolve(data);
                    }
                }
            } catch(err) {
                reject(err);
                if (cache.queue && cache.queue.length) {
                    let item;
                    while (item = cache.queue.shift()) {
                        item.reject(data);
                    }
                }
            }
            cache.fetching = false;
        }
    }

    fetchList(list, noCache = false) {
        if (!this.store[list]) {
            this.store[list] = {};
        }
        const cache = this.store[list];
        return new Promise( (resolve, reject) => {
            if (this.updateCache(cache, CACHE_EXPIRE[list], noCache)) {
                this.handleFetch(cache, list, resolve, reject);
            } else {
                resolve(cache.data);
            }
        });
    }

    fetchInfo(list, keyName, keyValue, noCache = false) {
        if (!this.store[list]) {
            this.store[list] = {};
        }
        if (!this.store[list][keyValue]) {
            this.store[list][keyValue] = {};
        }
        const cache = this.store[list][keyValue];
        return new Promise( (resolve, reject) => {
            if (this.updateCache(cache, CACHE_EXPIRE[list], noCache)) {
                this.handleFetch(cache, list, resolve, reject, {[keyName]: keyValue});
            } else {
                resolve(cache.data);
            }
        });
    }

    forceInfoUpdate(list, id, args) {
        if (this.store[list] && this.store[list][id]) {
            this.store[list][id] = {
                ...this.store[list][id],
                ...args
            };
        }
    }
    forceListUpdate(list, key, id, args) {
        if (this.store[list]) {
            for (let i = 0, len = this.store[list].length; i < len; i++) {
                if (this.store[list][i][key] === id) {
                    this.store[list][i][key] = {
                        ...this.store[list][i][id],
                        ...args
                    };
                    break;
                }
            }
        }
    }
}
