import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const root = fileURLToPath(new URL("..", import.meta.url));
const schemaPath = join(root, "schema", "resource.schema.json");
const folders = [
  { dir: join(root, "data", "resources"), status: "approved", allowEmpty: false },
  { dir: join(root, "data", "inbox"), status: "pending_review", allowEmpty: true },
];

const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
const validate = ajv.compile(JSON.parse(readFileSync(schemaPath, "utf8")));

const errors = [];
const seenIds = new Map();

for (const folder of folders) {
  const files = readdirSync(folder.dir).filter((name) => name.endsWith(".json")).sort();
  if (files.length === 0 && !folder.allowEmpty) {
    errors.push(`${folder.dir}: expected at least one JSON record`);
  }

  for (const name of files) {
    const filePath = join(folder.dir, name);
    const relative = filePath.slice(root.length + 1);
    let record;
    try {
      record = JSON.parse(readFileSync(filePath, "utf8"));
    } catch (error) {
      errors.push(`${relative}: ${error.message}`);
      continue;
    }

    if (!validate(record)) {
      for (const issue of validate.errors ?? []) {
        errors.push(`${relative}: ${issue.instancePath || "/"} ${issue.message}`);
      }
    }

    const id = typeof record.id === "string" ? record.id : "";
    const stem = basename(name, ".json");
    if (id !== stem) {
      errors.push(`${relative}: id "${id}" does not match filename "${stem}"`);
    }
    if (record.status !== folder.status) {
      errors.push(
        `${relative}: status must be "${folder.status}" in this folder (got "${record.status}")`,
      );
    }
    if (id) {
      const previous = seenIds.get(id);
      if (previous) {
        errors.push(`${relative}: duplicate id "${id}" (also in ${previous})`);
      } else {
        seenIds.set(id, relative);
      }
    }

    const screenshot = record.preview?.screenshot;
    if (typeof screenshot === "string" && screenshot.startsWith("/")) {
      const asset = join(root, "public", screenshot.replace(/^\/+/, ""));
      if (!existsSync(asset)) {
        errors.push(`${relative}: screenshot not found at ${asset}`);
      }
    }
  }
}

if (errors.length > 0) {
  for (const error of errors) {
    console.error(error);
  }
  console.error(`\n${errors.length} problem(s).`);
  process.exit(1);
}

console.log(`Validated ${seenIds.size} resource record(s).`);
