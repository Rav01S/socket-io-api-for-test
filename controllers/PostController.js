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
        responds: {
          select: {
            userId: true
          }
        },
      },
    });

    res.json({
      message: "Посты получены",
      posts: posts.map((el) => ({
        id: el.id,
        title: el.title,
        author: el.author,
        isResponded: el.responds.some(item => item.userId === user.id)
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
      include: {
        author: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    });

    const io = req.app.get("io");

    await io.emit("newPost", newPost);

    res.status(201).json({ message: `Пост '${newPost.title}' создан` });
    next();
  }
}

export default PostController;
