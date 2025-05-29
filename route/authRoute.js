import express from "express";
import { body, validationResult } from "express-validator";
import jwt from "jsonwebtoken";
const router = express.Router();
import { PrismaClient } from "../generated/prisma/index.js";
const prisma = new PrismaClient();

router.post(
  "/login",
  [
    body("username").isString().notEmpty().withMessage("Username is required"),
    body("password").isString().notEmpty().withMessage("Password is required"),
  ],
  async (req, res) => {
    try {
      const { username, password } = req.body;
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const user = await prisma.user.findFirst({
        where: {
          username: username,
        },
      });

      if (!user) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      if (user.password !== password) {
        return res.status(401).json({
          message: "Invalid password",
        });
      } else {
        const token = jwt.sign(
          {
            userId: user.id,
            username: user.username,
          },
          process.env.SECRETE_KEY,
          {
            expiresIn: "1h",
          }
        );
        res.cookie("token", token, {
          httpOnly: true,
          maxAge: 3600000,
        });
        return res.status(200).json({
          message: "Login Successful",
        });
      }
    } catch (error) {
      console.error("Error during login:", error);
      return res.status(500).json({
        message: "Internal server error",
        status: "error",
      });
    }
  }
);

router.post(
  "/register",
  [
    body("username").isString().notEmpty().withMessage("Username is required"),
    body("password").isString().notEmpty().withMessage("Password is required"),
  ],
  async (req, res) => {
    try {
      const { username, password } = req.body;
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const existingUser = await prisma.user.findFirst({
        where: {
          username: username,
        },
      });

      if (existingUser) {
        return res.status(409).json({
          message: "Username already exists",
        });
      }

      const newUser = await prisma.user.create({
        data: {
          username: username,
          password: password,
        },
      });

      return res.status(201).json({
        message: "User registered successfully",
        userId: newUser.id,
      });
    } catch (error) {
      console.error("Error during registration:", error);
      return res.status(500).json({
        message: "Internal server error",
        status: "error",
      });
    }
  }
);

export { router as authRoute };
