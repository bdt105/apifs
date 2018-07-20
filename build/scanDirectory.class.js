"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const myToolbox_1 = require("./myToolbox");
class ScanDirectory {
    constructor(configuration) {
        this.myToolbox = new myToolbox_1.MyToolbox();
        this.configuration = configuration;
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
    scan() {
        fs = require('fs');
        if (this.configuration && this.configuration.common.receptionDirectory) {
            fs.readdir(this.configuration.common.receptionDirectory, (err, files) => {
                if (!err) {
                    for (var i = 0; i < files.length; i++) {
                        this.excelToJson(files[i], files[i] + '.json');
                    }
                }
                else {
                    console.log(err);
                }
            });
        }
    }
}
exports.ScanDirectory = ScanDirectory;
//# sourceMappingURL=scanDirectory.class.js.map