import { z } from "zod";
import PostRespond from "../models/PostRespond.js";

class PostRespondsController {
  static async createPostRespond(req, res, next) {
    const user = req.user;

    const postId = req.params.id;
    if (isNaN(Number(postId))) {
      return res.status(422).json({ message: "Такого поста не существует" });
    }

    const isResponded = await PostRespond.query.findFirst({
      where: {
        userId: user.id,
        postId: Number(postId),
      },
    });

    if (isResponded) {
      return res
        .status(422)
        .json({ message: "Вы уже откликались на это объявление" });
    }

    const respond = await PostRespond.query.create({
      data: {
        userId: user.id,
        postId: Number(postId),
      },
      include: {
        post: {
          select: {
            authorId: true,
            title: true,
          },
        },
      },
    });

    const io = req.app.get("io");

    await io.to(`user_${respond.post.authorId}`).emit("yourPostResponded", {
      message: `На ваш пост: ${respond.post.title}, откликнулся ${user.name}`,
    });

    res.status(201).json({ message: "Вы откликнулись на объявление" });
    next();
  }
}

export default PostRespondsController;
