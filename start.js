var process = require("child_process");
var path = require("path");

//var args = ["--debug", "--project"]
var args = []

console.log("========  aegis-acceptor ===========")
process.fork(path.join(__dirname, "aegis-acceptor", "app.js"), args)

setTimeout(function () {
    console.log(" ")
    console.log(" ")
    console.log(" ")
    console.log(" ")
    console.log("========== aegis-mq =========")
    process.fork(path.join(__dirname, "aegis-mq", "app.js"), args)

}, 2000)

setTimeout(function () {
    console.log(" ")
    console.log(" ")
    console.log(" ")
    console.log(" ")
    console.log("========= aegis-storage ==========")
    process.fork(path.join(__dirname, "aegis-storage", "app.js"), args)

}, 4000)

setTimeout(function () {

    console.log(" ")
    console.log(" ")
    console.log(" ")
    console.log(" ")
    console.log("========== aegis-web =========")
    process.fork(path.join(__dirname, "badjs-web", "app.js"), args)

}, 6000)
