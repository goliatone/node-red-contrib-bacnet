'use strict';

const TEST= 'test';
const EventEmitter = require('events');

class Bacnet extends EventEmitter{
    constructor(options) {
        super();
        this.options = options;
    }

    whoIs(options) {

        return new Promise((resolve, reject) => {
            console.log('whoIs, stuff', options);

            resolve([{
                address: '127.0.0.1',
                deviceId: 1,
                maxAdpu: 3999,
                segmentation: 23,
                vendorId: 1
            },{
                address: '127.0.0.2',
                deviceId: 2,
                maxAdpu: 3999,
                segmentation: 22,
                vendorId: 2
            }]);
        });
    }

    readProperty(options) {

        return new Promise((resolve, reject) =>{
            resolve(23);
        });
    }

    writeProperty(options) {
        return new Promise((resolve)=>{
            resolve(options.valueList[0].Value);
        });
    }

    [TEST](msg) {
        console.log('TEST', msg);
    }
}

module.exports = Bacnet;
