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

    getCacheAge(cache, default_expire, noCache) {
        let cacheAge = cache.expire;
        if (noCache) {
            cacheAge -= default_expire + 1000;
        }
        return cacheAge;
    }

    checkCacheAge(cache, default_expire, noCache) {
        // Check if cache is defined, we are not already fetching, and cache age
        return (
            !cache ||
            (
                !cache.fetching &&
                this.getCacheAge(cache, default_expire, noCache) < Date.now()
            )
        )
    }

    fetchList(list, noCache = false) {
        return new Promise( async (resolve, reject) => {
            if (this.checkCacheAge(this.store[list], CACHE_EXPIRE[list], noCache)) {
                this.store[list] = {
                    fetching: true
                };
                try {
                    const data = await this.connection.send(list, undefined, {noOutput: true, expectData: true}, 1);
                    this.store[list].data = data;
                    this.store[list].expire = Date.now() + CACHE_EXPIRE[list];
                    resolve(data);
                } catch(err) {
                    reject(err);
                }
                this.store[list].fetching = false;
            } else {
                resolve(this.store[list].data);
            }
        });
    }

    fetchInfo(list, keyName, keyValue, noCache = false) {
        if (!this.store[list]) {
            this.store[list] = {};
        }
        return new Promise( async (resolve, reject) => {
            if (this.checkCacheAge(this.store[list][keyValue], CACHE_EXPIRE[list], noCache)) {
                this.store[list][keyValue] = {
                    fetching: true
                };
                try {
                    const data = await this.connection.send(list, {[keyName]: keyValue}, {noOutput: true, expectData: true}, 1)
                    this.store[list][keyValue].data = data;
                    this.store[list][keyValue].expire = Date.now() + CACHE_EXPIRE[list];
                    resolve(data);
                } catch(err) {
                    reject(err);
                }
                this.store[list][keyValue].fetching = false;
            } else {
                resolve(this.store[list][keyValue].data);
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
                    return;
                }
            }
        }
    }
}
