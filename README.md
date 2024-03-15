# pages-localhost

See how GitHub Pages serves your files but locally and before you deploy it.

## Running the Server

[You need Deno 1.41.0+.](https://deno.com/)

```sh
$ deno run --allow-read --allow-net https://raw.githubusercontent.com/apacheli/pages-localhost/master/main.js [root] [port]
```

## Running Programmatically

```js
import {
  handler,
  router,
} from "https://raw.githubusercontent.com/apacheli/pages-localhost/master/main.js";

const routes = await router(".");
console.log(`\n${[...routes.keys()].join("\n")}\n`);
Deno.serve({ port: 1337 }, (request) => handler(request, routes));
```

## License

[LICENSE.txt](LICENSE.txt)
