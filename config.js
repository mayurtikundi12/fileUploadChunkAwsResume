var AWS = require('aws-sdk');
DigitalOceanDEV = {
    DigitalOceanAccessKeyId: '2KC2QSC2N6J2XH5QWFL7',
    DigitalOceanSecretAccessKey: 'KHeWb7W5tQCOKlK9Kc9qgY4pH1OR2KXZVHSIoIXZONg',
    DigitalOceanEndpoint: 'sgp1.digitaloceanspaces.com',
    DigitalOceanBucket: 'laalsadev',
    //DigitalOceanFolder: 'Temp_QA',
    DigitalOceanLink: 'https://laalsadev.sgp1.digitaloceanspaces.com',
    // DigitalOceanAcl: 'private', // public-read
    DigitalOceanEncoding: 'base64'
};

const spacesEndpoint = new AWS.Endpoint(DigitalOceanDEV.DigitalOceanEndpoint);
module.exports.s3 = new AWS.S3({
    endpoint: spacesEndpoint,
    accessKeyId: DigitalOceanDEV.DigitalOceanAccessKeyId,
    secretAccessKey: DigitalOceanDEV.DigitalOceanSecretAccessKey,
});
