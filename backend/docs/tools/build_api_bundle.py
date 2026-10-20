"""Package the exported OpenAPI for frontend handoff; never sends requests."""
from pathlib import Path
import json
import re
import zipfile
import shutil

docs = Path(__file__).resolve().parents[1]
backend = docs.parent
out = docs / "api"
spec = json.loads((out / "accounting-openapi.json").read_text(encoding="utf-8-sig"))
schemas = spec["components"]["schemas"]
verbs = {"get", "post", "put", "patch", "delete"}


def resolve(schema):
    if "$ref" in schema:
        return schemas[schema["$ref"].split("/")[-1]]
    return schema


def example(schema, name="", depth=0):
    if depth > 5:
        return None
    schema = resolve(schema)
    key = name.lower()
    if schema.get("nullable") and key not in {"nationalid", "postalcode"}:
        return None
    if key == "email":
        return "{{email}}"
    if key == "password":
        return "{{password}}"
    if key == "currency":
        return "IRR"
    if "rowversion" in key:
        return "{{rowVersion}}"
    if key == "nationalid":
        return "12345678901"
    if key == "postalcode":
        return "1234567890"
    if "default" in schema:
        return schema["default"]
    if schema.get("enum"):
        return schema["enum"][0]
    kind = schema.get("type")
    if kind == "object" or "properties" in schema:
        return {k: example(v, k, depth + 1) for k, v in schema.get("properties", {}).items()}
    if kind == "array":
        return [example(schema.get("items", {}), depth=depth + 1)]
    if kind == "boolean":
        return False
    if kind in {"integer", "number"}:
        return 1
    if schema.get("format") == "date-time":
        return "2026-10-14T00:00:00Z"
    if schema.get("format") == "decimal":
        return "1000.00"
    return "نمونه"


def shape(schema):
    if "$ref" in schema:
        return schema["$ref"].split("/")[-1]
    if schema.get("type") == "array":
        return "array<" + shape(schema.get("items", {})) + ">"
    return schema.get("type", "object") + (" / " + schema["format"] if schema.get("format") else "")


folders = {}
reference = ["Accounting API — قرارداد APIهای فعلی پروژه", "تاریخ استخراج: ۱۴۰۵/۰۷/۲۲ (2026-10-14)",
             "Base URL نمونه: https://localhost:7000 — پیشوند /api داخل مسیرهای زیر است.",
             "قرارداد کامل فیلدهای تو در تو و پاسخ‌ها در accounting-openapi.json قرار دارد.",
             "الزام فیلدها و قواعد تجاری تکمیلی در validation-rules.txt آمده است.", ""]
count = 0
for path, operations in sorted(spec["paths"].items()):
    for method, operation in operations.items():
        if method not in verbs:
            continue
        count += 1
        tags = operation.get("tags", ["Other"])
        permissions = operation.get("x-permissions", [])
        anonymous = operation.get("security") == []
        lines = [f"{method.upper()} {path}", "  Auth: " + ("Anonymous" if anonymous else "Bearer accessToken"),
                 "  Permissions: " + (", ".join(permissions) or "—")]
        parameters = operation.get("parameters", [])
        for parameter in parameters:
            lines.append(f"  {parameter['in']}: {parameter['name']} ({shape(parameter.get('schema', {}))})" +
                         (" [required]" if parameter.get("required") else " [optional]"))
        body_content = operation.get("requestBody", {}).get("content", {})
        body_schema = next((v["schema"] for k, v in body_content.items() if "json" in k and "schema" in v), None)
        if body_schema:
            lines.append("  Body: " + shape(body_schema))
            for field, schema in resolve(body_schema).get("properties", {}).items():
                lines.append("    " + field + ": " + shape(schema) + (" | null" if schema.get("nullable") else ""))
        for status, response in operation.get("responses", {}).items():
            content = response.get("content", {})
            lines.append("  Response " + status + ": " + ("; ".join(f"{mime} → {shape(value.get('schema', {}))}" for mime, value in content.items()) or "بدون بدنه"))
        reference.extend(lines + [""])
        path_variables = re.findall(r"\{([^}]+)\}", path)
        postman_path = re.sub(r"\{([^}]+)\}", r":\1", path)
        query = [{"key": p["name"], "value": str(example(p.get("schema", {}), p["name"]) or ""), "disabled": not p.get("required", False)}
                 for p in parameters if p["in"] == "query"]
        request = {"method": method.upper(), "header": [],
                   "description": "\n".join(lines) + "\n\nنمونه‌ها ساختگی‌اند؛ شناسه‌ها و rowVersion را با پاسخ واقعی جایگزین کنید.",
                   "url": {"raw": "{{baseUrl}}" + postman_path, "host": ["{{baseUrl}}"], "path": postman_path.strip("/").split("/"),
                           "query": query, "variable": [{"key": v, "value": "1"} for v in path_variables]}}
        if anonymous:
            request["auth"] = {"type": "noauth"}
        if body_schema:
            request["header"].append({"key": "Content-Type", "value": "application/json"})
            request["body"] = {"mode": "raw", "raw": json.dumps(example(body_schema), ensure_ascii=False, indent=2),
                               "options": {"raw": {"language": "json"}}}
        entry = {"name": f"{method.upper()} {path}", "request": request, "response": []}
        if path.lower() == "/api/auth/login":
            entry["event"] = [{"listen": "test", "script": {"type": "text/javascript", "exec": [
                "if (pm.response.code === 200) {",
                "  const data = pm.response.json();",
                "  if (data.accessToken) pm.collectionVariables.set('accessToken', data.accessToken);",
                "}"]}}]
        folders.setdefault(tags[0], []).append(entry)

collection = {"info": {"name": "Accounting API — Frontend handoff", "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
                       "description": f"{count} API operations extracted from current backend. Examples are placeholders, not live records."},
              "auth": {"type": "bearer", "bearer": [{"key": "token", "value": "{{accessToken}}", "type": "string"}]},
              "variable": [{"key": "baseUrl", "value": "https://localhost:7000"}, {"key": "email", "value": ""},
                           {"key": "password", "value": ""}, {"key": "accessToken", "value": ""}, {"key": "rowVersion", "value": ""}],
              "item": [{"name": name, "item": items} for name, items in sorted(folders.items())]}
(out / "accounting-postman.json").write_text(json.dumps(collection, ensure_ascii=False, indent=2), encoding="utf-8")
(out / "API_REFERENCE.txt").write_text("\n".join(reference), encoding="utf-8")
validation = []
for file in sorted((backend / "Accounting.Application").rglob("*Validator.cs")):
    if "obj" in file.parts or "bin" in file.parts:
        continue
    validation.append("\n" + "=" * 80 + "\n" + str(file.relative_to(backend)) + "\n" + file.read_text(encoding="utf-8-sig", errors="replace"))
(out / "validation-rules.txt").write_text("قواعد اعتبارسنجی واقعی بک‌اند؛ برای الزام فیلدها و بازه‌ها از این فایل استفاده کنید.\n" + "\n".join(validation), encoding="utf-8")
for name in ["InvoicePrintIdentity.sql", "NormalizeItemUnits.sql", "INVOICE_PRINT.md", "UNITS_API.md", "INVOICE_TEMPLATE_HANDOFF.txt"]:
    shutil.copyfile(docs / name, out / name)
with zipfile.ZipFile(docs / "accounting-frontend-api.zip", "w", compression=zipfile.ZIP_DEFLATED) as archive:
    for file in sorted(out.iterdir()):
        if file.is_file():
            archive.write(file, file.name)
print(f"Packaged {count} operations in {docs / 'accounting-frontend-api.zip'}")
