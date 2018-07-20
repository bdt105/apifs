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
    excelToJson(excelFileName, jsonFileName) {
        let excelToJson = require('convert-excel-to-json');
        let result = excelToJson({
            sourceFile: excelFileName,
            sheets: [
                {
                    name: 'Mercalys',
                    header: {
                        rows: 7
                    }
                }
            ],
            columnToKey: {
                '*': '{{columnHeader}}'
            }
        });
        var fs = require('fs');
        fs.writeFile(jsonFileName, JSON.stringify(result), (err) => {
            if (err) {
                return console.log(err);
            }
            console.log("The file was saved! - " + jsonFileName);
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
                res.send("file saved on server");
                fs.stat('./upload/' + req.file.originalname, (err, stats) => {
                    if (err)
                        throw err;
                    console.log(`stats: ${JSON.stringify(stats)}`);
                });
            });
        });
    }
}
exports.UploadServer = UploadServer;
//# sourceMappingURL=uploadServer.class.js.map