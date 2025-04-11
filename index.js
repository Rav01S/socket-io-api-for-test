import express from "express";
import AuthController from "./controllers/AuthController.js";
import PostController from "./controllers/PostController.js";
import PostRespondsController from "./controllers/PostResponds.js";
import { authenticateToken } from "./middlewares/AuthToken.js";
import jwt from "jsonwebtoken";
import cors from "cors";
import { WebSocketServer } from "ws";
import expressWs from "express-ws";

const PORT = 3500;

const app = express();
expressWs(app);

app.use(express.json());
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "http://localhost:5500",
      "http://127.0.0.1:5500",
    ],
  })
);

app.post("/login", AuthController.authorization);
app.post("/register", AuthController.register);
app.get("/logout", authenticateToken, AuthController.logout);

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

/* io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    const user = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = user;
    next();
  } catch (e) {
    next(new Error("Необходимо авторизоваться"));
  }
});  */

/* io.on("connection", (socket) => {
  console.log(`User ${socket.id} connected`);
  socket.join(`user_${socket.user.id}`);

  socket.on("disconnect", (reason) => {
    console.log(`User ${socket.id} disconnected`);
  });
}); */

const userConnections = new Map();

app.ws("/ws", (ws, req) => {
  ws.on("message", (data) => {
    data = JSON.parse(data);

    if (data.type === "auth") {
      const token = data.token;
      const user = jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return ws.close(1008);
        return user;
      });

      if (user) {
        userConnections.set(user.id, ws);
        req.user = user;
      }

      sendToUser(user.id, "auth_success", user);
    }
  });

  ws.on("disconnect", () => {
    console.log("disconnected");
  });
});

export const sendToUser = (userId, event, data) => {
  const ws = userConnections.get(userId);
  if (ws && ws.readyState === ws.OPEN) {
    ws.send(
      JSON.stringify({
        type: event,
        data: data,
      })
    );
  }
};

export function broadcastToAll(type, data) {
  userConnections.forEach((ws) => {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({ type, data }));
    }
  });
}

app.set("ws", app.ws);
