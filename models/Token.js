import {prisma} from "../prisma/prisma.js"

class Token {
  static query = prisma.tokens;
}

export default Token;