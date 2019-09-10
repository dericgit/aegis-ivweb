const map = require('map-stream');
const mq = require('axon');
const client = mq.socket('sub');
const port = global.pjconfig.acceptor.port;
const address = global.pjconfig.acceptor.address;
const service = global.pjconfig.acceptor.subscribe;

/**
 * dispatcher
 * @returns {Stream}
 */
module.exports = function () {
    const stream = map(function (data, fn) {
        fn(null, data);
    });
    client.connect("tcp://" + address + ":" + port);
    client.subscribe(service + "*");
    client.on('message', function (data) {
        stream.write(data);
    });
    return stream;
};
