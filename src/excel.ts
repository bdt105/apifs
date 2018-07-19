'use strict';
const excelToJson = require('convert-excel-to-json');

const result = excelToJson({
    sourceFile: 'listing.xlsx',
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
fs.writeFile("listing.json", JSON.stringify(result), (err: any) => {
    if (err) {
        return console.log(err);
    }

    console.log("The file was saved!");
});