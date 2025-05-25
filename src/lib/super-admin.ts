import { ENV } from "@/configs/env-config.js";
import adminService from "@/services/admin-services.js";

/* eslint-disable no-console */
export async function createSuperAdmin() {
  try {
    const adminData = {
      firstname: "System",
      lastname: "Superadmin",
      email: ENV.SUPERADMIN_EMAIL,
      password: ENV.SUPERADMIN_PASS,
    };

    const adminExists = await adminService.exists(adminData.email);

    if (adminExists) {
      console.log("SUPERADMIN HAS ALREADY BEEN CREATED");
      return;
    }

    const hashedPassword = await adminService.hashPassword(adminData.password);

    const superadmin = await adminService.create({
      ...adminData,
      password: hashedPassword,
    });

    console.log("Admin created successfully: \n");
    console.log("----------------------------------");
    console.log(`Email: ${superadmin.email}`);
    console.log("----------------------------------");
  } catch (error) {
    console.error("\nFailed to create superadmin:");
    console.error("----------------------------------");
    console.error(error);
    console.error("----------------------------------");
    process.exit(1);
  }
}
