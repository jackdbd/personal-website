import child_process from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import defDebug from "debug";

const rm = promisify(fs.rm);
const exec = promisify(child_process.exec);

const debug = defDebug(`script:postbuild`);

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = path.join(__filename, "..", "..");
const DEST_DIR = path.join(REPO_ROOT, "tmp");

const main = async () => {
  await rm(DEST_DIR, { force: true, recursive: true });
  debug(`removed ${DEST_DIR}`);

  const cmd = `ls --size --human-readable _site/ | head -n 1`;
  console.log(cmd);
  const { stderr, stdout } = await exec(cmd);
  if (stderr) {
    console.error(stderr);
  }
  if (stdout) {
    console.info(stdout);
  }
};

main();
