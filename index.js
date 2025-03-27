import express from "express";
import { Server } from "socket.io";
import AuthController from "./controllers/AuthController.js";
import PostController from "./controllers/PostController.js";
import PostRespondsController from "./controllers/PostResponds.js";
import { authenticateToken } from "./middlewares/AuthToken.js";
import jwt from "jsonwebtoken";
import cors from "cors";

const PORT = 3500;

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: "*",
  })
);

app.post("/login", AuthController.authorization);
app.post("/register", AuthController.register);

app.get("/posts", authenticateToken, PostController.getPosts);
app.post("/posts", authenticateToken, PostController.createPost);
app.post(
  "/posts/:id",
  authenticateToken,
  PostRespondsController.createPostRespond
);

const expressServer = app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

const io = new Server(expressServer, {
  cors: {
    origin: "*",
  },
});


io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    const user = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = user;
    next();
  } catch (e) {
    next(new Error("Необходимо авторизоваться"));
  }
});

io.on("connection", (socket) => {
  console.log(`User ${socket.id} connected`);
  socket.join(`user_${socket.user.id}`);

  socket.on("disconnect", (reason) => {
    console.log(`User ${socket.id} disconnected`);
  });
});

app.set("io", io);
