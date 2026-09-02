#!/usr/bin/env python3
"""Converte DOCUMENTACAO.md em PDF com suporte a diagramas Mermaid."""

import base64
import re
import sys
from pathlib import Path

import markdown
import requests
from xhtml2pdf import pisa

ROOT = Path(__file__).resolve().parents[1]
MD_FILE = ROOT / "DOCUMENTACAO.md"
PDF_FILE = ROOT / "DOCUMENTACAO.pdf"

CSS = """
@page {
    size: A4;
    margin: 2cm;
}
body {
    font-family: Helvetica, Arial, sans-serif;
    font-size: 10pt;
    line-height: 1.45;
    color: #1a1a1a;
}
h1 {
    font-size: 20pt;
    color: #166534;
    border-bottom: 2px solid #166534;
    padding-bottom: 6px;
    margin-top: 24px;
}
h2 {
    font-size: 14pt;
    color: #166534;
    margin-top: 20px;
    border-bottom: 1px solid #d1d5db;
    padding-bottom: 4px;
}
h3 {
    font-size: 12pt;
    color: #374151;
    margin-top: 16px;
}
h4 {
    font-size: 11pt;
    color: #4b5563;
    margin-top: 12px;
}
p, li {
    margin: 6px 0;
}
table {
    width: 100%;
    border-collapse: collapse;
    margin: 12px 0;
    font-size: 9pt;
}
th, td {
    border: 1px solid #d1d5db;
    padding: 6px 8px;
    text-align: left;
}
th {
    background-color: #f0fdf4;
    font-weight: bold;
}
tr:nth-child(even) td {
    background-color: #f9fafb;
}
code {
    font-family: Consolas, monospace;
    font-size: 8.5pt;
    background: #f3f4f6;
    padding: 1px 4px;
}
pre {
    background: #f3f4f6;
    border: 1px solid #e5e7eb;
    padding: 10px;
    font-size: 8pt;
    white-space: pre-wrap;
    word-wrap: break-word;
}
pre code {
    background: none;
    padding: 0;
}
hr {
    border: none;
    border-top: 1px solid #e5e7eb;
    margin: 20px 0;
}
img {
    max-width: 100%;
    margin: 12px auto;
    display: block;
}
.diagram-caption {
    text-align: center;
    font-size: 8.5pt;
    color: #6b7280;
    margin-bottom: 16px;
}
"""


def mermaid_to_image_tag(code: str, index: int) -> str:
    encoded = base64.urlsafe_b64encode(code.strip().encode("utf-8")).decode("ascii")
    url = f"https://mermaid.ink/img/{encoded}?type=png&bgColor=white"
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        img_b64 = base64.b64encode(response.content).decode("ascii")
        return (
            f'<img src="data:image/png;base64,{img_b64}" alt="Diagrama {index}" />'
            f'<p class="diagram-caption">Diagrama {index}</p>'
        )
    except Exception as exc:
        return (
            f'<pre><code>{code.strip()}</code></pre>'
            f'<p class="diagram-caption">Diagrama {index} (renderização indisponível: {exc})</p>'
        )


def preprocess_mermaid(content: str) -> str:
    pattern = re.compile(r"```mermaid\n(.*?)```", re.DOTALL)
    index = 1

    def replace(match: re.Match[str]) -> str:
        nonlocal index
        html = mermaid_to_image_tag(match.group(1), index)
        index += 1
        return html

    return pattern.sub(replace, content)


def markdown_to_html(md_content: str) -> str:
    processed = preprocess_mermaid(md_content)
    html_body = markdown.markdown(
        processed,
        extensions=["tables", "fenced_code", "nl2br", "sane_lists"],
    )
    return f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8" />
    <title>SportArena - Documentação</title>
    <style>{CSS}</style>
</head>
<body>
{html_body}
</body>
</html>"""


def html_to_pdf(html: str, output: Path) -> None:
    with output.open("wb") as pdf_file:
        status = pisa.CreatePDF(html, dest=pdf_file, encoding="utf-8")
    if status.err:
        raise RuntimeError(f"Falha ao gerar PDF (erros: {status.err})")


def main() -> int:
    if not MD_FILE.exists():
        print(f"Arquivo não encontrado: {MD_FILE}", file=sys.stderr)
        return 1

    print(f"Lendo {MD_FILE}...")
    md_content = MD_FILE.read_text(encoding="utf-8")

    print("Convertendo Markdown para HTML...")
    html = markdown_to_html(md_content)

    print(f"Gerando {PDF_FILE}...")
    html_to_pdf(html, PDF_FILE)

    size_kb = PDF_FILE.stat().st_size / 1024
    print(f"PDF gerado com sucesso: {PDF_FILE} ({size_kb:.1f} KB)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
