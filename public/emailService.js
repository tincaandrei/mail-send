const { ConfidentialClientApplication } = require("@azure/msal-node");
const { Client } = require("@microsoft/microsoft-graph-client");
require("isomorphic-fetch");

async function sendEmail(config) {
  const {
    clientID,
    secret,
    inputTennantID,
    inputSenderEmail,
    recieverEmail,
    inputDescription,
  } = config || {};

  if (!clientID || !secret || !inputTennantID) {
    throw new Error("Missing clientID / secret / tenant id.");
  }
  if (!inputSenderEmail || !recieverEmail) {
    throw new Error("Missing sender or receiver email.");
  }

  const msalConfig = {
    auth: {
      clientId: clientID,
      clientSecret: secret,
      authority: `https://login.microsoftonline.com/${inputTennantID}`,
    },
  };

  const cca = new ConfidentialClientApplication(msalConfig);

  const tokenResponse = await cca.acquireTokenByClientCredential({
    scopes: ["https://graph.microsoft.com/.default"],
  });

  if (!tokenResponse?.accessToken) {
    throw new Error("Failed to acquire access token.");
  }
  console.log("Token acquired successfully");

  const client = Client.init({
    authProvider: (done) => done(null, tokenResponse.accessToken),
  });

  const sendMail = {
    message: {
      subject: "New Message",
      body: { contentType: "Text", content: inputDescription || "" },
      toRecipients: [{ emailAddress: { address: recieverEmail } }],
    },
    saveToSentItems: true,
  };

  try {
    console.log(`Sending mail as ${inputSenderEmail} to ${recieverEmail} ...`);
    await client
      .api(`/users/${encodeURIComponent(inputSenderEmail)}/sendMail`)
      .post(sendMail);
    console.log("sendMail returned 202 Accepted");
    return { success: true };
  } catch (e) {
    console.error("sendMail failed: ", e);
  }
}

module.exports = { sendEmail };
