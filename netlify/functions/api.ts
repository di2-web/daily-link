import express from "express";
import serverless from "serverless-http";
import { app as serverApp } from "../../server";

const app = express();

app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

// Mount the clean API router on both /api and root for Netlify functions
app.use("/api", serverApp);
app.use("/", serverApp);

export const handler = serverless(app);
