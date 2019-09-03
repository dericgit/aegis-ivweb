const zmq = require('axon');
const client = zmq.socket('push');
const port = global.pjconfig.dispatcher.port;
const address = global.pjconfig.dispatcher.address;
const service = global.pjconfig.dispatcher.subscribe;

const log4js = require('log4js');
const logger = log4js.getLogger();

client.connect("tcp://" + address + ":" + port);

/**
 * dispatcher
 * @returns {Stream}
 */
module.exports = function () {

    return {
        process: function (data) {
            data.data.forEach(function (value) {
                var str = JSON.stringify(value);
                client.send(service + value.id + '| ' + str);
                logger.debug('dispatcher a message : ' + 'badjs' + ' ' + str);
            });
        }
    };
};
