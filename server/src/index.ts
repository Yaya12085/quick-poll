import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { Server } from "socket.io";
import { initializeSocket } from "./socket.js";

const app = new Hono();

const server = serve(
  {
    fetch: app.fetch,
    port: 5000,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  }
);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

initializeSocket(io);
