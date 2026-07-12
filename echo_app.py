from flask import Flask, request, render_template_string
from markupsafe import Markup

app = Flask(__name__)

TEMPLATE = """
<!doctype html>
<html>
  <head><meta charset="utf-8"><title>Echo</title></head>
  <body>
    <h1>Echo Page (vulnerable)</h1>
    <p>q = {{ q }}</p>
  </body>
</html>
"""

@app.route("/vulnerable", methods=["GET"])
def vulnerable():
    q = request.args.get("q", "")
    return render_template_string(TEMPLATE, q=Markup(q))  # unescaped, intentional

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=3001, debug=True)