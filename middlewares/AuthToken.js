import jwt from "jsonwebtoken";
import Token from "../models/Token.js";

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];  // Bearer <token>

  if (token == null) return res.status(401).send({message: "No token"});  // No token present

  const user = jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) return res.status(403).send({message: "Invalid token"});  // Invalid token
      return user;
  });

  const isExists = await Token.query.findFirst({where: {token: token}}); // Check if token exists in database
  if (!isExists) return res.status(403).send({message: "Invalid token"});

  req.user = user;
  next();
};