"use strict";

const LIST_EXPIRE = {
    "clientlist": 10000,
    "clientinfo": 10000,
    "channellist": 10000,
    "channelinfo": 10000
};

class DataStore {
    constructor(connection) {
        this.connection = connection;
        this.store = {};
    }

    fetchList(list) {
        return new Promise( (resolve, reject) => {
            if (
                !this.store[list] ||
                (this.store[list].expire < Date.now() && !this.store[list].fetching)
            ) {
                console.log(`Fetching list: ${list}`);
                this.store[list] = {
                    fetching: true
                };
                this.connection.send(list, undefined, {noOutput: true, expectData: true}, 1).then(data => {
                    this.store[list].fetching = false;
                    this.store[list].data = data;
                    this.store[list].expire = Date.now() + LIST_EXPIRE[list];
                    resolve(data);
                });
            } else {
                resolve(this.store[list].data);
            }
        });
    }

    fetchInfo(list, keyName, keyValue) {
        if (!this.store[list]) {
            this.store[list] = {};
        }
        return new Promise( (resolve, reject) => {
            if (
                !this.store[list] ||
                !this.store[list][keyValue] ||
                (this.store[list][keyValue].expire < Date.now() && !this.store[list][keyValue].fetching)
            ) {
                console.log(`Fetching data: ${list}[${keyValue}]`);
                this.store[list][keyValue] = {
                    fetching: true
                };
                this.connection.send(list, {[keyName]: keyValue}, {noOutput: true, expectData: true}, 1).then(data => {
                    this.store[list][keyValue].fetching = false;
                    this.store[list][keyValue].data = data;
                    this.store[list][keyValue].expire = Date.now() + LIST_EXPIRE[list];
                    resolve(data);
                });
            }else {
                resolve(this.store[list][keyValue].data);
            }
        });
    }
}

module.exports = DataStore;
