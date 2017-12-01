module.exports = function (RED) {
    const Bacnet = require('./lib/bacnet');

    /**
     * Backnet Server Node
     */
    class BacnetServerNode {
        constructor(config) {
            RED.nodes.createNode(this, config);
            this.connection = new Bacnet(config);
            this.on('close', () => this.connection.onDestroy())
            
            this.whoIs = (options, listener) => this.connection.whoIs(options, listener);
            this.writeProperty = (options) => this.connection.writeProperty(options);
            this.readProperty = (options) => this.connection.readProperty(options);
        }
    }
    RED.nodes.registerType('bacnet-server', BacnetServerNode);

    /**
     * BacnetDiscovery
     * The whoIs command discovers all BACnet
     * devices in the network.
     */
    class BacnetDiscovery {
        constructor(config) {
            RED.nodes.createNode(this, config);
            this.status({fill:'green', shape: 'dot', text: 'connected'});

            const server = RED.nodes.getNode(config.server);
            server.whoIs(config, (payload) => this.send({ payload: payload }));
        }
    }
    RED.nodes.registerType('bacnet-discovery', BacnetDiscovery);

    /**
     * Bacnet Read Property
     *
     * The readProperty command reads a single
     * property of an object from a device.
     */
    class BacnetReadProperty {
        constructor(config) {
            RED.nodes.createNode(this, config);
            this.server = RED.nodes.getNode(config.server);
            this.defaults = config;
            this.on('input', this.onInput);
        }

        onInput(input) {
            const readOptions = Object.assign({}, this.defaults, input.payload);
            this.server.readProperty(readOptions)
                .then((payload) => this.send({ payload: payload }))
                .catch((error) => this.error({ error: error }));
        };
    }
    RED.nodes.registerType('bacnet-read', BacnetReadProperty);

    /**
     * Write Property
     *
     * The writeProperty command writes a single
     * property of an object to a device.
     */
    class BacnetWriteProperty {
        constructor(config) {
            RED.nodes.createNode(this, config);
            this.server = RED.nodes.getNode(config.server);
            this.defaults = config;
            this.on('input', this.onInput);
        }

        onInput(input) {
            const valueList = [{
                type: +(this.defaults.applicationTag || input.payload.applicationTag),
                value: this.defaults.value || input.payload.value
            }]
            const writeOptions = Object.assign({}, this.defaults, input.payload, { valueList: valueList });
            this.server.writeProperty(writeOptions)
                .then((payload) => this.send({ payload: payload }))
                .catch((error) => this.error({ error: error }));
        }
    }
    RED.nodes.registerType('bacnet-write', BacnetWriteProperty);
};
