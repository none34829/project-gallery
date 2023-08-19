const config = {
    // Uses the PORT variable declared here, the path is defined in code
    port: 4000,
    redirectUri: 'https://independent-project-mentorship.netlify.app/',
    clientId: '1d041502-97d2-44be-aa5b-ea6bb8dc2627',
    // If you're not using a client secret, set to the empty string: ""
    clientSecret: '',
    airtableUrl: 'https://www.airtable.com',
    // space delimited list of Airtable scopes, update to the list of scopes you want for your integration
    scope: 'data.records:read data.records:write',
};
module.exports = config;
