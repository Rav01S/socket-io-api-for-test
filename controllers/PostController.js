import bcrypt from "bcrypt";
import z from "zod";
import Post from "../models/Post.js";

const createPostValidate = z.object({
  title: z.string().min(3),
});

class PostController {
  static async createPost(req, res, next) {
    const data = req.body;

    const validated = createPostValidate.safeParse(data);

    if (!validated.success) {
      res
        .status(422)
        .json({ message: "Ошибка валидации", errors: validated.error.formErrors.fieldErrors });
      return;
    }

    const authorJson = req.cookies.user;
    if (!authorJson) {
      res.status(401).json({ message: "Не авторизован" });
      return;
    }

    const authorId = JSON.parse(authorJson.id);

    const newPost = await Post.query.create({
      data: {
        authorId: authorId,
        title: validated.data.title,
      },
    });

    res.status(201).json({ message: `Пост "${newPost.title}" создан` });
    next();
  }
}

export default PostController;
