module.exports = function (RED) {
    const Bacnet = require('./lib/bacnet');

    /**
     * Backnet Server Node
     */
    class BacnetServerNode {
        constructor(config) {
            RED.nodes.createNode(this, config);
            this.connection = new Bacnet(config);
            this.on('close', () => this.connection.onDestroy());
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

            const { lowLimit, highLimit, address } = config;
            const server = RED.nodes.getNode(config.server);
            server.connection.whoIs(lowLimit, highLimit, address, (device) => this.send({ device: device }));
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
            const { address, objectType, objectInstance, propertyId, arrayIndex } = Object.assign({}, this.defaults, input.device);
            this.server.connection.readProperty(
                address,
                objectType,
                objectInstance,
                propertyId,
                arrayIndex
            )
                .then((payload) => {
                    const message = Object.assign({}, input, { payload: payload });
                    this.send(message);
                })
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
                type: +(input.payload.applicationTag || this.defaults.applicationTag),
                value: (input.payload.value || this.defaults.value) + Math.random() * 10000
            }];
            const { address, objectType, objectInstance, propertyId, priority } = Object.assign({}, this.defaults, input.device, input.payload);
            console.log('write', valueList)
            this.server.connection.writeProperty(
                address,
                objectType,
                objectInstance,
                propertyId,
                priority,
                valueList
            )
                .then(() => this.send(input))
                .catch((error) => this.error({ error: error }));
        }
    }
    RED.nodes.registerType('bacnet-write', BacnetWriteProperty);
    
        /**
     * Bacnet Read Property Multiple
     *
     * The readPropertyMultiple command reads multiple properties from multiple device objects
     */
    class BacnetReadPropertyMultiple {
        constructor(config) {
            RED.nodes.createNode(this, config);
            this.server = RED.nodes.getNode(config.server);
            this.defaults = config;
            this.on('input', this.onInput);
        }

        onInput(input) {
            if (!input.requestArray) {
                this.error('requestArray not provided for Bacnet read multiple.')
                return;
            }
            const { address } = Object.assign({}, this.defaults, input.device);
            this.server.connection.readPropertyMultiple(
                address,
                input.requestArray,
            )
                .then((payload) => {
                    const message = Object.assign({}, input, { payload: payload });
                    this.send(message);
                })
                .catch((error) => this.error({ error: error }));
        };
    }
    RED.nodes.registerType('bacnet-read-multiple', BacnetReadPropertyMultiple);
    
        /**
     * Bacnet Write Property Multiple
     *
     * The writePropertyMultiple command writes multiple properties to multiple device objects
     */
    class BacnetWritePropertyMultiple {
        constructor(config) {
            RED.nodes.createNode(this, config);
            this.server = RED.nodes.getNode(config.server);
            this.defaults = config;
            this.on('input', this.onInput);
        }

        onInput(input) {
            if (!input.valueList) {
                this.error('valueList not provided for Bacnet write multiple.');
                return;
            }

            const { address } = Object.assign({}, this.defaults, input.device);
            this.server.connection.writePropertyMultiple(
                address,
                input.valueList,
            )
                .then(() => this.send(input))
                .catch((error) => this.error({ error: error }));
        };
    }
    RED.nodes.registerType('bacnet-write-multiple', BacnetWritePropertyMultiple);
};
