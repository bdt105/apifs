"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const serveurFileSystem_class_1 = require("./serveurFileSystem.class");
let app = express();
// For POST-Support
let bodyParser = require('body-parser');
let multer = require('multer');
let upload = multer();
app.use(bodyParser());
app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*'); // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE'); // Request methods you wish to allow    
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type'); // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Credentials', 'true'); // Set to true if you need the website to include cookies in the requests sent, to the API (e.g. in case you use sessions)
    // Pass to next layer of middleware
    next();
});
let vm = new serveurFileSystem_class_1.ServeurFileSystem(app);
vm.assign();
app.listen(3000);
//# sourceMappingURL=server.js.map