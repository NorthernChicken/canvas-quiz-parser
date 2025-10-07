# Canvas quiz HTML parser

This small script parses a Canvas quiz HTML export (example: `input.htm`) and produces a human-readable `output.txt` listing each question, choices, and which choices are marked correct in the HTML.

Requirements
- Python 3.8+
- BeautifulSoup4 (bs4)

Install dependency (PowerShell):

```powershell
python -m pip install --user beautifulsoup4
```

Usage (PowerShell):

```powershell
# from the folder that contains input.htm
python parse_canvas_quiz.py input.htm
```

The script will write `output.txt` next to `input.htm`.

Notes
- The script looks for Canvas-specific HTML patterns (question containers, `.answer`, `.quiz_comment` with text "Correct"). It should work on the provided `input.htm`. If your exported HTML uses different class names, the script may need small adjustments.