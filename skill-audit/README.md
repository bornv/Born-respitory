# Gecontroleerde AI Templates-profielen

Acht profielen met bronbestanden, veiligheidsrapport en hashes. Lees [RAPPORT.md](RAPPORT.md) vóór gebruik. Geen garantie dat uitvoering veilig is; de npm-installer en afhankelijkheden zijn niet geaudit.

Bron: https://github.com/davila7/claude-code-templates/tree/e4c13da559c5f0660524aeeb2563d7e5052d6af3/cli-tool/components

De ongewijzigde tekstbestanden en hun licenties staan in `original/`. Het PNG-icoon is verliesloos opgeslagen als `spreadsheet.png.base64`, omdat de uploadtool alleen tekst ondersteunt. Herstel lokaal met Python: `import base64; from pathlib import Path; p=Path("original/skills/document-processing/spreadsheet/assets/spreadsheet.png.base64"); p.with_suffix("").write_bytes(base64.b64decode(p.read_bytes()))`. De manifest-hash geldt voor de herstelde PNG.

Deze map installeert of activeert geen skills automatisch.
