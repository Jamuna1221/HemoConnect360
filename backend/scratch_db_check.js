import { getNotifications } from "./src/modules/admin/admin.service.js";
import dotenv from "dotenv";
dotenv.config();

async function run() {
  console.log("Testing getNotifications...");
  try {
    const data = await getNotifications();
    console.log("getNotifications success! Count:", data.length);
  } catch (err) {
    console.error("getNotifications failed:", err);
  }
}

run();
