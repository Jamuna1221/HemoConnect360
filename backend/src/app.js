import express from "express";
import cors from "cors";
import { apiRoutes } from "./config/apiRoutes.js";
import { env } from "./config/env.js";
import requesterRoutes from "./modules/requesters/requester.routes.js";
import { notFoundHandler, errorHandler } from "./shared/http/errorHandlers.js";

const app = express();

app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use(express.json({ limit: "1mb" }));

app.get(apiRoutes.health, (req, res) => {
  res.json({ success: true, message: "HemoConnect360 Backend Running" });
});

app.use(apiRoutes.requesters.base, requesterRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
