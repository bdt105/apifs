import { Connexion, Token } from 'bdt105connexion/dist';

export class ServeurFileSystem {
    private app: any;
    private connexion: Connexion;

    constructor(app: any, connexion: Connexion) {
        this.app = app;
        this.connexion = connexion;
    }

    private errorMessage(text: string) {
        return { "status": "ERR", "message": text };
    }

    private message(text: string) {
        return { "status": "OK", "message": text };
    }

    private checkToken(token: any, response: any) {
        if (!this.connexion.isTokenValid(token)) {
            response.status(403);
            response.send(JSON.stringify(this.errorMessage("Invalid token")));
            return false;
        }
        return true;
    }

    public assign() {
        this.app.get('/', (request: any, response: any) => {
            response.send('API Serveur File System is running');
        });
        let multer = require('multer');
        let upload = multer();

        this.app.post('/', upload.array(), (request: any, response: any) => {
            if (!this.checkToken(request.body.token, response)) return;
            let directory = request.body.directory;
            let fileName = request.body.fileName;
            let fs = require('fs');
            let path = (fileName ? directory + '/' + fileName : directory);
            if (fs.existsSync(path)) {
                if (fileName) {
                    fs.readFile(path, 'utf8', (err: any, data: any) => {
                        if (err) {
                            response.status(404);
                            response.send(JSON.stringify(this.errorMessage(err)));
                        } else {
                            response.status(200);
                            response.setHeader('content-type', 'application/json');
                            response.send(data);
                        }
                    });
                } else {
                    fs.readdir(directory, (err: any, files: any) => {
                        response.status(200);
                        response.setHeader('content-type', 'application/json');
                        response.send(files);
                    });
                }
            } else {
                response.status(404);
                response.send(JSON.stringify(this.errorMessage("file " + path + " does not exist")));
            }
        });

        this.app.put('/', upload.array(), (request: any, response: any) => {
            if (!this.checkToken(request.body.token, response)) return;
            let directory = request.body.directory;
            let fileName = request.body.fileName;
            let content = request.body.content;
            let fs = require('fs');
            let path = directory + '/' + fileName;
            if (!fs.existsSync(directory)) {
                fs.mkdirSync(directory);
            }
            if (fs.existsSync(directory)) {
                fs.writeFile(path, content, (err: any) => {
                    if (err) {
                        response.status(404);
                        response.send(JSON.stringify(this.errorMessage(err)));
                    } else {
                        response.status(200);
                        response.setHeader('content-type', 'application/json');
                        response.send(this.message("file " + path + " created"));
                    }
                });
            } else {
                response.status(404);
                response.send(JSON.stringify(this.errorMessage("directory " + directory + " does not exist")));
            }
        });

        this.app.delete('/', upload.array(), (request: any, response: any) => {
            if (!this.checkToken(request.body.token, response)) return;
            let directory = request.body.directory;
            let fileName = request.body.fileName;
            let fs = require('fs');
            let path = directory + '/' + fileName;
            if (fs.existsSync(path)) {
                fs.unlink(path, (err: any) => {
                    if (err) {
                        response.status(404);
                        response.send(JSON.stringify(this.errorMessage(err)));
                    } else {
                        response.status(200);
                        response.setHeader('content-type', 'application/json');
                        response.send(this.message("file " + path + " deleted"));
                    }
                });
            } else {
                response.status(404);
                response.send(JSON.stringify(this.errorMessage("file " + path + " does not exist")));
            }
        });

        this.app.patch('/', upload.array(), (request: any, response: any) => {
            if (!this.checkToken(request.body.token, response)) return;
            let directory = request.body.directory;
            let fileName = request.body.fileName;
            let content = request.body.content;
            let fs = require('fs');
            let path = directory + '/' + fileName;
            if (fs.existsSync(path)) {
                fs.appendFile(path, content, (err: any) => {
                    if (err) {
                        response.status(404);
                        response.send(JSON.stringify(this.errorMessage(err)));
                    } else {
                        response.status(200);
                        response.setHeader('content-type', 'application/json');
                        response.send(this.message("file " + path + " appended"));
                    }
                });
            } else {
                response.status(404);
                response.send(JSON.stringify(this.errorMessage("file " + path + " does not exist")));
            }
        });

        this.app.get('/xxx/:yyy/:zzz', upload.array(), (request: any, response: any) => {
            if (!this.checkToken(request.body.token, response)) return;
            let yyy = request.params.yyy;
            let zzz = request.params.zzz;

            // Do someting
        });

    }

}