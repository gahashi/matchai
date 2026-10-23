import test from "node:test";
import assert from "node:assert/strict";
import { safeFolder, validateMedia, fileExtension } from "../src/storage/upload-rules.js";
import { escapeHtml } from "../src/email/email-template.js";

test("caminho S3 não aceita travessia de diretórios", () => {
  assert.throws(() => safeFolder("../admin"));
  assert.throws(() => safeFolder("public/../../privado"));
  assert.equal(safeFolder("matchai/avatar"), "matchai/avatar");
});
test("SVG não é permitido", () => assert.throws(() => validateMedia("image/svg+xml", 1024)));
test("validação de limites", () => {
  assert.throws(() => validateMedia("image/png", 0));
  assert.throws(() => validateMedia("image/png", 10 * 1024 * 1024 + 1));
  assert.doesNotThrow(() => validateMedia("image/png", 500));
});
test("extensão correta", () => assert.equal(fileExtension("image/webp"), "webp"));
test("texto HTML de email é escapado", () => {
  assert.equal(escapeHtml("<script>"), "&lt;script&gt;");
});
