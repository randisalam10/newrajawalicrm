const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const dllPath = path.join(__dirname, "..", "node_modules", ".prisma", "client", "query_engine-windows.dll.node");
if (fs.existsSync(dllPath)) {
    const backupPath = `${dllPath}.old.${Date.now()}`;
    try {
        fs.renameSync(dllPath, backupPath);
        console.log("Renamed locked DLL to:", backupPath);
    } catch (e) {
        console.log("Could not rename DLL (might not be locked):", e.message);
    }
}

console.log("Running prisma generate...");
const output = execSync("npx prisma generate", { encoding: "utf-8", stdio: "inherit" });
console.log("Prisma generate completed!");
