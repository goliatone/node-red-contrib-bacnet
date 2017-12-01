const bacnet = require('bacstack');

class Bacnet {
    constructor(options) {
        this.options = options;
        this.devices = new Map();
        this.connect(this.options);
    }

    onDestroy() {
        if (this.client) {
            this.client.removeAllListeners('iAm');
            this.client.close();
        }
    }

    connect(options) {
        this.client = new bacnet(options);
        this.client.on('iAm', (device) => this.onDeviceAdded(device));
    }

    onDeviceAdded(device) {
        this.devices.set(device.deviceId, device);
    }
    
    whoIs(lowLimit, highLimit, address, deviceListener) {
        lowLimit = this.toNumber(lowLimit);
        highLimit = this.toNumber(highLimit);
        this.client.on('iAm', deviceListener);
        this.client.whoIs(lowLimit, highLimit, address);
    }

    readProperty(address, objectType, objectInstance, propertyId, arrayIndex) {
        return new Promise((resolve, reject) => {
            if (!this.client) { return reject('Not connected'); }

            this.client.readProperty(address, objectType, objectInstance, propertyId, arrayIndex, (err, value) => {
                if (err) { return reject(err); }
                return resolve(value);
            });
        });
    }

    writeProperty(address, objectType, objectInstance, propertyId, priority, valueList) {
        priority = this.toNumber(priority) || 1;
        
        return new Promise((resolve, reject) => {
            if (!this.client) { return reject('Not connected'); }
            this.client.writeProperty(address, objectType, objectInstance, propertyId, priority, valueList, (err, value) => {
                if (err) { return reject(err); }
                return resolve(value);
            })
        });
    }

    readPropertyMultiple(address, requestArray) {
        return new Promise((resolve, reject) => {
            if (!this.client) { return reject('Not connected'); }

            this.client.readPropertyMultiple(address, requestArray, (err, value) => {
                if (err) { return reject(err); }
                return resolve(value);
            });
        });
    }
    
    writePropertyMultiple(address, valueList) {
        return new Promise((resolve, reject) => {
            if (!this.client) { return reject('Not connected'); }

            this.client.writePropertyMultiple(address, valueList, (err, value) => {
                if (err) { return reject(err); }
                return resolve(value);
            });
        });
    }

    toNumber(value) {
        return isNaN(parseInt(value)) ? undefined : +value;
    }
}

module.exports = Bacnet;
