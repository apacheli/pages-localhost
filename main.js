const ignore = [
  ".git",
  ".vscode",
  ".gitattributes",
  ".gitignore",
];

export async function build(root, directories, files) {
  await Deno.mkdir(root, { recursive: true });
  await Promise.all(
    directories.map((directory) =>
      Deno.mkdir(`${root}/${directory}`, { recursive: true })
    ),
  );
  const promises = [];
  for (const file in files) {
    promises.push(Deno.writeTextFile(`${root}/${file}`, render(files[file])));
  }
  await Promise.all(promises);
}

const types = {
  ".7z": "application/x-7z-compressed",
  ".apng": "image/apng",
  ".css": "text/css",
  ".csv": "text/csv",
  ".gif": "image/gif",
  ".gz": "application/gzip",
  ".html": "text/html",
  ".jpeg": "image/jpeg",
  ".js": "text/javascript",
  ".json": "application/json",
  ".md": "text/plain",
  ".mp3": "audio/mpeg",
  ".mp4": "video/mp4",
  ".png": "image/png",
  ".pdf": "application/pdf",
  ".rar": "application/vnd.rar",
  ".svg": "image/svg+xml",
  ".txt": "text/plain",
  ".wav": "audio/wav",
  ".webp": "image/webp",
  ".xml": "application/xml",
  ".zip": "application/zip",
};

export async function* readDirRecursive(path) {
  for await (const { name, isFile } of Deno.readDir(path)) {
    if (ignore.includes(name)) {
      continue;
    }
    if (isFile) {
      const extIndex = name.lastIndexOf(".");
      yield {
        data: await Deno.readFile(`${path}/${name}`),
        name,
        path,
        type: extIndex > 0
          ? types[name.substring(extIndex)] ?? "application/octet-stream"
          : "text/plain",
      };
    } else {
      yield* readDirRecursive(`${path}/${name}`);
    }
  }
}

export async function router(path) {
  const routes = new Map();
  for await (const f of readDirRecursive(path)) {
    routes.set(`${f.path.substring(path.length)}/${f.name}`, f);
  }
  return routes;
}

export function respond(route, status) {
  return new Response(route.data, {
    headers: {
      "Content-Type": route.type,
    },
    status,
  });
}

export function handler(request, routes) {
  const { pathname } = new URL(request.url);
  const route = pathname === "/"
    ? routes.get("/index.html")
    : routes.get(pathname) ?? routes.get(`${pathname}.html`);
  if (route) {
    return respond(route, 200);
  }
  const nf = routes.get("/404.html");
  return nf ? respond(nf, 404) : new Response("Not Found", { status: 404 });
}

async function main(root, port) {
  const routes = await router(root);
  console.log(`\n${[...routes.keys()].join("\n")}\n`);
  return Deno.serve({ port }, (request) => handler(request, routes));
}

if (import.meta.main) {
  const [root, port] = Deno.args;
  main(root ?? ".", port ? parseInt(port) : 1337);
}
