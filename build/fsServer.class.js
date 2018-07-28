"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const myToolbox_1 = require("./myToolbox");
const util_1 = require("util");
class FsServer {
    constructor(app, connexion, configuration) {
        this.myToolbox = new myToolbox_1.MyToolbox();
        this.app = app;
        this.connexion = connexion;
        this.configuration = configuration;
    }
    formatResult(data, originalLength, offset, limit, fileName, directory, searchParams) {
        let fileConfiguration = this.myToolbox.getFileOriginalInformation(fileName, directory);
        let ret = {
            "fileName": fileName, "directory": directory, "originalLength": originalLength,
            "offset": offset, "limit": limit, "searchParams": searchParams, "length": data.length,
            "originalFileInformation": fileConfiguration, "data": data
        };
        return ret;
    }
    truncData(data, offset, limit) {
        if (!Number.isNaN(limit) && offset > 0) {
            data.splice(0, offset);
            data.splice(limit, data.length);
        }
        else {
            if (!Number.isNaN(limit)) {
                data.splice(limit, data.length);
            }
        }
    }
    truncFile(data, offset, limit, fileName, directory, searchParams) {
        let ret = data;
        if (this.myToolbox.isJson(data)) {
            let dat = this.myToolbox.parseJson(data);
            if (Array.isArray(dat)) {
                if (searchParams) {
                    if (!searchParams.allFields) {
                        dat = this.myToolbox.filterArrayOfObjects(dat, searchParams.fieldName, searchParams.searchTerm, searchParams.caseSensitive, searchParams.accentSensitive, searchParams.exactMatching, searchParams.include);
                    }
                    else {
                        dat = this.myToolbox.filterArrayOfObjectsAllFields(dat, searchParams.searchTerm, searchParams.caseSensitive, searchParams.accentSensitive, searchParams.exactMatching, searchParams.include);
                    }
                }
                if (dat && dat.length > 0) {
                    let originalLength = dat.length;
                    this.truncData(dat, offset, limit);
                    ret = this.formatResult(dat, originalLength, offset, limit, fileName, directory, searchParams);
                }
                else {
                    ret = null;
                }
            }
            else {
                ret = dat;
            }
        }
        else {
            if (!Number.isNaN(limit) && !Number.isNaN(offset)) {
                ret = data.substr(offset, limit);
            }
        }
        return ret;
    }
    addDataTofiles(files, directory) {
        let ret = [];
        if (files && Array.isArray(files)) {
            for (var i = 0; i < files.length; i++) {
                let f = this.myToolbox.getFileNameWithoutExtension(files[i]);
                let configurationFileName = f + '.configuration.json';
                let plusFileName = f + '.plus.json';
                let fs = require('fs');
                let fstat = fs.statSync(this.myToolbox.getDataDirectory(directory) + '/' + files[i]);
                let file = {
                    "directory": directory,
                    "originalFileName": files[i],
                    "fileName": f + '.json',
                    "configurationFileName": configurationFileName,
                    "plusFileName": plusFileName,
                    "stat": fstat
                };
                ret.push(file);
            }
        }
        return ret;
    }
    deleteFile(directory, fileName) {
        let ret = null;
        let fs = require('fs');
        let path = this.myToolbox.getDataDirectory(directory) + '/' + fileName;
        if (fs.existsSync(path)) {
            let r = fs.unlinkSync(path);
            ret = this.myToolbox.message("file " + path + " deleted");
        }
        else {
            ret = this.myToolbox.errorMessage("file " + path + " does not exist");
        }
        return ret;
    }
    assign() {
        this.app.get('/', (request, response) => {
            response.send('API Serveur File System is running');
        });
        let multer = require('multer');
        let upload = multer();
        this.app.post('/', upload.array(), (request, response) => {
            if (!this.myToolbox.checkToken(this.connexion, request.body.token, response))
                return;
            let directory = request.body.directory;
            let fileName = request.body.fileName;
            let limit = Number.parseInt(request.body.limit);
            if (request.body.limit && Number.isNaN(limit)) {
                response.status(400);
                response.send(JSON.stringify(this.myToolbox.errorMessage("limit must be an integer or absent")));
                return;
            }
            let offset = Number.parseInt(request.body.offset);
            if (request.body.offset && Number.isNaN(offset)) {
                response.status(400);
                response.send(JSON.stringify(this.myToolbox.errorMessage("offset must be an integer or absent")));
                return;
            }
            let searchParams = request.body.searchParams;
            if (searchParams && !util_1.isObject(searchParams)) {
                response.status(400);
                response.send(JSON.stringify(this.myToolbox.errorMessage("searchParams must be an object (searchParams.fieldName, searchParams.searchTerm, searchParams.caseSensitive, searchParams.accentSensitive, searchParams.exactMatching, searchParams.include) or absent")));
                return;
            }
            let fs = require('fs');
            let path = (fileName ? this.myToolbox.getDataDirectory(directory) + '/' + fileName : this.myToolbox.getDataDirectory(directory));
            if (fs.existsSync(path)) {
                if (fileName) {
                    fs.readFile(path, 'utf8', (err, data) => {
                        if (err) {
                            response.status(404);
                            response.send(JSON.stringify(this.myToolbox.errorMessage(err)));
                        }
                        else {
                            let ret = this.truncFile(data, offset, limit, fileName, directory, searchParams);
                            if (!ret) {
                                response.status(404);
                            }
                            else {
                                response.status(200);
                                if (this.myToolbox.isJson(ret)) {
                                    response.setHeader('content-type', 'application/json');
                                }
                            }
                            response.send(ret);
                        }
                    });
                }
                else {
                    fs.readdir(this.myToolbox.getDataDirectory(directory), (err, files) => {
                        response.status(200);
                        response.setHeader('content-type', 'application/json');
                        let ret = this.addDataTofiles(files, directory);
                        let originalLength = ret.length;
                        this.truncData(ret, offset, limit);
                        let extra = this.formatResult(ret, originalLength, offset, limit, fileName, directory, searchParams);
                        response.send(extra);
                    });
                }
            }
            else {
                response.status(404);
                response.send(JSON.stringify(this.myToolbox.errorMessage("file " + path + " does not exist")));
            }
        });
        this.app.put('/', upload.array(), (request, response) => {
            if (!this.myToolbox.checkToken(this.connexion, request.body.token, response))
                return;
            let directory = this.myToolbox.getDataDirectory(request.body.directory);
            let fileName = request.body.fileName;
            let content = request.body.content;
            let fs = require('fs');
            let path = directory + '/' + fileName;
            if (!fs.existsSync(directory)) {
                fs.mkdirSync(directory);
            }
            if (fs.existsSync(directory)) {
                fs.writeFile(path, content, (err) => {
                    if (err) {
                        response.status(404);
                        response.send(JSON.stringify(this.myToolbox.errorMessage(err)));
                    }
                    else {
                        response.status(200);
                        response.setHeader('content-type', 'application/json');
                        response.send(this.myToolbox.message("file " + path + " created"));
                    }
                });
            }
            else {
                response.status(404);
                response.send(JSON.stringify(this.myToolbox.errorMessage("directory " + request.body.directory + " does not exist")));
            }
        });
        this.app.delete('/', upload.array(), (request, response) => {
            if (!this.myToolbox.checkToken(this.connexion, request.body.token, response))
                return;
            let directory = this.myToolbox.getDataDirectory(request.body.directory);
            let fileName = request.body.fileName;
            let originalFileName = request.body.originalFileName;
            let configurationFileName = request.body.configurationFileName;
            let plusFileName = request.body.plusFileName;
            let ret = [];
            ret.push(this.deleteFile(directory, fileName));
            ret.push(this.deleteFile(directory + '/original', originalFileName));
            ret.push(this.deleteFile(directory, configurationFileName));
            ret.push(this.deleteFile(directory, plusFileName));
            response.status(200);
            response.setHeader('content-type', 'application/json');
            response.send(ret);
        });
        this.app.patch('/', upload.array(), (request, response) => {
            if (!this.myToolbox.checkToken(this.connexion, request.body.token, response))
                return;
            let directory = this.myToolbox.getDataDirectory(request.body.directory);
            let fileName = request.body.fileName;
            let content = request.body.content;
            let fs = require('fs');
            let path = directory + '/' + fileName;
            if (fs.existsSync(path)) {
                fs.appendFile(path, content, (err) => {
                    if (err) {
                        response.status(404);
                        response.send(JSON.stringify(this.myToolbox.errorMessage(err)));
                    }
                    else {
                        response.status(200);
                        response.setHeader('content-type', 'application/json');
                        response.send(this.myToolbox.message("file " + path + " appended"));
                    }
                });
            }
            else {
                response.status(404);
                response.send(JSON.stringify(this.myToolbox.errorMessage("file " + request.body.directory + "/" + fileName + " does not exist")));
            }
        });
        this.app.get('/xxx/:yyy/:zzz', upload.array(), (request, response) => {
            if (!this.myToolbox.checkToken(this.connexion, request.body.token, response))
                return;
            let yyy = request.params.yyy;
            let zzz = request.params.zzz;
            // Do someting
        });
    }
}
exports.FsServer = FsServer;
//# sourceMappingURL=fsServer.class.js.map