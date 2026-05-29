const { spawn, spawnSync } = require("child_process");
const os = require("os");
const path = require("path");

const isWindows = process.platform === "win32";
const sdkRoot =
  process.env.ANDROID_HOME ||
  process.env.ANDROID_SDK_ROOT ||
  (isWindows
    ? path.join(os.homedir(), "AppData", "Local", "Android", "Sdk")
    : path.join(os.homedir(), "Android", "Sdk"));

process.env.ANDROID_HOME = sdkRoot;
process.env.ANDROID_SDK_ROOT = sdkRoot;
process.env.EXPO_NO_DEPENDENCY_VALIDATION =
  process.env.EXPO_NO_DEPENDENCY_VALIDATION || "1";
process.env.PATH = [
  path.join(sdkRoot, "platform-tools"),
  path.join(sdkRoot, "emulator"),
  process.env.PATH || ""
].join(path.delimiter);

const adb = path.join(sdkRoot, "platform-tools", isWindows ? "adb.exe" : "adb");
const emulator = path.join(sdkRoot, "emulator", isWindows ? "emulator.exe" : "emulator");
const expoBin = path.join(
  __dirname,
  "..",
  "node_modules",
  ".bin",
  isWindows ? "expo.cmd" : "expo"
);

function run(command, args) {
  return spawnSync(command, args, {
    encoding: "utf8",
    env: process.env,
    windowsHide: true
  });
}

function getConnectedDevices() {
  const result = run(adb, ["devices"]);
  if (result.status !== 0 || !result.stdout) {
    return [];
  }

  return result.stdout
    .split(/\r?\n/)
    .slice(1)
    .map((line) => line.trim())
    .filter((line) => line.endsWith("\tdevice"));
}

function getAvailableAvds() {
  const result = run(emulator, ["-list-avds"]);
  if (result.status !== 0 || !result.stdout) {
    return [];
  }

  return result.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function getLanIpAddress() {
  const interfaces = os.networkInterfaces();

  for (const entries of Object.values(interfaces)) {
    for (const entry of entries || []) {
      if (entry.family === "IPv4" && !entry.internal) {
        return entry.address;
      }
    }
  }

  return "";
}

const devices = getConnectedDevices();
const avds = getAvailableAvds();
const canOpenAndroid = devices.length > 0 || avds.length > 0;
const lanIpAddress = getLanIpAddress();

if (process.env.EXPO_PUBLIC_API_BASE_URL) {
  console.log(`Using configured backend API: ${process.env.EXPO_PUBLIC_API_BASE_URL}`);
} else if (lanIpAddress) {
  console.log(`Detected LAN backend API: http://${lanIpAddress}:4000/api`);
  console.log("The app will also retry the Expo dev-server host if this IP changes.");
}

if (!canOpenAndroid) {
  console.log("");
  console.log("No Android phone or emulator was found.");
  console.log("Starting Expo in LAN mode instead of failing.");
  console.log("");
  console.log("To open on Android:");
  console.log("1. Connect a phone with USB debugging enabled, then press a in this Expo terminal.");
  console.log("2. Or create an emulator in Android Studio > Device Manager, then rerun npm run android.");
  console.log("3. Or install Expo Go on your phone and scan the QR code.");
  console.log("");
}

const args = canOpenAndroid
  ? ["start", "--android", "--lan", "--clear"]
  : ["start", "--lan", "--clear"];
const command = isWindows ? "cmd.exe" : expoBin;
const commandArgs = isWindows
  ? ["/d", "/c", expoBin, ...args]
  : args;

const child = spawn(command, commandArgs, {
  stdio: "inherit",
  env: process.env,
  windowsHide: false
});

child.on("exit", (code) => {
  process.exit(code || 0);
});
