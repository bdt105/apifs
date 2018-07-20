import { MyToolbox } from "./myToolbox";
import { Connexion, Token } from 'bdt105connexion/dist';

export class UploadServer {
    private app: any;
    private connexion: Connexion;
    private configuration: any;
    private myToolbox = new MyToolbox();
    private upload: any;

    constructor(app: any, upload: any, connexion: Connexion, configuration: any) {
        this.app = app;
        this.connexion = connexion;
        this.configuration = configuration;
        this.upload = upload;
    }

    private excelToJson(excelFileName: string, jsonFileName: string) {
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
        fs.writeFile(jsonFileName, JSON.stringify(result), (err: any) => {
            if (err) {
                return console.log(err);
            }

            console.log("The file was saved! - " + jsonFileName);
        });
    }

    public assign() {
        this.app.post('/upload', this.upload.single('file'), (req: any, res: any) => {
            console.log(req.file);
            var fs = require('fs');
            let uploadDirectory = './' + this.myToolbox.getConfiguration().common.uploadDirectory + '/';
            let userDirectory = this.myToolbox.prepareStrinForSearch(req.body.email, false, false);
            let destinationFileName = './' + userDirectory + '/original/' + req.file.originalname; 
            fs.rename(uploadDirectory + req.file.filename, destinationFileName, (err: any) => {
                if (err) throw err;
                res.send("file saved on server");
                fs.stat('./upload/' + req.file.originalname, (err: any, stats: any) => {
                    if (err) throw err;
                    console.log(`stats: ${JSON.stringify(stats)}`);
                });
            });
        });
    }

}