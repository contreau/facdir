import { Window } from "happy-dom";

interface facultyData {
  LastName: string;
  FirstName: string;
  FullName: string;
  URL: string;
  Email: string | null;
}

// * Read in fac-sample.json
const file = Bun.file("directory_data/fac-sample.json");
const text = await file.text();
const fac_data = JSON.parse(text);

const example: facultyData[] = fac_data["Sidawy"];
console.log(fac_data["Sidawy"]);

// * Read in surgery.html
const surgery_file = Bun.file("html/input/surgery.html");
const surgery_html = await surgery_file.text();

// * Create the 'DOM'
const window = new Window();
const document = window.document;
document.body.innerHTML = surgery_html;

// * By row, grab all <a> and replace the appropriate href value
const info_container = document.querySelector("tr")!;
const anchors = Array.from(info_container.querySelectorAll("a"));
for (const anchor of anchors) {
  const a = anchor as unknown as HTMLAnchorElement;
  if (a.href.includes("sendemail")) {
    a.href = `mailto:${example[0].Email}`;
  } else {
    a.href = example[0].URL;
  }
}

console.log(info_container.outerHTML);
await window.happyDOM.close();
