try {
  chrome.devtools.panels.create('JSON-RPC Developer Tool', 'icon-34.png', 'src/pages/panel/index.html');
} catch (e) {
  console.error(e);
}
