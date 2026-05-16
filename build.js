const Handlebars = require("handlebars");
const fs = require("fs");
const path = require("path");

const SRC = path.join(__dirname, "src");
const DIST = path.join(__dirname, ".dist");

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function build() {
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });

  // Register partials
  const partialsDir = path.join(SRC, "partials");
  for (const file of fs.readdirSync(partialsDir)) {
    if (!file.endsWith(".hbs")) continue;
    const name = path.basename(file, ".hbs");
    Handlebars.registerPartial(name, fs.readFileSync(path.join(partialsDir, file), "utf8"));
  }

  // Load layout
  const layout = Handlebars.compile(
    fs.readFileSync(path.join(SRC, "layouts", "default.hbs"), "utf8")
  );

  // Compile pages
  const pagesDir = path.join(SRC, "pages");
  for (const file of fs.readdirSync(pagesDir)) {
    if (!file.endsWith(".hbs")) continue;
    const name = path.basename(file, ".hbs");
    const pageTemplate = Handlebars.compile(
      fs.readFileSync(path.join(pagesDir, file), "utf8")
    );
    const body = pageTemplate({});
    const html = layout({ body });
    if (name !== "index") fs.mkdirSync(path.join(DIST, name), { recursive: true });
    fs.writeFileSync(path.join(DIST, name === "index" ? "index.html" : `${name}/index.html`), html);
  }

  // Copy static assets
  const publicDir = path.join(SRC, "public");
  if (fs.existsSync(publicDir)) {
    copyDir(publicDir, DIST);
  }

  console.log("Build complete →", DIST);
}

build();
