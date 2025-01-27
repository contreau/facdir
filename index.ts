import { readdir } from "node:fs/promises";
import { Window } from "happy-dom";
import type { nameFields, facultyCollection, longNames } from "./types";

// gather all html file names into one array
const html_fileNames: string[] = [];
const html_dir = await readdir("./html");
for (let file of html_dir) {
  html_fileNames.push(file);
}

// iteratively read the html files into the script and process
// (limited for now until I get the full data)

// catches all names that have more than one ' ' between names - will likely need to manually adjust their entries
// this can be saved as its own json file
const all_profiles: Array<facultyCollection> = [];
const long_names: longNames = {};

for (let filename of html_fileNames) {
  const facultyCollection: facultyCollection = {
    department: "",
    profiles: [],
  };
  const file = Bun.file(`./html/${filename}`);
  const file_text = await file.text();
  const department = filename.split(".html")[0];
  if (!long_names[`${department}`]) {
    long_names[`${department}`] = [];
  }
  facultyCollection.department = department;
  // query the <a> tags holding the faculty names
  const window = new Window();
  const document = window.document;
  document.body.innerHTML = file_text;
  const names = Array.from(document.querySelectorAll("p.mdbluetext a")).map(
    (n) => {
      let fields: nameFields;
      const split_name: string[] = n.textContent.split(" ");
      if (split_name.length > 2) {
        long_names[`${department}`].push(n.textContent);
        const last_name_split = split_name.slice(1, split_name.length);
        const lastName = last_name_split.join(" ");
        fields = {
          firstName: split_name[0],
          lastName: lastName,
        };
      } else {
        fields = {
          firstName: split_name[0],
          lastName: split_name[1],
        };
      }
      return fields;
    }
  );
  for (let name of names) {
    facultyCollection.profiles.push(name);
  }
  all_profiles.push(facultyCollection);
  await window.happyDOM.close();
}

// write json files
Bun.write("./all_profiles/profiles.json", JSON.stringify(all_profiles));
Bun.write("./long_names/longnames.json", JSON.stringify(long_names));
console.log("Long Names:", long_names);
