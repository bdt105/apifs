import { MyToolbox } from "./myToolbox";
import { Connexion } from 'bdt105connexion/dist';
import { isObject } from 'util';
import { SmartUpload } from "./smart.upload";

export class ApiUpload {
    private app: any;
    private connexion: Connexion;
    private myToolbox = new MyToolbox();
    private upload: any;

    private response: any;
    private configuration: any;

    private uploadInfo: any = {};

    constructor(app: any, upload: any, connexion: Connexion, configuration: any) {
        this.app = app;
        this.connexion = connexion;
        this.upload = upload;
        this.configuration = configuration;
    }

    protected logMessage(message: any) {
        if (this.configuration.common.logToConsole) {
            let owner = this.uploadInfo && this.uploadInfo.params && this.uploadInfo.params.owner ? this.uploadInfo.params.owner : "";
            if (isObject(message)) {
                console.log(JSON.stringify(message) + " --- " + owner);
            } else {
                console.log(message + " --- " + owner);
            }
        }
    }

    protected logError(error: any) {
        if (this.configuration.common.logToConsole) {
            let owner = this.uploadInfo && this.uploadInfo.params && this.uploadInfo.params.owner ? this.uploadInfo.params.owner : "";

            if (isObject(error)) {
                console.error(JSON.stringify(error) + " --- " + owner);
            } else {
                console.error(error + " --- " + owner);
            }
        }
    }

    protected errorMessage(text: string) {
        let ret = { "status": "ERR", "message": text };
        this.logError(ret);
        return ret;
    }

    protected respond(response: any, statusCode: number, data: any = null) {
        if (statusCode != 200) {
            this.logError(data);
        } else {
            this.logMessage(data);
        }
        response.status(statusCode);
        if (isObject(data)) {
            response.setHeader('content-type', 'application/json');
        } else {
            response.setHeader('content-type', 'test/plain');
        }
        response.send(JSON.stringify(data));
    }


    public assign() {
        this.app.get('/', (request: any, response: any) => {
            response.send('API Serveur Upload is running');
        });

        this.app.post('/uploadExcelFile', this.upload.single('file'), (req: any, res: any) => {
            console.log("uploadFile");
            let token = req.body.token;
            this.uploadInfo = req;
            if (this.configuration.requiresToken) {
                let authent = this.connexion.checkJwt(token);
                if (!authent.decoded) {
                    this.respond(res, 403, 'Token is absent or invalid');
                    return;
                }
            }
            this.uploadInfo = {};
            this.uploadInfo.params = req.body;
            this.uploadInfo.file = req.file;
            this.response = res;
            var fs = require('fs');
            let uploadDirectory = this.myToolbox.getConfiguration().common.uploadDirectory;
            if (!fs.existsSync(uploadDirectory)) {
                fs.mkdirSync(uploadDirectory);
                this.logMessage("Upload directory created");
            }
            let smartUpload = new SmartUpload(this.connexion, this.configuration, req.body.owner);
            let overwriteData = req.body.overwriteData == "true";
            smartUpload.importFile(
                (data: any, error: any) => {
                    if (!error) {
                        fs.unlinkSync(uploadDirectory + req.file.filename);
                        data.idconfiguration = smartUpload.idconfiguration;
                        data.originalFileName = req.file.originalname;
                    }
                    this.respond(res, 200, data);
                }, uploadDirectory, req.file.originalname, true, req.file.filename, req.body.sheetname, req.body.headerRowNumber, overwriteData);
        });

        this.app.post('/uploadCsvFile', this.upload.array(), (req: any, res: any) => {
            console.log("uploadCsvFile");
            let token = req.body.token;
            let fileName = req.body.fileName;
            if (this.configuration.requiresToken) {
                let authent = this.connexion.checkJwt(token);
                if (!authent.decoded) {
                    this.respond(res, 403, 'Token is absent or invalid');
                    return;
                }
            }
            this.response = res;
            var fs = require('fs');
            let mysqlDirectory = this.myToolbox.getConfiguration().mySql.fileDirectory;
            if (fs.existsSync(mysqlDirectory + fileName)) {
                let smartUpload = new SmartUpload(this.connexion, this.configuration, req.body.owner);
                let overwriteData = req.body.overwriteData == "true";
                smartUpload.importFile(
                    (data: any, error: any) => {
                        if (!error) {
                            fs.unlinkSync(mysqlDirectory + fileName);
                            data.idconfiguration = smartUpload.idconfiguration;
                            data.originalFileName = req.file.originalname;
                        }
                        this.respond(res, 200, data);
                    }, mysqlDirectory, req.body.originalname, false, fileName, null, 0, overwriteData);
            } else {
                this.respond(res, 400, { "message": "File not found " + mysqlDirectory + fileName })
            }
        });

        this.app.post('/uploadImage', this.upload.single('file'), (req: any, res: any) => {
            console.log("uploadImage");
            let token = req.body.token;
            if (this.configuration.requiresToken) {
                let authent = this.connexion.checkJwt(token);
                if (!authent.decoded) {
                    this.respond(res, 403, 'Token is absent or invalid');
                    return;
                }
            }
            this.response = res;
            var fs = require('fs');
            let imageDirectory = this.configuration.common.imageDirectory;
            let imageUrlDirectory = this.configuration.common.imageUrlDirectory;

            fs.renameSync(req.file.destination + req.file.filename, imageDirectory + req.file.filename);
            let mes = { "status": "ok", "imageUrl": imageUrlDirectory + req.file.filename, "imageFileName": req.file.filename };
            this.respond(res, 200, mes);
        });

        this.app.delete('/deleteImage', this.upload.array(), (request: any, response: any) => {
            let token = request.body.token;
            if (this.configuration.requiresToken) {
                let authent = this.connexion.checkJwt(token);
                if (!authent.decoded) {
                    this.respond(response, 403, 'Token is absent or invalid');
                    return;
                }
            }
            let imageFileName = request.body.imageFileName;
            var fs = require('fs');
            let imageDirectory = this.configuration.common.imageDirectory;

            if (fs.existsSync(imageDirectory + imageFileName)) {
                let r = fs.unlinkSync(imageDirectory + imageFileName);
            }
            this.respond(response, 200, { "status": "ok" });
        });

        this.app.post('/deleteConfigurationFile', this.upload.array(), (request: any, response: any) => {
            let token = request.body.token;
            let idconfiguration = request.body.idconfiguration;
            let deleteItemsPlus = request.body.deleteItemsPlus;
            if (this.configuration.requiresToken) {
                let authent = this.connexion.checkJwt(token);
                if (!authent.decoded) {
                    this.respond(response, 403, 'Token is absent or invalid');
                    return;
                }
            }

            this.logMessage("Deleting the configuration data");

            let smartUpload = new SmartUpload(this.connexion, this.configuration, request.body.owner);

            smartUpload.deleteConfigurationFile(
                (data: any, error: any) => {
                    if (!error) {
                        this.respond(response, 200, { "status": "ok", "data": data });
                        this.logMessage("File " + idconfiguration + " deleted");
                    } else {
                        this.respond(response, 500, { "status": "err", "error": error });
                        this.logMessage("File " + idconfiguration + " NOT deleted");
                    }
                }, idconfiguration, deleteItemsPlus);

        });
    }
}