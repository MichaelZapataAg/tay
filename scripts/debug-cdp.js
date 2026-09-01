const { spawn } = require('child_process');
const http = require('http');

async function debug() {
  const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--headless',
    '--remote-debugging-port=9222',
    'https://michaelzapataag.github.io/tay/'
  ]);

  await new Promise(r => setTimeout(r, 1500));

  http.get('http://localhost:9222/json', res => {
    let raw = '';
    res.on('data', chunk => raw += chunk);
    res.on('end', () => {
      const pages = JSON.parse(raw);
      const page = pages.find(p => p.type === 'page' && p.url.includes('michaelzapataag'));
      if (!page) {
        console.log('No page found');
        chrome.kill();
        return;
      }

      console.log('Connecting to debugger for:', page.url);
      const ws = new WebSocket(page.webSocketDebuggerUrl);

      ws.onopen = () => {
        ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
        ws.send(JSON.stringify({ id: 2, method: 'Log.enable' }));
        ws.send(JSON.stringify({ id: 3, method: 'Page.enable' }));
        ws.send(JSON.stringify({ id: 4, method: 'Page.reload' }));
      };

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.method === 'Runtime.exceptionThrown') {
          console.error('EXCEPTION THROWN:', JSON.stringify(msg.params.exceptionDetails, null, 2));
        }
        if (msg.method === 'Runtime.consoleAPICalled') {
          console.log('CONSOLE:', msg.params.type, msg.params.args.map(a => a.value || a.description));
        }
        if (msg.method === 'Log.entryAdded') {
          console.log('LOG:', msg.params.entry);
        }
      };

      setTimeout(() => {
        chrome.kill();
        process.exit(0);
      }, 5000);
    });
  });
}

debug();
