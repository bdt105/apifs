"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const myToolbox_1 = require("./myToolbox");
class UploadServer {
    constructor(app, upload, connexion, configuration) {
        this.myToolbox = new myToolbox_1.MyToolbox();
        this.app = app;
        this.connexion = connexion;
        this.configuration = configuration;
        this.upload = upload;
    }
    excelToJson(callbackFailure, config, excelFileName, jsonFileName) {
        let excelToJson = require('convert-excel-to-json');
        let result = excelToJson({
            sourceFile: excelFileName,
            sheets: [
                {
                    name: config.sheetName,
                    header: {
                        rows: config.headerRowNumber
                    }
                }
            ],
            columnToKey: {
                '*': '{{columnHeader}}'
            }
        });
        var fs = require('fs');
        fs.writeFile(jsonFileName, JSON.stringify(result), (err) => {
            if (callbackFailure) {
                callbackFailure(err);
            }
        });
    }
    assign() {
        this.app.post('/upload', this.upload.single('file'), (req, res) => {
            console.log(req.file);
            var fs = require('fs');
            let uploadDirectory = './' + this.myToolbox.getConfiguration().common.uploadDirectory + '/';
            let userDirectory = this.myToolbox.prepareStrinForSearch(req.body.email, false, false);
            let destinationFileName = './' + userDirectory + '/original/' + req.file.originalname;
            fs.rename(uploadDirectory + req.file.filename, destinationFileName, (err) => {
                if (err)
                    throw err;
                let callbackFailure = (err) => {
                    if (err)
                        throw err;
                    res.send("file saved on server and turned into json");
                };
                if (req.file.originalname.endsWith(".xls") || req.file.originalname.endsWith(".xlsx")) {
                    this.excelToJson((err) => callbackFailure(err), req.body, destinationFileName, req.body.fileName + '.json');
                }
            });
        });
    }
}
exports.UploadServer = UploadServer;
//# sourceMappingURL=uploadServer.class.js.map