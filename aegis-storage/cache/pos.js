const path = require('path');
const fs = require('fs');

function mkdir (_path) {
    if (!fs.existsSync(_path)) {
        fs.mkdir(_path, (err) => {
            if (err) {
                console.log(err);
            } else {
                console.log('mkdir ' + _path + 'success');
            }
        });
    }
}

module.exports = function () {
    mkdir(path.join(__dirname, 'errorMsg'));
    mkdir(path.join(__dirname, 'total'));
};
