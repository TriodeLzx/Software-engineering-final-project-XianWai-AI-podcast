from flask import Flask, render_template
import os

app = Flask(__name__)
app.config['SECRET_KEY'] = 'test-secret-key'

# app/routes/main.py
@app.route('/')
def index():
    return render_template("index.html")


if __name__ == '__main__':
    app.run()