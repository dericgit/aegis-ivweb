const deepAddNumber = (obj) => function (...args) {
    return (key, number) => {
        let current = obj;
        args.forEach(path => {
            if (!current[path]) {
                current[path] = {};
            }
            current = current[path];
        })
        current[key] = (current[key] || 0) + number;
    }
}

const merge = (obj1, obj2) => {
    for (let key in obj2) {
        deepAddNumber(obj1)()(key, obj2[key]);
    }
    return obj1;
}

module.exports = {
    merge
}
