import express from "express";
import cors from "cors";
import { apiRoutes } from "./config/apiRoutes.js";
import { env } from "./config/env.js";
import requesterRoutes from "./modules/requesters/requester.routes.js";
<<<<<<< HEAD
=======
import donorRoutes from "./modules/donors/donor.routes.js";
>>>>>>> ebddb2f91df44a9836764a42f2a7a022773167d3
import bloodRequestRoutes from "./modules/blood-requests/bloodRequest.routes.js";
import { notFoundHandler, errorHandler } from "./shared/http/errorHandlers.js";

const app = express();

app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use(express.json({ limit: "1mb" }));

app.get(apiRoutes.health, (req, res) => {
  res.json({ success: true, message: "HemoConnect360 Backend Running" });
});

app.use(apiRoutes.requesters.base, requesterRoutes);
<<<<<<< HEAD
=======
app.use(apiRoutes.donors.base, donorRoutes);
>>>>>>> ebddb2f91df44a9836764a42f2a7a022773167d3
app.use(apiRoutes.bloodRequests.base, bloodRequestRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
