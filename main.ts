const ignore = [
  ".git",
  ".vscode",
  ".gitattributes",
  ".gitignore",
  "CNAME",
  "package.json",
  "package-lock.json",
];

const types: Record<string, string | undefined> = {
  ".css": "text/css",
  ".html": "text/html",
  ".js": "text/javascript",
  ".json": "application/json",
  ".md": "text/plain",
  ".txt": "text/plain",
};

interface FileEntry {
  data: Uint8Array;
  name: string;
  path: string;
  type: string;
}

async function* readDirRecursive(path: string): AsyncGenerator<FileEntry> {
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
          ? types[name.substring(extIndex)] ?? "text/plain"
          : "text/plain",
      };
    } else {
      yield* readDirRecursive(`${path}/${name}`);
    }
  }
}

function respond(fileEntry: FileEntry, status?: number) {
  return new Response(fileEntry.data, {
    headers: {
      "Content-Type": fileEntry.type,
    },
    status,
  });
}

async function main(path: string, port: number) {
  const pathnames = new Map<string, FileEntry>();
  for await (const fileEntry of readDirRecursive(path)) {
    const pathname = `${fileEntry.path.substring(1)}/${fileEntry.name}`;
    console.log(`=> http://localhost:${port}${pathname}`);
    pathnames.set(pathname, fileEntry);
  }
  return Deno.serve({ port }, (request) => {
    const { pathname } = new URL(request.url);
    const fileEntry = pathname === "/"
      ? pathnames.get("/index.html")
      : pathnames.get(pathname) ?? pathnames.get(`${pathname}.html`);
    if (fileEntry !== undefined) {
      return respond(fileEntry);
    }
    const nf = pathnames.get("/404.html");
    return nf ? respond(nf, 404) : new Response("Not Found", { status: 404 });
  });
}

if (import.meta.main) {
  const [root, port] = Deno.args;
  main(root ?? ".", port ? parseInt(port) : 1337);
}
