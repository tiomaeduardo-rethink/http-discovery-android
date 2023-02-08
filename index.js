import { spawn } from "child_process";
import fs from "fs-extra";
import path from "path";

import json from "json-keys-sort";

const logcat = spawn("adb", ["logcat", "-s", "OkHttp", "-v", "raw"]);

let buffer = "";

const requestRegex = new RegExp(/\-\->([\s\S]*?)\-\->/);
const responseRegex = new RegExp(/<\-\-([\s\S]*?)(<\-\-)/);
const payloadRequestRegex = new RegExp(/{([\s\S]*?)(\-\->)/);
const payloadResponseRegex = new RegExp(/{([\s\S]*?)(<\-\-)/);
const httpRegex = new RegExp(/\-\->([\s\S]*?)(<\-\- END HTTP)/g);

const saveJsonFile = (path, content) => {
  /* 
      When finishing checkout, we need to post a list of items to /orders.
      Unfortunately, those items have different/less key-value pairs than 
      the items we receive from /checkout requests.

      Having the payloads properly sorted might help us identify which key-value
      pairs are missing
    */
  try {
    let contentJson = JSON.parse(content);
    contentJson = json.sort(contentJson);
    content = JSON.stringify(contentJson);
  } catch (e) {
    console.warn("Could not parse body response as JSON:", e);
  }

  fs.outputFile(path, content);
};

logcat.stdout.on("data", function (data) {
  // add data to buffer, in case we have incomplete http requests/responses
  buffer += data.toString();

  const httpMatcher = buffer.toString().matchAll(httpRegex);

  if (httpMatcher == null) {
    return;
  }

  const results = [...httpMatcher];

  for (let result of results) {
    const requestMatcher = result[0].match(requestRegex);
    const responseMatcher = result[0].match(responseRegex);

    const request = requestMatcher[0];
    const response = responseMatcher[0];

    const firstLine = request.split("\n")[0]; // "--> METHOD URL"
    const [, httpMethod, endpoint] = firstLine.split(" "); // ["-->", "METHOD", "https://...." ]

    // create folder with time-method-endpoint
    // time-method-endpoint
    // -- request
    // ---- http.txt
    // ---- payload.json
    // -- response
    // ---- http.txt
    // ---- payload.json

    const folderName = `${new Date().getTime()}-${httpMethod}-${endpoint.replace(
      "https://",
      ""
    )}`;

    const folderDir = path.join("./data", folderName);

    fs.outputFile(path.join(folderDir, "request", "http.txt"), request);

    const payloadRequest = request.match(payloadRequestRegex);

    if (payloadRequest) {
      let content = payloadRequest[0].replace("-->", "");
      const filePath = path.join(folderDir, "request", "payload.json");

      saveJsonFile(filePath, content);
    }

    fs.outputFile(path.join(folderDir, "response", "http.txt"), response);

    const payloadResponse = response.match(payloadResponseRegex);

    if (payloadResponse) {
      let content = payloadResponse[0].replace("<--", "").replaceAll("\n", "");
      const filePath = path.join(folderDir, "response", "payload.json");

      saveJsonFile(filePath, content);
    }

    // remove contents from buffer so we don't read it more than once
    buffer = buffer.replace(request, "");
    buffer = buffer.replace(response, "");
  }
});

logcat.stderr.on("data", function (data) {
  console.log(data.toString(), "error");
});
