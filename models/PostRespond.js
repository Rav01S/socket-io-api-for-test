import {prisma} from "../prisma/prisma.js"

class PostRespond {
  static query = prisma.postRespond;
}

export default PostRespond;