const OWNER = "goblincave-org";
const REPO = "image-host";
const BRANCH = "main";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    let path = decodeURIComponent(url.pathname.replace(/^\/+/, ""));

    const apiURL = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}?ref=${BRANCH}`;

    const gh = await fetch(apiURL, {
      headers: {
        "User-Agent": "cf-github-autoindex",
        ...(env.GITHUB_TOKEN && {
          "Authorization": `Bearer ${env.GITHUB_TOKEN}`
        })
      }
    });

    if (!gh.ok) {
      return new Response("404 Not Found", { status: 404 });
    }

    const data = await gh.json();

    if (!Array.isArray(data)) {
      return Response.redirect(data.download_url, 302);
    }

    return new Response(renderIndex(path, data), {
      headers: { "content-type": "text/html; charset=utf-8" }
    });
  }
};

function renderIndex(path, items) {
  const dirs = items.filter(i => i.type === "dir").sort(sortName);
  const files = items.filter(i => i.type === "file").sort(sortName);

  const parent = path ? path.split("/").slice(0, -1).join("/") : "";

  let rows = "";

  if (path) {
    rows += `<tr><td>📁</td><td><a href="/${parent}">../</a></td><td></td></tr>`;
  }

  for (const d of dirs) {
    rows += `<tr><td>📁</td><td><a href="/${d.path}/">${d.name}/</a></td><td></td></tr>`;
  }

  for (const f of files) {
    rows += `<tr><td>🖼️</td><td><a href="/${f.path}">${f.name}</a></td><td>${formatSize(f.size)}</td></tr>`;
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Goblin Hosting Inc.</title>
  <style>
    body { font-family: monospace; padding: 20px }
    table { border-collapse: collapse }
    td { padding: 2px 8px }
    a { text-decoration: none }
  </style>
</head>
<body>
<p>Contact: contact@goblincave.org</p>
<h2>Index of /${path}</h2>
<table>${rows}</table>
</body>
</html>`;
}

function sortName(a, b) {
  return a.name.localeCompare(b.name);
}

function formatSize(bytes) {
  if (!bytes) return "";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  while (bytes >= 1024 && i < units.length - 1) {
    bytes /= 1024;
    i++;
  }
  return `${bytes.toFixed(1)} ${units[i]}`;
}
