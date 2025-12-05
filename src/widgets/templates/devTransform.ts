const makeReactRefreshPreamble = (assetOrigin: string) => `
  <script type="module">
    import RefreshRuntime from "${withAssetOrigin("/@react-refresh", assetOrigin)}";
    RefreshRuntime.injectIntoGlobalHook(window);
    window.$RefreshReg$ = () => {};
    window.$RefreshSig$ = () => (type) => type;
    window.__vite_plugin_react_preamble_installed__ = true;
  </script>`;

const entryRewrites: Record<string, string> = {
  "car-build-card": "/src/widgets/car-build-card/index.tsx",
  "build-list": "/src/widgets/build-list/index.tsx",
  "persona-card": "/src/widgets/persona-card/index.tsx",
  "options-grid": "/src/widgets/options-grid/index.tsx",
};

export function transformWidgetTemplateForDev(
  html: string,
  baseUrl: string,
  assetOrigin = "",
): string {
  const normalizedBase = baseUrl.replace(/\/+$/, "");
  const clientSrc = withAssetOrigin("/@vite/client", assetOrigin);
  let result = html.replace(
    /(<body[^>]*>)/i,
    `$1\n  <script type="module" src="${clientSrc}"></script>\n${makeReactRefreshPreamble(assetOrigin)}`,
  );

  result = result.replace(
    /<script type="module" src="\{\{BASE_URL\}\}\/vendor\.js"><\/script>\n?/g,
    "",
  );

  Object.entries(entryRewrites).forEach(([name, entry]) => {
    const pattern = new RegExp(
      `\\{\\{BASE_URL\\}\\}\/${name.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}\\.js`,
      "g",
    );
    result = result.replace(pattern, withAssetOrigin(entry, assetOrigin));
  });

  return result.replace(/\{\{BASE_URL\}\}/g, normalizedBase);
}

function withAssetOrigin(path: string, assetOrigin: string): string {
  if (!assetOrigin) {
    return path;
  }
  const normalizedOrigin = assetOrigin.replace(/\/+$/, "");
  return `${normalizedOrigin}${path}`;
}
