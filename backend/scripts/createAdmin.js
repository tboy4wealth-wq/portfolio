import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import Admin from "../model/Admin.js";

dotenv.config();

await mongoose.connect(process.env.MONGO_URI);

const adminExists = await Admin.findOne({
  email: "treasureagbonaye18@gmail.com",
});

if (adminExists) {
  console.log("Admin already exists.");
  process.exit();
}

const hashedPassword = await bcrypt.hash("Dolphin@2006", 10);

await Admin.create({
  name: "Treasure Agbonaye",
  email: "treasureagbonaye18@gmail.com",
  password: hashedPassword,
});

console.log("✅ Admin account created.");

process.exit();