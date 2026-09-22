require("dotenv").config();

const readline = require("readline");
const bcrypt = require("bcryptjs");

const connectDB = require("../config/db");
const Admin = require("../models/Admin");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (text) => {
  return new Promise((resolve) => {
    rl.question(text, resolve);
  });
};

const createSuperAdmin = async () => {
  try {
    await connectDB();

    console.log("\n=================================");
    console.log(" VRAJ CREATION SUPERADMIN SETUP");
    console.log("=================================\n");

    const username = (
      await question("Enter Superadmin username: ")
    )
      .trim()
      .toLowerCase();

    const email = (
      await question("Enter Superadmin email: ")
    )
      .trim()
      .toLowerCase();

    const password = await question(
      "Enter Superadmin password: "
    );

    if (!username || username.length < 3) {
      throw new Error(
        "Username must contain at least 3 characters."
      );
    }

    if (!email || !email.includes("@")) {
      throw new Error("Please enter a valid email.");
    }

    if (!password || password.length < 8) {
      throw new Error(
        "Password must contain at least 8 characters."
      );
    }

    const existingUsername = await Admin.findOne({
      username,
    });

    if (existingUsername) {
      throw new Error(
        "This username is already registered."
      );
    }

    const existingEmail = await Admin.findOne({
      email,
    });

    if (existingEmail) {
      throw new Error(
        "This email is already registered."
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const superAdmin = await Admin.create({
      username,
      email,
      passwordHash,
      role: "superadmin",
      status: "approved",
      approvedAt: new Date(),
      tokenVersion: 0,
    });

    console.log("\n=================================");
    console.log(" SUPERADMIN CREATED SUCCESSFULLY");
    console.log("=================================\n");

    console.log("Username:", superAdmin.username);
    console.log("Email:", superAdmin.email);
    console.log("Role:", superAdmin.role);
    console.log("Status:", superAdmin.status);

    console.log(
      "\nYou can now login from:"
    );

    console.log(
      "http://localhost:5173/admin/login\n"
    );
  } catch (error) {
    console.error(
      "\nSuperadmin creation failed:"
    );

    console.error(error.message);
  } finally {
    rl.close();
    process.exit();
  }
};

createSuperAdmin();