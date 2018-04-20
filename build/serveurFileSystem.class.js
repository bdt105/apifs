"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ServeurFileSystem {
    constructor(app) {
        this.app = app;
        this.loadConf();
    }
    loadConf() {
        var fs = require('fs');
        this.conf = JSON.parse(fs.readFileSync('conf.json', 'utf8'));
    }
    errorMessage(text) {
        return { "status": "ERR", "message": text };
    }
    message(text) {
        return { "status": "OK", "message": text };
    }
    assign() {
        this.app.get('/fs', function (request, response) {
            response.send('API Serveur File System is running');
        });
        let multer = require('multer');
        let upload = multer();
        this.app.post('/fs/get', upload.array(), (request, response) => {
            let name = request.body.name;
            let fileName = request.body.fileName;
            let fs = require('fs');
            let path = name + '/' + fileName;
            if (fs.existsSync(path)) {
                fs.readFile(path, 'utf8', function (err, data) {
                    if (err) {
                        response.status(404);
                        response.send(JSON.stringify(this.errorMessage(err)));
                    }
                    else {
                        response.status(200);
                        response.setHeader('content-type', 'application/json');
                        response.send(data);
                    }
                });
            }
            else {
                response.status(404);
                response.send(JSON.stringify(this.errorMessage("file " + path + " does not exist")));
            }
        });
        this.app.put('/fs/put', upload.array(), (request, response) => {
            let name = request.body.name;
            let fileName = request.body.fileName;
            let content = request.body.content;
            let fs = require('fs');
            let path = name + '/' + fileName;
            if (!fs.existsSync(name)) {
                fs.mkdirSync(name);
            }
            if (fs.existsSync(name)) {
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
                response.send(JSON.stringify(this.errorMessage("directory " + name + " does not exist")));
            }
        });
        this.app.delete('/fs/delete', upload.array(), (request, response) => {
            let name = request.body.name;
            let fileName = request.body.fileName;
            let fs = require('fs');
            let path = name + '/' + fileName;
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
        this.app.patch('/fs/patch', upload.array(), (request, response) => {
            let xxx = request.body.xxx;
            // Do someting
        });
        this.app.get('/fs/:yyy/:zzz', upload.array(), (request, response) => {
            let yyy = request.params.yyy;
            let zzz = request.params.zzz;
            // Do someting
        });
    }
}
exports.ServeurFileSystem = ServeurFileSystem;
//# sourceMappingURL=serveurFileSystem.class.js.map