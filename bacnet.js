'use strict';
const debug = require('debug')('node_red_contrib_bacnet');

module.exports = function (RED) {
    const bacnet = require('bacstack');

    /**
     * Backnet Server Node
     */
    function BacnetServerNode(config) {
        RED.nodes.createNode(this, config);

        this.port = config.port;
        this.interface = config.interface;
        this.broadcastAddress = config.broadcastAddress;
        this.adpuTimeout = config.adpuTimeout;

        this.client = null;

        let options = {
            port: this.port,                          // Use BAC1 as communication port
            interface: this.interface,                // Listen on a specific interface
            broadcastAddress: this.broadcastAddress,  // Use the subnet broadcast address
            adpuTimeout: this.timeout                 // Wait twice as long for response
        };

        let node = this;

        node.initializeBacnetConnection = function() {
            log('Connecting to BACnet using ' + node.interface + ':' + node.port + '. Broadcasting to ' + node.broadcastAddress);

            node.client = bacnet(options);

            //@TODO: bacstack currently does not emit errors.
            node.client.on('error', (err) => {
                log('BACnet connection error');
                log(err.message);
                log(err.stack);
                node.error('BACnet connection: ' + err.message);
            });
            return Promise.resolve(this.client);
        };

        node.on('close', ()=>{
            log('Disconnecting from BACnet at '+ node.interface + ':' + node.port);
            //@TODO bacstack does not implement a close method
            // node.client.close();
            node.client = null;
        });
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
        let client = bacnet(options);

        client.on('iAm', function(address, deviceId, maxAdpu, segmentation, vendorId) {
            log('address: ', address, ' - deviceId: ', deviceId, ' - maxAdpu: ', maxAdpu, ' - segmentation: ', segmentation, ' - vendorId: ', vendorId);
        });

        client.whoIs();
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

        this.address = config.address;
        this.objectType = config.objectType;
        this.objectInstance = config.objectInstance;
        this.propertyId = config.propertyId;
        this.priority = config.priority;
        this.valueList = config.valueList;

        this.connection = null;

        let node = this;
        let server = RED.nodes.getNode(config.server);
        server.writeProperty(this.address, this.objectType, this.objectInstance, this.propertyId, this.priority, this.valueList, function(err, value) {
            log('value: ', value);
        });
    }
    RED.nodes.registerType('bacnet-write', BacnetWriteProperty);

    /**
     * Bacnet Read Multiple Property
     *
     * The readPropertyMultiple command
     * reads multiple properties in multiple
     * objects from a device.
     */
    function BacnetReadProperties(config) {
        RED.nodes.createNode(this, config);
        this.name = config.name;


        this.connection = null;

        let node = this;
        let bacnetClient = RED.nodes.getNode(config.server);
    }

    RED.nodes.registerType('bacnet-read-multiple', BacnetReadProperties);
};


function timestamp() {
    return new Date()
        .toISOString()
        .replace(/T/, ' ').
        replace(/\..+/, '');
}

function log(msg, args) {
    if (args) {
        return console.log(timestamp() + ': ' + msg, args);
    }
    console.log(timestamp() + ': ' + msg);
}
