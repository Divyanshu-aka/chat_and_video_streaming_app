import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { Server } from "socket.io";
import { createServer } from "http";
import { initializeSocketIO } from "./socket/index.js";
import morganMiddleware from "./logger/morgan.logger.js";

// Load environment variables first
dotenv.config({
  path: "./.env",
});

const app = express();

const httpServer = createServer(app); //mounted express server onto http server

//socket.io server
const io = new Server(httpServer, {
  pingTimeout: 60000,
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  },
});

app.set("io", io); // making io accessible throughout the app via app.set and app.get

//Global middlewares
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve static files from uploads directory
app.use("/uploads", express.static("public/uploads"));

app.use(morganMiddleware);

//api routes
import authRouter from "./routes/auth.routes.js";
import chatRouter from "./routes/chat.routes.js";
import messageRouter from "./routes/message.routes.js";

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/chats", chatRouter);
app.use("/api/v1/messages", messageRouter);

initializeSocketIO(io);

export { httpServer };
