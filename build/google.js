"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Google {
    constructor() {
        this.init();
    }
    init() {
        this.fs = require('fs');
        this.readline = require('readline');
        this.google = require('googleapis');
        //this.OAuth2Client = this.google.auth.OAuth2;
        this.SCOPES = ['https://www.googleapis.com/auth/drive.metadata.readonly'];
        this.TOKEN_PATH = './googleCredentials.json';
        // Load client secrets from a local file.
        this.fs.readFile(this.TOKEN_PATH, (error, content) => {
            if (error) {
                return console.log('Error loading client secret file:', error);
            }
            // Authorize a client with credentials, then call the Google Drive API.
            let c = JSON.parse(content);
            this.authorize((data) => this.listFiles(data), c);
        });
    }
    /**
     * Create an OAuth2 client with the given credentials, and then execute the
     * given callback function.
     * @param {Object} credentials The authorization client credentials.
     * @param {function} callback The callback to call with the authorized client.
     */
    authorize(callback, credentials) {
        let OAuth2Client = this.google.google.auth.OAuth2;
        var oAuth2Client = new OAuth2Client(credentials.web.client_id, credentials.web.client_secret, credentials.web.redirect_uris[0]);
        // Check if we have previously stored a token.
        this.fs.readFile(this.TOKEN_PATH, (error, token) => {
            if (error)
                return this.getAccessToken(callback, oAuth2Client);
            oAuth2Client.setCredentials(JSON.parse(token));
            callback(oAuth2Client);
        });
    }
    /**
     * Lists the names and IDs of up to 10 files.
     * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
     */
    listFiles(auth) {
        const drive = this.google.google.drive({ version: 'v3', auth });
        drive.files.list({
            pageSize: 10,
            fields: 'nextPageToken, files(id, name)',
        }, (error, data) => {
            if (error)
                return console.log('The API returned an error: ' + error);
            const files = data.files;
            if (files.length) {
                console.log('Files:');
                files.map((file) => {
                    console.log(`${file.name} (${file.id})`);
                });
            }
            else {
                console.log('No files found.');
            }
        });
    }
    /**
     * Get and store new token after prompting for user authorization, and then
     * execute the given callback with the authorized OAuth2 client.
     * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
     * @param {getEventsCallback} callback The callback for the authorized client.
     */
    getAccessToken(callback, oAuth2Client) {
        const authUrl = oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: this.SCOPES,
        });
        console.log('Authorize this app by visiting this url:', authUrl);
        const rl = this.readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        rl.question('Enter the code from that page here: ', (code) => {
            rl.close();
            oAuth2Client.getToken(code, (error, token) => {
                if (error)
                    return callback(error);
                oAuth2Client.setCredentials(token);
                // Store the token to disk for later program executions
                this.fs.writeFile(this.TOKEN_PATH, JSON.stringify(token), (error) => {
                    if (error)
                        console.error(error);
                    console.log('Token stored to', this.TOKEN_PATH);
                });
                callback((data) => oAuth2Client(data));
            });
        });
    }
}
exports.Google = Google;
//# sourceMappingURL=google.js.map