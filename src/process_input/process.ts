import { readdir } from "node:fs/promises";
import { Window } from "happy-dom";
import type { HTMLAnchorElement } from "happy-dom/src/index.ts";
import type { nameFields, facultyCollection, namesByDepartment } from "./types";
import { checkDirectory, formatLongNames } from "./helpers";

// ? ABOUT THIS SCRIPT
// This file iterates through and parses all html files in the html/input directory and generates several JSON files:
// A complete list of profiles by department (all_profiles)
// Any multi-part or long names that need to be manually edited (long_names)
// Missing profiles that can be deleted from the original HTML

// * SCRIPT START
// * Gather all html file names into one array
const html_fileNames: string[] = [];
const html_dir = await readdir("html/input");
for (let file of html_dir) {
  html_fileNames.push(file);
}

// * Data to be written to JSON
const all_profiles: Array<facultyCollection> = [];
const long_names: namesByDepartment = {};
const missing_profiles: namesByDepartment = {};

// * BEGIN FILE PROCESSING
console.clear();
for (let filename of html_fileNames) {
  const facultyCollection: facultyCollection = {
    department: "",
    profiles: [],
  };
  const file = Bun.file(`html/input/${filename}`);
  console.log(`Processing ${filename}...`);
  const file_text = await file.text();
  const department = filename.split(".html")[0];

  // * Initialize arrays in long_names and missing_profiles directories
  if (!long_names[`${department}`]) {
    long_names[`${department}`] = [];
  }
  if (!missing_profiles[`${department}`]) {
    missing_profiles[`${department}`] = [];
  }
  facultyCollection.department = department;

  // * Create the 'DOM' for the given html file
  const window = new Window();
  const document = window.document;
  document.body.innerHTML = file_text;

  // * Loop through the <a> tags to process names
  const name_anchors = Array.from(document.querySelectorAll("p.mdbluetext a"));
  const names: nameFields[] = [];
  for (const a of name_anchors) {
    const anchor = a as unknown as HTMLAnchorElement;
    const inDirectory: boolean = await checkDirectory(anchor.href);
    if (!inDirectory) {
      missing_profiles[`${department}`].push(anchor.textContent);
      continue;
    }
    let fields: nameFields;
    let has_titles: boolean = false;
    let stripped_name: string | null = null;
    let split_name: string[];

    // * Handle names with titles
    if (anchor.textContent.includes(",")) {
      has_titles = true;
      const titled_name = anchor.textContent.split(",");
      stripped_name = titled_name[0];
      split_name = stripped_name.split(" ");
    } else {
      split_name = anchor.textContent.split(" ");
    }

    // * Handle long names that had titles
    if (split_name.length > 2 && has_titles) {
      long_names[`${department}`].push(stripped_name as string);
      const last_name_split = split_name.slice(1, split_name.length);
      const lastName = last_name_split.join(" ");
      fields = {
        FirstName: split_name[0],
        LastName: lastName,
      };
    }

    // * Handle long names without titles
    else if (split_name.length > 2 && !has_titles) {
      // * Remove any ending parenthesized substrings, then continue
      const last_substring = split_name.at(-1);
      if (last_substring !== undefined && last_substring[0] === "(") {
        split_name.pop();
        if (split_name.length > 2) {
          fields = formatLongNames(long_names, department, split_name, anchor);
        } else {
          fields = {
            FirstName: split_name[0],
            LastName: split_name[1],
          };
        }
      } else {
        fields = formatLongNames(long_names, department, split_name, anchor);
      }
    }

    // * Default handling of names
    else {
      fields = {
        FirstName: split_name[0],
        LastName: split_name[1],
      };
    }
    names.push(fields);
  }

  for (let name of names) {
    facultyCollection.profiles.push(name);
  }
  all_profiles.push(facultyCollection);
  await window.happyDOM.close();
}

// * Write to the output JSON files
Bun.write("all_profiles/profiles.json", JSON.stringify(all_profiles));
Bun.write("long_names/longnames.json", JSON.stringify(long_names));
Bun.write(
  "missing_profiles/missingprofiles.json",
  JSON.stringify(missing_profiles)
);
console.clear();
console.log("Finished processing.");
