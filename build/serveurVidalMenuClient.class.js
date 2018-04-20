"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ServeurVidalMenuClient {
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
    exec(cmd, params) {
        const { spawnSync } = require('child_process');
        const child = spawnSync(cmd, params);
        return child;
    }
    assign() {
        this.app.get('/vidalmenu', function (request, response) {
            response.send('API ServeurVidalMenuClient is running');
        });
        let multer = require('multer');
        let upload = multer();
        /*
                this.app.post('/get', upload.array(), (request: any, response: any) => {
                    let login = request.body.login;
                    let password = request.body.password;
                
                    let callback = (err: any, data: any) => {
                        if (err){
                            response.status(404);
                            response.send(JSON.stringify(this.errorMessage(err)));
                        }else{
                            response.status(200);
                            response.setHeader('content-type', 'application/json');
                            response.send(JSON.stringify(ret));
                        }
                    }
                
                    this.connexion.getJwt(callback, login, password);
                });
                
                this.app.post('/check', upload.array(), (request: any, response: any) => {
                    let token = request.body.token;
                    let jwt = require('jsonwebtoken');
                    let ret = this.connexion.checkJwt(token);
                    response.setHeader('content-type', 'application/json');
                    response.status(ret.token ? 200 : 404);
                    response.send(JSON.stringify(ret));
                    this.myToolbox.logg("/check");
                    this.myToolbox.logg(JSON.stringify(ret));
                });
                
                this.app.post('/encrypt', upload.array(), (request: any, response: any) => {
                    let text = request.body.text;
        
                    let encrypt = this.connexion.encrypt(text);
                    let ret = {"encrypted": encrypt};
        
                    response.status(200);
                    response.setHeader('content-type', 'application/json');
                    response.send(JSON.stringify(ret));
                    
                    this.myToolbox.logg("/crypt");
                    this.myToolbox.logg(JSON.stringify(ret));
                });
        */
        this.app.get('/vidalmenu/:cmd/:param', upload.array(), (request, response) => {
            let cmd = request.params.cmd;
            let param = request.params.param;
            let params = [];
            if (param) {
                params.push(param);
            }
            let result = this.exec(this.conf.localisation + cmd, params);
            if (result.stdout) {
                response.status(200);
                response.setHeader('content-type', 'text/plain');
                response.send(result.stdout.toString());
            }
            else {
                if (result.stderr) {
                    response.status(500);
                    response.setHeader('content-type', 'text/plain');
                    response.send(result.stderr.toString());
                }
                else {
                    response.status(404);
                    response.setHeader('content-type', 'text/plain');
                    response.send("Unknown problem");
                    console.log(this.conf.localisation + cmd);
                    console.log(params);
                    console.log(result);
                }
            }
        });
    }
}
exports.ServeurVidalMenuClient = ServeurVidalMenuClient;
//# sourceMappingURL=serveurVidalMenuClient.class.js.map