const { ConfidentialClientApplication } = require("@azure/msal-node");
const { Client } = require("@microsoft/microsoft-graph-client");
const { error } = require("console");
const { parseError } = require("./errorParser");
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
  

  const msalConfig = {
    auth: {
      clientId: clientID,
      clientSecret: secret,
      authority: `https://login.microsoftonline.com/${inputTennantID}`,
    },
  };
  const cca = new ConfidentialClientApplication(msalConfig);
  let x;
  try {
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

    console.log(`Sending mail as ${inputSenderEmail} to ${recieverEmail} ...`);
    await client
      .api(`/users/${encodeURIComponent(inputSenderEmail)}/sendMail`)
      .post(sendMail);
    console.log("Email accepted by Graph");

    return { success: true, message: "Email accepted by Graph", status: 200 };
  } catch (e) {
    const errorMsg = parseError(e.errorMessage);
    console.error("Email send failed", errorMsg);

    let description = errorMsg.description;
    return {
      success: false,
      error: e,
      status: e?.status || 500,
      description: description,
      code: errorMsg.errorCode,
      traceId: errorMsg.traceId,
      correlationId: errorMsg.correlationId,
    };
  }
}

module.exports = { sendEmail };
