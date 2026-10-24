# -*- coding: utf-8 -*-
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
import sys
import os

class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        # Disable cache for development so CSS/JS updates are instantly reflected
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def guess_type(self, path):
        mime = super().guess_type(path)
        if path.endswith('.css'):
            return 'text/css; charset=utf-8'
        if path.endswith('.js'):
            return 'application/javascript; charset=utf-8'
        if path.endswith('.html'):
            return 'text/html; charset=utf-8'
        return mime

if __name__ == '__main__':
    port = 8089
    web_dir = os.path.join(os.path.dirname(__file__))
    os.chdir(web_dir)
    server = ThreadingHTTPServer(('0.0.0.0', port), NoCacheHandler)
    print(f"Serving {web_dir} on port {port} (threaded, no-cache)...")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
