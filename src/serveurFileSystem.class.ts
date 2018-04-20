import express = require('express');

export class ServeurFileSystem {
    private app: any;
    private conf: any;

    constructor(app: any){
        this.app = app;
        this.loadConf();
    }

    private loadConf(){
        var fs = require('fs');
        this.conf = JSON.parse(fs.readFileSync('conf.json', 'utf8'));
    }

    private errorMessage(text: string){
        return {"status": "ERR", "message": text};
    }
    
    private message(text: string){
        return {"status": "OK", "message": text};
    }

    public assign(){
        this.app.get('/fs', function (request: any, response: any) {
            response.send('API Serveur File System is running');
        });
        let multer = require('multer');
        let upload = multer();
        
        this.app.post('/fs/get', upload.array(), (request: any, response: any) => {
            let name = request.body.name;
            let fileName = request.body.fileName;
            let fs = require('fs');
            let path = name + '/' + fileName;
            if (fs.existsSync(path)) {
                fs.readFile(path, 'utf8', function (err: any,data: any) {
                    if (err) {
                        response.status(404);
                        response.send(JSON.stringify(this.errorMessage(err)));
                    }else{
                        response.status(200);
                        response.setHeader('content-type', 'application/json');
                        response.send(data);
                    }
                });            
            }else{
                response.status(404);
                response.send(JSON.stringify(this.errorMessage("file " + path + " does not exist")));
            }
        });
        
        this.app.put('/fs/put', upload.array(), (request: any, response: any) => {
            let name = request.body.name;
            let fileName = request.body.fileName;
            let content = request.body.content;
            let fs = require('fs');
            let path = name + '/' + fileName;
            if (!fs.existsSync(name)) {
                fs.mkdirSync(name);
            }
            if (fs.existsSync(name)) {
                fs.writeFile(path, content, (err: any) => {
                    if (err) {
                        response.status(404);
                        response.send(JSON.stringify(this.errorMessage(err)));
                    }else{
                        response.status(200);
                        response.setHeader('content-type', 'application/json');
                        response.send(this.message("file " + path + " created"));
                    }
                });           
            }else{
                response.status(404);
                response.send(JSON.stringify(this.errorMessage("directory " + name + " does not exist")));
            }
        });
        
        this.app.delete('/fs/delete', upload.array(), (request: any, response: any) => {
            let name = request.body.name;
            let fileName = request.body.fileName;
            let fs = require('fs');
            let path = name + '/' + fileName;
            if (fs.existsSync(path)) {
                fs.unlink(path, (err: any) => {
                    if (err) {
                        response.status(404);
                        response.send(JSON.stringify(this.errorMessage(err)));
                    }else{
                        response.status(200);
                        response.setHeader('content-type', 'application/json');
                        response.send(this.message("file " + path + " deleted"));
                    }
                });
            }else{
                response.status(404);
                response.send(JSON.stringify(this.errorMessage("file " + path + " does not exist")));
            }
        });
        
        this.app.patch('/fs/patch', upload.array(), (request: any, response: any) => {
            let xxx = request.body.xxx;

            // Do someting
        });
        
        this.app.get('/fs/:yyy/:zzz', upload.array(), (request: any, response: any) => {
            let yyy = request.params.yyy;
            let zzz = request.params.zzz;

            // Do someting
        });
        
    }
    
}