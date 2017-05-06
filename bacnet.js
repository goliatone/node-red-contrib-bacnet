'use strict';


module.exports = function (RED) {
    const bacnet = require('bacstack');

    /**
     * Backnet Server Node
     */
    function BacnetClientNode(config) {
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
            adpuTimeout: this.adpuTimeout             // Wait twice as long for response
        };

        let node = this;

        node.initializeBacnetConnection = function() {
            log('Connecting to BACnet using ' + node.interface + ':' + node.port + '. Broadcasting to ' + node.broadcastAddress);

            node.client = backnet(options);

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
    RED.nodes.registerType('bacnet-client', BacnetClientNode);

    /**
     * BacnetDiscovery
     * The whoIs command discovers all BACnet
     * devices in the network.
     */
    function BacnetDiscovery(config) {
        RED.nodes.createNode(this, config);
    }
    RED.nodes.registerType('bacnet-discovery', BacnetDiscovery);

    /**
     * Bacnet Read Property
     *
     * The readProperty command reads a single
     * property of an object from a device.
     */
    function BacnetReadProperty(config) {
        RED.nodes.createNode(this, config);
        this.name = config.name;


        this.connection = null;

        let node = this;
        let bacnetClient = RED.nodes.getNode(config.server);
    }

    RED.nodes.registerType('bacnet-read', BacnetReadProperty);

    /**
     * Write Property
     *
     * The writeProperty command writes a single
     * property of an object to a device.
     */
    function BacnetWriteProperty(config) {
        RED.nodes.createNode(this, config);
    }
    RED.nodes.registerType('bacnet-write', BacnetWriteProperty);

    /**
     * Bacnet Read Property
     *
     * The readPropertyMultiple command
     * reads multiple properties in multiple
     * objects from a device.
     */
    function BacnetReadProperty(config) {
        RED.nodes.createNode(this, config);
        this.name = config.name;


        this.connection = null;

        let node = this;
        let bacnetClient = RED.nodes.getNode(config.server);
    }

    RED.nodes.registerType('bacnet-read-multiple', BacnetReadProperty);
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
