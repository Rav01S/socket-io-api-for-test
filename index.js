import express from "express";
import { Server } from "socket.io";
import AuthController from "./controllers/AuthController.js";
import PostController from "./controllers/PostController.js";

const PORT = 3500;

const app = express();

app.use(express.json());

app.post("/login", AuthController.authorization);
app.post("/register", AuthController.register);

app.post("/post", PostController.createPost);

const expressServer = app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

const io = new Server(expressServer, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log(`User ${socket.id} connected`);

  socket.on("disconnect", (reason) => {
    console.log(`User ${socket.id} disconnected`);
  });
});
