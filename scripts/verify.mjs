import { spawnSync } from "node:child_process";

const commands = [
  ["npm", ["run", "check", "--workspaces", "--if-present"]],
  ["npm", ["run", "test", "--workspaces", "--if-present"]]
];

for (const [command, args] of commands) {
  const result = spawnSync(command, args, { stdio: "inherit" });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
