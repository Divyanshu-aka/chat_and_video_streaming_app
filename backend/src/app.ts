import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { Server } from "socket.io";
import { createServer } from "http";
import { initializeSocketIO } from "./socket/index.js";
import morganMiddleware from "./logger/morgan.logger.js";

const app = express();

const httpServer = createServer(app); //mounted express server onto http server

//socket.io server
const io = new Server(httpServer, {
  pingTimeout: 60000,
  cors: {
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  },
});

app.set("io", io); // making io accessible throughout the app via app.set and app.get

//Global middlewares
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

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
