import User from "../models/User.js";
import bcrypt from "bcrypt";
import z from "zod";

// Расширенные схемы валидации
const loginSchema = z.object({
  email: z.string().email({ message: "Некорректный формат email" }),
  password: z.string().min(3, { message: "Пароль должен содержать минимум 3 символа" })
});

const registerSchema = z.object({
  email: z.string().email({ message: "Некорректный формат email" }),
  password: z.string()
    .min(3, { message: "Пароль должен содержать минимум 3 символа" })
    .max(100, { message: "Пароль слишком длинный" }),
  name: z.string()
    .min(3, { message: "Имя должно содержать минимум 3 символа" })
    .max(50, { message: "Имя слишком длинное" })
});

class AuthController {
  static async authorization(req, res, next) {
    try {
      const data = req.body;

      const validated = loginSchema.safeParse(data);
      if (!validated.success) {
        return res.status(422).json({ 
          message: "Ошибка валидации", 
          errors: validated.error.formErrors.fieldErrors 
        });
      }

      const user = await User.query.findFirst({
        where: { email: validated.data.email },
        select: ['id', 'email', 'password', 'name'] // Явно указываем поля для безопасности
      });

      if (!user) {
        return res.status(401).json({ message: "Неверный email или пароль" });
      }

      const passwordMatch = await bcrypt.compare(validated.data.password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ message: "Неверный email или пароль" });
      }

      const { password, ...userData } = user;
      
      const token = User.jwtSign(userData);

      return res.json({
        message: 'Успешный вход',
        token: token,
        user: userData // Возвращаем основные данные пользователя
      });

    } catch (error) {
      console.error('Ошибка авторизации:', error);
      return res.status(500).json({ message: "Внутренняя ошибка сервера" });
    }
  }

  static async register(req, res, next) {
    try {
      const data = req.body;

      const validated = registerSchema.safeParse(data);
      if (!validated.success) {
        return res.status(422).json({ 
          message: "Ошибка валидации", 
          errors: validated.error.formErrors.fieldErrors 
        });
      }
      
      const userExists = await User.query.findFirst({
        where: { email: validated.data.email },
        select: ['id'] // Запрашиваем только id для проверки существования
      });

      if (userExists) {
        return res.status(409).json({ message: "Пользователь с таким email уже существует" });
      }

      const hashedPassword = await bcrypt.hash(validated.data.password, 12); // Увеличиваем salt rounds

      const newUser = await User.query.create({
        data: {
          ...validated.data,
          password: hashedPassword
        },
        select: ['id', 'email', 'name'] // Не возвращаем пароль
      });

      if (!newUser) {
        throw new Error("Не удалось создать пользователя");
      }

      const token = User.jwtSign(newUser);

      return res.status(201).json({
        message: 'Успешная регистрация',
        token: token,
        user: newUser
      });

    } catch (error) {
      console.error('Ошибка регистрации:', error);
      return res.status(500).json({ message: "Не удалось создать пользователя" });
    }
  }
}

export default AuthController;