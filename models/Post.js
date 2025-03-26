import {prisma} from "../prisma/prisma.js"

class Post {
  static query = prisma.post;
}

export default Post;