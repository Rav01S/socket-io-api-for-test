import User from "../models/User.js";
import bcrypt from "bcrypt";
import z from "zod";

const loginShema = z.object({
  email: z.string().email(),
  password: z.string().min(3)
})

const registerShema = z.object({
  email: z.string().email(),
  password: z.string().min(3),
  name: z.string().min(3)
})

class AuthController {
  static async authorization(res, req, next) {
    const data = res.body;

    const validated = loginShema.safeParse(data)

    if (!validated.success) {
      res.status(422).json({ message: "Ошибка валидации", errors: validated.error.errors });
      return;
    }

    const userExists = await User.query.findFirst({
      where: {
        email: data.email,
      },
    });

    if (!userExists) {
      res.status(422).json({ message: "Неверный Email или пароль" });
      return;
    }

    if (!bcrypt.compareSync(data.password, userExists.password)) {
      res.status(422).json({ message: "Неверный Email или пароль" });
      return;
    }

    const {password, ...userData} = userExists;

    res.cookie('user', JSON.stringify(userData)).json({message: 'Успешный вход'})
    next();
  }

  static async register(res, req, next) {
    const data = res.body;

    const validated = registerShema.safeParse(data);

    if (!validated.success) {
      res.status(422).json({ message: "Ошибка валидации", errors: validated.error.errors });
      return;
    }
    
    const userExists = await User.query.findFirst({
      where: {
        email: data.email,
      },
    });

    if (!userExists) {
      res.status(422).json({ message: "Пользователь с таким Email уже существует" });
      return;
    }

    const newUser = User.query.create({
      data: {
        ...validated.data,
        password: bcrypt.hashSync(validated.data.password, 10)
      }
    })

    if (!newUser) {
      res.status(500).json({ message: "Не удалось создать пользователя" });
      return;
    }

    const {password, ...userData} = newUser;

    res.cookie('user', JSON.stringify(userData)).json({message: 'Успешная регистрация'})
    next()
  }
}

export default AuthController;
