"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dist_1 = require("bdt105toolbox/dist");
const util_1 = require("util");
class ServeurFileSystem {
    constructor(app, connexion) {
        this.toolbox = new dist_1.Toolbox();
        this.app = app;
        this.connexion = connexion;
    }
    errorMessage(text) {
        return { "status": "ERR", "message": text };
    }
    message(text) {
        return { "status": "OK", "message": text };
    }
    checkToken(token, response) {
        if (this.connexion.jwtConfiguration && !this.connexion.isTokenValid(token)) {
            response.status(403);
            response.send(JSON.stringify(this.errorMessage("Invalid token")));
            return false;
        }
        return true;
    }
    truncFile(data, offset, limit, searchParams = null) {
        let ret = data;
        if (this.toolbox.isJson(data)) {
            let tab = [];
            let dat = this.toolbox.parseJson(data);
            if (Array.isArray(dat)) {
                if (searchParams) {
                    dat = this.toolbox.filterArrayOfObjects(dat, searchParams.keySearch, searchParams.keyValue, searchParams.caseSensitive, searchParams.accentSensitive, searchParams.exactMatching, searchParams.include);
                }
                if (dat && dat.length > 0) {
                    let off = dat.length >= offset ? offset : 0;
                    let max = dat.length >= offset + limit ? offset + limit : dat.length;
                    for (var i = off; i < max; i++) {
                        tab.push(dat[i]);
                    }
                    ret = JSON.stringify(tab);
                }
                else {
                    ret = "";
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
            if (Number.isNaN(limit)) {
                response.status(400);
                response.send(JSON.stringify(this.errorMessage("limit must be an integer or absent")));
                return;
            }
            let offset = Number.parseInt(request.body.offset);
            if (Number.isNaN(offset)) {
                response.status(400);
                response.send(JSON.stringify(this.errorMessage("offset must be an integer or absent")));
                return;
            }
            let searchParams = request.body.searchParams;
            if (searchParams && !util_1.isObject(searchParams)) {
                response.status(400);
                response.send(JSON.stringify(this.errorMessage("searchParams must be an object (searchParams.keySearch, searchParams.keyValue, searchParams.caseSensitive, searchParams.accentSensitive, searchParams.exactMatching, searchParams.include) or absent")));
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
                            response.status(200);
                            response.setHeader('content-type', 'application/json');
                            if ((offset && limit) || searchParams) {
                                let ret = this.truncFile(data, offset, limit, searchParams);
                                if (!ret) {
                                    response.status(404);
                                }
                                response.send(ret);
                            }
                            else {
                                response.send(data);
                            }
                        }
                    });
                }
                else {
                    fs.readdir(directory, (err, files) => {
                        response.status(200);
                        response.setHeader('content-type', 'application/json');
                        response.send(files);
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