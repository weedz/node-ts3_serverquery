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

    fetchList(list, noCache = false) {
        return new Promise( (resolve, reject) => {
            let cacheAge = 0;
            if (this.store[list]) {
                cacheAge = this.store[list].expire;
                if (noCache) {
                    cacheAge -= CACHE_EXPIRE[list] + 1000;
                }
            }
            if (
                !this.store[list] ||
                (cacheAge < Date.now() && !this.store[list].fetching)
            ) {
                // console.log(`Fetching list: ${list}`);
                this.store[list] = {
                    fetching: true
                };
                this.connection.send(list, undefined, {noOutput: true, expectData: true}, 1).then(data => {
                    this.store[list].fetching = false;
                    this.store[list].data = data;
                    this.store[list].expire = Date.now() + CACHE_EXPIRE[list];
                    resolve(data);
                }).catch(err => {
                    reject(err);
                });
            } else {
                resolve(this.store[list].data);
            }
        });
    }

    fetchInfo(list, keyName, keyValue, noCache = false) {
        if (!this.store[list]) {
            this.store[list] = {};
        }
        return new Promise( (resolve, reject) => {
            let cacheAge = 0;
            if (this.store[list] && this.store[list][keyValue]) {
                cacheAge = this.store[list][keyValue].expire;
                if (noCache) {
                    cacheAge -= CACHE_EXPIRE[list] + 1000;
                }
            }
            if (
                !this.store[list] ||
                !this.store[list][keyValue] ||
                (cacheAge < Date.now() && !this.store[list][keyValue].fetching)
            ) {
                // console.log(`Fetching data: ${list}[${keyValue}]`);
                this.store[list][keyValue] = {
                    fetching: true
                };
                this.connection.send(list, {[keyName]: keyValue}, {noOutput: true, expectData: true}, 1).then(data => {
                    this.store[list][keyValue].fetching = false;
                    this.store[list][keyValue].data = data;
                    this.store[list][keyValue].expire = Date.now() + CACHE_EXPIRE[list];
                    resolve(data);
                }).catch(err => {
                    reject(err);
                });
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
