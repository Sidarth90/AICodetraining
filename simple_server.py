#!/usr/bin/env python3
from flask import Flask

app = Flask(__name__)

@app.route('/')
def hello():
    return '''
    <h1>🚗 Car Rental Server is Working!</h1>
    <p>If you can see this, the server is running correctly.</p>
    <p><a href="/demo.html">Click here to see the demo UI</a></p>
    <style>
        body { font-family: Arial; text-align: center; margin-top: 100px; }
        h1 { color: #333; }
    </style>
    '''

if __name__ == '__main__':
    print("🚗 Starting simple test server...")
    print("🌐 Open http://localhost:5000 in your browser")
    app.run(debug=True, host='0.0.0.0', port=5000)