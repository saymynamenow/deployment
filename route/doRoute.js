import express from "express";
import { body, validationResult } from "express-validator";
import NodeCache from "node-cache";
const cache = new NodeCache();
import { PrismaClient } from "../generated/prisma/index.js";
const router = express.Router();
const prisma = new PrismaClient();

router.get("/post", async (req, res) => {
  try {
    const cachedData = cache.get("post");
    if (cachedData) {
      return res.status(200).json({
        message: "Data retrieved from cache",
        data: cachedData,
      });
    }

    const data = await prisma.post.findMany();
    cache.set("post", data, 3600);

    return res.status(200).json({
      message: "Data retrieved successfully",
      data: data,
    });
  } catch (error) {
    console.error("Error retrieving data:", error);
    return res.status(500).json({
      message: "Internal server error",
      status: "error",
    });
  }
});

router.post(
  "/post",
  [body("title").isString().notEmpty().withMessage("Title is required")],
  async (req, res) => {
    try {
      const { title, description } = req.body;
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const authorId = req.user.userId;

      const post = await prisma.post.create({
        data: {
          title,
          description,
          authorId,
        },
      });

      cache.del("post");

      return res.status(201).json({
        message: "Post created successfully",
        data: post,
      });
    } catch (error) {
      console.error("Error creating post:", error);
      return res.status(500).json({
        message: "Internal server error",
      });
    }
  }
);

router.delete("/post/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const post = await prisma.post.findUnique({
      where: { id: parseInt(id) },
    });
    if (!post) {
      return res.status(404).json({
        message: "Post not found",
      });
    }
    await prisma.post.delete({
      where: { id: parseInt(id) },
    });
    cache.del("post");
    return res.status(200).json({
      message: "Post deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting post:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

router.put(
  "/post/:id",
  [body("title").isString().notEmpty().withMessage("Title is required")],
  async (req, res) => {
    try {
      const { id } = req.params;
      const { title, description } = req.body;
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const post = await prisma.post.update({
        where: { id: parseInt(id) },
        data: { title, description },
      });

      cache.del("post");

      return res.status(200).json({
        message: "Post updated successfully",
        data: post,
      });
    } catch (error) {
      console.error("Error updating post:", error);
      return res.status(500).json({
        message: "Internal server error",
      });
    }
  }
);

export { router as doRoute };
