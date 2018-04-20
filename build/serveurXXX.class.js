"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ServeurXXX {
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
    assign() {
        this.app.get('/xxx', function (request, response) {
            response.send('API ServeurXXX is running');
        });
        let multer = require('multer');
        let upload = multer();
        this.app.post('/xxx/get', upload.array(), (request, response) => {
            let xxx = request.body.xxx;
            // Do someting
        });
        this.app.put('/xxx/put', upload.array(), (request, response) => {
            let xxx = request.body.xxx;
            // Do someting
        });
        this.app.delete('/xxx/delete', upload.array(), (request, response) => {
            let xxx = request.body.xxx;
            // Do someting
        });
        this.app.patch('/xxx/patch', upload.array(), (request, response) => {
            let xxx = request.body.xxx;
            // Do someting
        });
        this.app.get('/xxx/:yyy/:zzz', upload.array(), (request, response) => {
            let yyy = request.params.yyy;
            let zzz = request.params.zzz;
            // Do someting
        });
    }
}
exports.ServeurXXX = ServeurXXX;
//# sourceMappingURL=serveurXXX.class.js.map