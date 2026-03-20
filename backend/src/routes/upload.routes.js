import express from "express";
import upload from "../middlewares/upload.middleware.js";
import { uploadPdf } from "../controllers/upload.controller.js";

const router = express.Router();

router.post("/upload", upload.single("file"), uploadPdf);

export default router;