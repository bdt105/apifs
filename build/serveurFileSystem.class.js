"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dist_1 = require("bdt105toolbox/dist");
const util_1 = require("util");
class ServeurFileSystem {
    constructor(app, connexion, configuration) {
        this.toolbox = new dist_1.Toolbox();
        this.app = app;
        this.connexion = connexion;
        this.configuration = configuration;
    }
    errorMessage(text) {
        return { "status": "ERR", "message": text };
    }
    message(text) {
        return { "status": "OK", "message": text };
    }
    isUserAllowed(email) {
        let allowedUsers = this.configuration.allowedUsers;
        let temp = this.toolbox.filterArrayOfObjects(allowedUsers, "email", email, false, false, true, false);
        return temp.length > 0;
    }
    checkToken(token, response) {
        if (this.connexion.jwtConfiguration && !this.connexion.isTokenValid(token)) {
            response.status(403);
            response.send(JSON.stringify(this.errorMessage("Invalid token or user not allowed")));
            return false;
        }
        else {
            let tok = this.connexion.checkJwt(token);
            if (tok.decoded) {
                if (!this.isUserAllowed(tok.decoded.email)) {
                    response.status(403);
                    response.send(JSON.stringify(this.errorMessage("Invalid token or user not allowed")));
                    return false;
                }
            }
        }
        return true;
    }
    prepareStrinForSearch(text, caseSensitive, accentSensitive) {
        let t = text;
        if (!accentSensitive) {
            t = this.toolbox.noAccent(t);
        }
        if (!caseSensitive) {
            t = t.toUpperCase();
        }
        return t;
    }
    getFileConfiguration(fileName, directory) {
        let ret = {};
        for (var i = 0; i < this.configuration.fileConfiguration.length; i++) {
            if (this.configuration.fileConfiguration[i].directory == directory &&
                this.configuration.fileConfiguration[i].fileName == fileName) {
                ret = this.configuration.fileConfiguration[i];
            }
        }
        return ret;
    }
    formatResult(data, originalLength, offset, limit, fileName, directory, searchParams) {
        let fileConfiguration = this.getFileConfiguration(fileName, directory);
        let ret = {
            "fileName": fileName, "directory": directory, "originalLength": originalLength,
            "offset": offset, "limit": limit, "searchParams": searchParams, "length": data.length,
            "originalFileInformation": fileConfiguration, "data": data
        };
        return ret;
    }
    truncData(data, offset, limit) {
        if (offset > 0) {
            data.splice(0, offset);
            data.splice(limit, data.length);
        }
        else {
            data.splice(limit, data.length);
        }
        // let ret = [];
        // let off = data.length >= offset ? offset : 0;
        // let max = data.length >= offset + limit ? offset + limit : data.length;
        // for (var i = off; i < max; i++) {
        //     ret.push(data[i]);
        // }
        // return ret;
    }
    truncFile(data, offset, limit, fileName, directory, searchParams) {
        let ret = data;
        if (this.toolbox.isJson(data)) {
            let dat = this.toolbox.parseJson(data);
            if (Array.isArray(dat)) {
                if (searchParams) {
                    if (!searchParams.allFields) {
                        dat = this.toolbox.filterArrayOfObjects(dat, searchParams.fieldName, searchParams.searchTerm, searchParams.caseSensitive, searchParams.accentSensitive, searchParams.exactMatching, searchParams.include);
                    }
                    else {
                        dat = this.toolbox.filterArrayOfObjectsAllFields(dat, searchParams.searchTerm, searchParams.caseSensitive, searchParams.accentSensitive, searchParams.exactMatching, searchParams.include);
                    }
                }
                if (dat && dat.length > 0) {
                    let originalLength = dat.length;
                    let tab = this.truncData(dat, offset, limit);
                    ret = this.formatResult(dat, originalLength, offset, limit, fileName, directory, searchParams);
                }
                else {
                    ret = null;
                }
            }
        }
        else {
            ret = data.substr(offset, limit);
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
            if (!this.checkToken(request.body.token, response))
                return;
            let directory = request.body.directory;
            let fileName = request.body.fileName;
            let limit = Number.parseInt(request.body.limit);
            if (request.body.limit && Number.isNaN(limit)) {
                response.status(400);
                response.send(JSON.stringify(this.errorMessage("limit must be an integer or absent")));
                return;
            }
            let offset = Number.parseInt(request.body.offset);
            if (request.body.offset && Number.isNaN(offset)) {
                response.status(400);
                response.send(JSON.stringify(this.errorMessage("offset must be an integer or absent")));
                return;
            }
            let searchParams = request.body.searchParams;
            if (searchParams && !util_1.isObject(searchParams)) {
                response.status(400);
                response.send(JSON.stringify(this.errorMessage("searchParams must be an object (searchParams.fieldName, searchParams.searchTerm, searchParams.caseSensitive, searchParams.accentSensitive, searchParams.exactMatching, searchParams.include) or absent")));
                return;
            }
            let fs = require('fs');
            let path = (fileName ? directory + '/' + fileName : directory);
            if (fs.existsSync(path)) {
                if (fileName) {
                    fs.readFile(path, 'utf8', (err, data) => {
                        if (err) {
                            response.status(404);
                            response.send(JSON.stringify(this.errorMessage(err)));
                        }
                        else {
                            data = data.replace('{"Mercalys":[', '[').replace("]}", "]");
                            response.status(200);
                            response.setHeader('content-type', 'application/json');
                            if ((offset != null && limit != null) || searchParams) {
                                let ret = this.truncFile(data, offset, limit, fileName, directory, searchParams);
                                if (!ret) {
                                    response.status(404);
                                }
                                response.send(ret);
                            }
                            else {
                                let resu = this.formatResult(data, data, offset, limit, fileName, directory, searchParams);
                                response.send(resu);
                            }
                        }
                    });
                }
                else {
                    fs.readdir(directory, (err, files) => {
                        response.status(200);
                        response.setHeader('content-type', 'application/json');
                        let originalLength = files.length;
                        let resu = this.truncData(files, offset, limit);
                        let extra = this.formatResult(files, originalLength, offset, limit, fileName, directory, searchParams);
                        response.send(extra);
                    });
                }
            }
            else {
                response.status(404);
                response.send(JSON.stringify(this.errorMessage("file " + path + " does not exist")));
            }
        });
        this.app.put('/', upload.array(), (request, response) => {
            if (!this.checkToken(request.body.token, response))
                return;
            let directory = request.body.directory;
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
                        response.send(JSON.stringify(this.errorMessage(err)));
                    }
                    else {
                        response.status(200);
                        response.setHeader('content-type', 'application/json');
                        response.send(this.message("file " + path + " created"));
                    }
                });
            }
            else {
                response.status(404);
                response.send(JSON.stringify(this.errorMessage("directory " + directory + " does not exist")));
            }
        });
        this.app.delete('/', upload.array(), (request, response) => {
            if (!this.checkToken(request.body.token, response))
                return;
            let directory = request.body.directory;
            let fileName = request.body.fileName;
            let fs = require('fs');
            let path = directory + '/' + fileName;
            if (fs.existsSync(path)) {
                fs.unlink(path, (err) => {
                    if (err) {
                        response.status(404);
                        response.send(JSON.stringify(this.errorMessage(err)));
                    }
                    else {
                        response.status(200);
                        response.setHeader('content-type', 'application/json');
                        response.send(this.message("file " + path + " deleted"));
                    }
                });
            }
            else {
                response.status(404);
                response.send(JSON.stringify(this.errorMessage("file " + path + " does not exist")));
            }
        });
        this.app.patch('/', upload.array(), (request, response) => {
            if (!this.checkToken(request.body.token, response))
                return;
            let directory = request.body.directory;
            let fileName = request.body.fileName;
            let content = request.body.content;
            let fs = require('fs');
            let path = directory + '/' + fileName;
            if (fs.existsSync(path)) {
                fs.appendFile(path, content, (err) => {
                    if (err) {
                        response.status(404);
                        response.send(JSON.stringify(this.errorMessage(err)));
                    }
                    else {
                        response.status(200);
                        response.setHeader('content-type', 'application/json');
                        response.send(this.message("file " + path + " appended"));
                    }
                });
            }
            else {
                response.status(404);
                response.send(JSON.stringify(this.errorMessage("file " + path + " does not exist")));
            }
        });
        this.app.get('/xxx/:yyy/:zzz', upload.array(), (request, response) => {
            if (!this.checkToken(request.body.token, response))
                return;
            let yyy = request.params.yyy;
            let zzz = request.params.zzz;
            // Do someting
        });
    }
}
exports.ServeurFileSystem = ServeurFileSystem;
//# sourceMappingURL=serveurFileSystem.class.js.map