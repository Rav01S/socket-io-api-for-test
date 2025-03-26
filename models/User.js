import {prisma} from "../prisma/prisma.js"

class User {
  static query = prisma.user;
}

export default User;