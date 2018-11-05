import Log from '../Log';

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

    pushToCacheQueue(cache, item) {
        if (!cache.queue) {
            cache.queue = [];
        }
        cache.queue.push(item);
    }

    async request(cache, list, params) {
        const data = await this.connection.send(list, params, {
            noOutput: true,
            expectData: true
        }, 1);
        cache.data = data;
        cache.expire = Date.now() + CACHE_EXPIRE[list];
        if (cache.queue && cache.queue.length) {
            let item;
            while (item = cache.queue.shift()) {
                item.resolve(data);
            }
        } else {
            Log("Cache queue appears to be empty...", this.constructor.name, 3);
        }
    }

    rejectRequest(err, cache) {
        if (cache.queue && cache.queue.length) {
            let item;
            while (item = cache.queue.shift()) {
                item.reject(err);
            }
        } else {
            Log(`Request rejected: ${err}, Cache queue appears to be empty...`, this.constructor.name, 3);
        }
    }

    async handleFetch(cache, list, params, resolve, reject) {
        this.pushToCacheQueue(cache, {
            resolve,
            reject
        });
        if (!cache.fetching) {
            cache.fetching = true;
            try {
                await this.request(cache, list, params);
            } catch (err) {
                this.rejectRequest(err, cache);
            }
            cache.fetching = false;
        }
    }

    fetchList(list, noCache = false) {
        if (!this.store[list]) {
            this.store[list] = {};
        }
        const cache = this.store[list];

        const result = this.fetchPromise(cache, list, noCache);
        return result;
    }

    fetchInfo(list, keyName, keyValue, noCache = false) {
        if (!this.store[list]) {
            this.store[list] = {};
        }
        if (!this.store[list][keyValue]) {
            this.store[list][keyValue] = {};
        }
        const cache = this.store[list][keyValue];
        return this.fetchPromise(cache, list, noCache, {
            [keyName]: keyValue
        });
    }

    fetchPromise(cache, list, noCache, params = {}) {
        return new Promise((resolve, reject) => {
            if (this.updateCache(cache, CACHE_EXPIRE[list], noCache)) {
                Log(`Fetching resource ${list} ${Object.entries(params)}`, this.constructor.name, 4);
                this.handleFetch(cache, list, params, resolve, reject);
            } else {
                Log(`Using cache (update in ${Math.ceil( (cache.expire - Date.now()) / 1000 ) }s) for resource: ${list} ${Object.entries(params)}`, this.constructor.name, 4);
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
