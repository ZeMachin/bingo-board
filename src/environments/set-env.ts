const setEnv = () => {
    const fs = require('fs');
    const writeFile = fs.writeFile;
    // Configure Angular `environment.ts` file path
    const targetPath = './src/environments/environment.ts';
    // Load node modules
    const colors = require('colors');
    const appVersion = require('../../package.json').version;
    require('dotenv').config({
        path: 'src/environments/.env'
    });
    // `environment.ts` file structure
    const env = {...process.env, appVersion, production: true };
    const envConfigFile = `export const environment = {
        GOOGLE_SERVICE_ACCOUNT_EMAIL: '${process.env['GOOGLE_SERVICE_ACCOUNT_EMAIL']}',
        GOOGLE_PRIVATE_KEY: '${process.env['GOOGLE_PRIVATE_KEY']}',
        SHEET_ID: '${process.env['SHEET_ID']}',
        appVersion: '${appVersion}',
        production: true,
    };
`;
    console.log(colors.magenta('The file `environment.ts` will be written with the following content: \n'));
    writeFile(targetPath, envConfigFile, (err: any) => {
        if (err) {
            console.error(err);
            throw err;
        } else {
            console.log(colors.magenta(`Angular environment.ts file generated correctly at ${targetPath} \n`));
        }
    });
};

setEnv();