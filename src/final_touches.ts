import { readdir } from "node:fs/promises";
import { Window } from "happy-dom";

// ? ABOUT: Removes email buttons and swaps out the placeholder image link.

// * Gather all html file names into one array
const html_fileNames: string[] = [];
const html_dir = await readdir("html/output");
for (let file of html_dir) {
  html_fileNames.push(file);
}

async function process_outputHTML(directory: string[]) {
  for (let filename of directory) {
    const file = Bun.file(`html/output/${filename}`);
    console.log(`Processing ${filename}...`);
    const file_text = await file.text();

    // * Create the 'DOM' for the given html file
    const window = new Window();
    const document = window.document;
    document.body.innerHTML = file_text;

    // * Replace all placeholder image link
    const placeholder_images = Array.from(
      document.querySelectorAll(
        "img[src='https://smhs.gwu.edu/sites/g/files/zaskib1151/files/styles/1920_x_variable/public/2024-04/avatar-headshot--200x245.jpg?itok=_5durzkz'"
      )
    ) as unknown as HTMLImageElement[];

    placeholder_images.forEach(
      (img) =>
        (img.src =
          "https://faculty.smhs.gwu.edu/sites/g/files/zaskib1436/files/styles/200x245/public/2025-02/default-placeholder-200x245.png")
    );

    // * Remove all email buttons
    const email_divs = Array.from(
      document.querySelectorAll("div.faculty-icon--container:has(a[aria-label='Send email'])")
    ) as unknown as HTMLDivElement[];
    email_divs.forEach((div) => div.remove());

    Bun.write(`html/finals/${filename}`, document.body.innerHTML);
    await window.happyDOM.close();
  }
  console.clear();
  console.log("Applied final touches to the HTML output. Check html/finals for resulting files.");
}

process_outputHTML(html_fileNames);
