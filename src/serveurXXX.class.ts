import express = require('express');

export class ServeurXXX {
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


    public assign(){
        this.app.get('/xxx', function (request: any, response: any) {
            response.send('API ServeurXXX is running');
        });
        let multer = require('multer');
        let upload = multer();
        
        this.app.post('/xxx/get', upload.array(), (request: any, response: any) => {
            let xxx = request.body.xxx;

            // Do someting
        });
        
        this.app.put('/xxx/put', upload.array(), (request: any, response: any) => {
            let xxx = request.body.xxx;

            // Do someting
        });
        
        this.app.delete('/xxx/delete', upload.array(), (request: any, response: any) => {
            let xxx = request.body.xxx;

            // Do someting
        });
        
        this.app.patch('/xxx/patch', upload.array(), (request: any, response: any) => {
            let xxx = request.body.xxx;

            // Do someting
        });
        
        this.app.get('/xxx/:yyy/:zzz', upload.array(), (request: any, response: any) => {
            let yyy = request.params.yyy;
            let zzz = request.params.zzz;

            // Do someting
        });
        
    }
    
}