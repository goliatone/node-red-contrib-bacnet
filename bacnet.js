'use strict';
const debug = require('debug')('node_red_contrib_bacnet');

module.exports = function (RED) {
    const bacnet = require('bacstack');

    /**
     * Backnet Server Node
     */
    function BacnetServerNode(config) {
        RED.nodes.createNode(this, config);

        log('Create node: %s:%s %s', config.interface, config.port, config.broadcastAddress, config.adpuTimeout);

        this.port = config.port;
        this.interface = config.interface;
        this.broadcastAddress = config.broadcastAddress;
        this.adpuTimeout = config.timeout;
    }
    RED.nodes.registerType('bacnet-server', BacnetServerNode);

    /**
     * BacnetDiscovery
     * The whoIs command discovers all BACnet
     * devices in the network.
     *
     * lowLimit [number] - Minimal device instance number to search for. Optional.
     * highLimit [number] - Maximal device instance number to search for. Optional.
     * address [string] - Unicast address if command should device directly. Optional.
     */
    function BacnetDiscovery(config) {
        RED.nodes.createNode(this, config);

        this.name = config.name;

        let options = RED.nodes.getNode(config.server);

        this.status({fill:'green', shape: 'dot', text: 'connected'});

        return;

        let client = bacnet(options);

        client.on('iAm', (address, deviceId, maxAdpu, segmentation, vendorId) => {
            log('address: ', address, ' - deviceId: ', deviceId, ' - maxAdpu: ', maxAdpu, ' - segmentation: ', segmentation, ' - vendorId: ', vendorId);
        });

        let lowLimit = config.lowLimit,
            highLimit = config.highLimit,
            address = config.address;

        client.whoIs(lowLimit, highLimit, address);
    }
    RED.nodes.registerType('bacnet-discovery', BacnetDiscovery);

    /**
     * Bacnet Read Property
     *
     * The readProperty command reads a single
     * property of an object from a device.
     *
     * address [string] - IP address of the target device.
     * objectType [number] - The BACNET object type to read.
     * objectInstance [number] - The BACNET object instance to read.
     * propertyId [number] - The BACNET property id in the specified object to read.
     * arrayIndex [number] - The array index of the property to be read.
     * next [function] - The callback containing an error, in case of a failure and value object in case of success.
     */
    function BacnetReadProperty(config) {
        RED.nodes.createNode(this, config);
        this.name = config.name;

        this.address = config.address;
        this.objectType = config.objectType;
        this.objectInstance = config.objectInstance;
        this.propertyId = config.propertyId;
        this.arrayIndex = config.arrayIndex;

        this.connection = null;

        let node = this;
        let server = RED.nodes.getNode(config.server);

        return;

        server.readProperty(this.address, this.objectType, this.objectInstance, this.propertyId, this.arrayIndex, function(err, value) {
            log('value: ', value);
        });
    }

    RED.nodes.registerType('bacnet-read', BacnetReadProperty);


    /**
     * Write Property
     *
     * The writeProperty command writes a single
     * property of an object to a device.
     *
     * address [string] - IP address of the target device.
     * objectType [number] - The BACNET object type to write.
     * objectInstance [number] - IP address of the target device.
     * propertyId [number] - The BACNET property id in the specified object to write.
     * priority [number] - The priority to be used for writing to the property.
     * valueList [array] - A list of values to be written to the speicifed property. The Tag value has to be a BacnetApplicationTags declaration as specified in lib/bacnet-enum.js.
     * next [function] - The callback containing an error, in case of a failure and value object in case of success.
     */
    function BacnetWriteProperty(config) {
        RED.nodes.createNode(this, config);

        this.name = config.name;

        log('Create write property: %s %s %s', config.address, config.objectType, config.name);

        var address = this.address = config.address;
        var objectType = this.objectType = config.objectType;
        var objectInstance = this.objectInstance = config.objectInstance;
        var propertyId = this.propertyId = config.propertyId;
        var priority = this.priority = config.priority;
        var applicationTag = this.applicationTag = config.applicationTag;
        var value = this.value = config.value;

        var valueList = this.valueList = [{
            Tag: applicationTag,
            Value: value
        }];

        log('Write property: %s %s %s %s %s %j',
            address,
            objectType,
            objectInstance,
            propertyId,
            priority,
            valueList
        );

        this.connection = null;

        let node = this;
        let server = RED.nodes.getNode(config.server);
        // server.writeProperty(this.address, this.objectType, this.objectInstance, this.propertyId, this.priority, this.valueList, function(err, value) {
        //     log('value: ', value);
        // });
    }
    RED.nodes.registerType('bacnet-write', BacnetWriteProperty);

};


function timestamp() {
    return new Date()
        .toISOString()
        .replace(/T/, ' ').
        replace(/\..+/, '');
}

function log(msg, ...args) {
    let message = ['BACnet @' + timestamp() + ': ' + msg];

    if (args) {
        args = message.concat(args);
    }
    console.log.apply(console, args);
}
