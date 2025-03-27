import jwt from "jsonwebtoken";

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];  // Bearer <token>

  if (token == null) return res.status(401).send({message: "No token"});  // No token present

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) return res.status(403).send({message: "Invalid token"});  // Invalid token

      req.user = user;
      next();
  });
};