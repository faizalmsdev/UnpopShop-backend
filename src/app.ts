import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import authRoutes from "./routes/auth.routes";
import publicRoutes from "./routes/public.routes";
import categoryRoutes from "./routes/category.routes";
import brandRoutes from "./routes/brand.routes";
import productRoutes from "./routes/product.routes";
import rfqRoutes from "./routes/rfq.routes";
import buyerRoutes from "./routes/buyer.routes";
import manufacturerRoutes from "./routes/manufacturer.routes";
import adminRoutes from "./routes/admin.routes";
import subscriptionRoutes from "./routes/subscription.routes";
import messageRoutes from "./routes/message.routes";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: process.env.CORS_ORIGIN || "*", credentials: true }));
app.use(express.json({ limit: "5mb" }));
app.use(morgan("dev"));

app.get("/api/health", (_req, res) => res.json({ status: "ok", service: "unpop-shop-api" }));

app.use("/api/auth", authRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/brands", brandRoutes);
app.use("/api/products", productRoutes);
app.use("/api/rfqs", rfqRoutes);
app.use("/api/buyer", buyerRoutes);
app.use("/api/manufacturer", manufacturerRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/messages", messageRoutes);

app.use((req, res) => res.status(404).json({ message: `No route for ${req.method} ${req.path}` }));
app.use(errorHandler);

export default app;
