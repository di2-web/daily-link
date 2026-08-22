import serverless from "serverless-http";
import { app } from "../../server";

// Wrap Express app with serverless-http supporting both /api and /.netlify/functions/api paths
export const handler = serverless(app, {
  basePath: "",
});
