import express from "express";
import "dotenv/config";
import cookieParser from "cookie-parser";
import compression from "compression";
import { authRoute } from "./route/authRoute.js";
import { doRoute } from "./route/doRoute.js";
import authenticate from "./middleware/authentication.js";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(compression());
app.use(cookieParser());
app.use("/auth", authRoute);
app.use("/api/", authenticate, doRoute);

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
