const { ConfidentialClientApplication } = require("@azure/msal-node");
const { Client } = require("@microsoft/microsoft-graph-client");

const fs = require("fs").promises;
require("isomorphic-fetch");

async function toGraphFileAttachment(file) {
  const buffer = await fs.readFile(file.path);

  return {
    "@odata.type": "#microsoft.graph.fileAttachment",
    name: file.filename,
    contentType: file.contentType || "application/octet-stream",
    contentBytes: buffer.toString("base64"),
  };
}

async function sendEmail(config) {
  const {
    clientID,
    secret,
    inputTennantID,
    inputSenderEmail,
    recieverEmail,
    inputSubject,
    inputDescription,
    attachments = [],
  } = config || {};
  // console.log(
  //   "this is a test print for config" + "\n" + JSON.stringify(config)
  // );
  const msalConfig = {
    auth: {
      clientId: clientID,
      clientSecret: secret,
      authority: `https://login.microsoftonline.com/${inputTennantID}`,
    },
  };
  const cca = new ConfidentialClientApplication(msalConfig);

  if (!clientID || !secret || !inputTennantID) {
    throw new Error("Missing clientID / secret / tenant id.");
  }
  if (!inputSenderEmail || !recieverEmail) {
    throw new Error("Missing sender or receiver email.");
  }
  if (!inputSubject) {
    throw new Error("Missing subject of the email.");
  }

  const tokenResponse = await cca.acquireTokenByClientCredential({
    scopes: ["https://graph.microsoft.com/.default"],
  });

  if (!tokenResponse?.accessToken) {
    throw new Error("Failed to acquire access token.");
  } else {
    console.log("Token acquired successfully");
  }

  const client = Client.init({
    authProvider: (done) => done(null, tokenResponse.accessToken),
  });

  const graphAttachments = attachments.length
    ? await Promise.all(attachments.map(toGraphFileAttachment))
    : [];

  const sendMail = {
    message: {
      subject: inputSubject,
      body: { contentType: "Text", content: inputDescription || "" },
      toRecipients: [{ emailAddress: { address: recieverEmail } }],
      attachments: graphAttachments,
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
