import z from "zod";
import Post from "../models/Post.js";

const createPostValidate = z.object({
  title: z.string().min(3),
});

class PostController {
  static async getPosts(req, res, next) {
    const user = req.user;

    const posts = await Post.query.findMany({
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        responds: true,
      },
    });

    res.json({
      message: "Посты получены",
      posts: posts.map((el) => ({
        id: el.id,
        title: el.title,
        author: el.author,
        isResponded: el.responds.includes(val => val.userId === user.id)
      })),
    });
    next();
  }

  static async createPost(req, res, next) {
    const data = req.body;
    const user = req.user;

    const validated = createPostValidate.safeParse(data);

    if (!validated.success) {
      res.status(422).json({
        message: "Ошибка валидации",
        errors: validated.error.formErrors.fieldErrors,
      });
      return;
    }

    const newPost = await Post.query.create({
      data: {
        authorId: user.id,
        title: validated.data.title,
      },
    });

    res.status(201).json({ message: `Пост '${newPost.title}' создан` });
    next();
  }
}

export default PostController;
