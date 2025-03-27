import {prisma} from "../prisma/prisma.js"
import jwt from "jsonwebtoken";

class User {
  static query = prisma.user;

  static jwtSign(user) {
    return jwt.sign(user, process.env.JWT_SECRET, {expiresIn: "2h"})
  }
}

export default User;