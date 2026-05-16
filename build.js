const Handlebars = require("handlebars");
const fs = require("fs");
const path = require("path");

const SRC = path.join(__dirname, "src");
const DIST = path.join(__dirname, ".dist");
const baseUrl = (process.env.BASE_URL || "").replace(/\/$/, "");

const pageMeta = {
  index:  { title: "Bröllopsspelen",         bodyClass: "page-index" },
  info:   { title: "Info — Bröllopsspelen",   bodyClass: "page-info"  },
  osa:    { title: "OSA — Bröllopsspelen",    bodyClass: "page-osa"   },
};

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

  const partialsDir = path.join(SRC, "partials");
  for (const file of fs.readdirSync(partialsDir)) {
    if (!file.endsWith(".hbs")) continue;
    const name = path.basename(file, ".hbs");
    Handlebars.registerPartial(name, fs.readFileSync(path.join(partialsDir, file), "utf8"));
  }

  const layout = Handlebars.compile(
    fs.readFileSync(path.join(SRC, "layouts", "default.hbs"), "utf8")
  );

  const pagesDir = path.join(SRC, "pages");
  for (const file of fs.readdirSync(pagesDir)) {
    if (!file.endsWith(".hbs")) continue;
    const name = path.basename(file, ".hbs");
    const meta = pageMeta[name] || { title: "Bröllopsspelen", bodyClass: "" };
    const ctx = { baseUrl, ...meta };
    const pageTemplate = Handlebars.compile(
      fs.readFileSync(path.join(pagesDir, file), "utf8")
    );
    const body = pageTemplate(ctx);
    const html = layout({ ...ctx, body });
    if (name !== "index") fs.mkdirSync(path.join(DIST, name), { recursive: true });
    fs.writeFileSync(path.join(DIST, name === "index" ? "index.html" : `${name}/index.html`), html);
  }

  const publicDir = path.join(SRC, "public");
  if (fs.existsSync(publicDir)) {
    copyDir(publicDir, DIST);
  }

  console.log(`[${new Date().toLocaleTimeString()}] Build complete → ${DIST}`);
}

build();

if (process.argv.includes("--watch")) {
  let debounce;
  fs.watch(SRC, { recursive: true }, () => {
    clearTimeout(debounce);
    debounce = setTimeout(build, 100);
  });
  console.log("Watching src/ for changes…");
}
