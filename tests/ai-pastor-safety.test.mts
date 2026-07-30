import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { checkSafety, sensitiveTopicReminder } from "@/lib/ai-pastor/safety";
import { buildSystemPrompt } from "@/lib/ai-pastor/guidelines";

describe("checkSafety", () => {
  it("does not treat a person in crisis as a violence problem", () => {
    // The violence pattern's alternation was ungrouped, so one arm reduced to
    // /bunuh/ and matched "bunuh diri" — flagging exactly the messages that need
    // the crisis path most.
    for (const message of [
      "saya ingin bunuh diri",
      "kadang aku kepikiran mau bunuh diri",
      "aku capek, rasanya mau mengakhiri hidup",
    ]) {
      assert.equal(checkSafety(message).safe, true, message);
    }
  });

  it("still flags violence directed at other people", () => {
    assert.equal(checkSafety("aku ingin bunuh orang itu").safe, false);
    assert.equal(checkSafety("bakar mereka semua").safe, false);
  });

  it("flags the other sensitive topics", () => {
    assert.equal(checkSafety("dia pasti masuk neraka kan?").safe, false);
    assert.equal(checkSafety("coblos nomor 3 ya").safe, false);
    assert.equal(checkSafety("kasih resep obat buat demam").safe, false);
  });

  it("passes an ordinary pastoral question through", () => {
    for (const message of [
      "bagaimana cara berdoa yang benar?",
      "aku sedang cemas soal pekerjaan",
      "apa arti kasih karunia?",
    ]) {
      assert.equal(checkSafety(message).safe, true, message);
    }
  });

  it("gives the same answer when called twice", () => {
    // The patterns carry the /g flag, so a stale lastIndex would make repeat
    // calls disagree.
    const message = "dia pasti masuk neraka";
    assert.equal(checkSafety(message).safe, checkSafety(message).safe);
  });

  it("softens a directive about changing church", () => {
    const result = checkSafety("kamu harus pindah gereja Anglikan");
    assert.ok(result.filtered);
    assert.ok(!result.filtered!.includes("harus pindah gereja"));
  });
});

describe("system prompt", () => {
  it("carries the sensitive-topic reminder when one is supplied", () => {
    // The route computed this flag and discarded it, so the safety module had no
    // effect on the reply at all.
    const prompt = buildSystemPrompt("general", "", "", "nasihat medis");
    assert.ok(prompt.includes("PERHATIAN KHUSUS TURN INI"));
    assert.ok(prompt.includes("nasihat medis"));
  });

  it("omits the reminder when nothing was flagged", () => {
    assert.ok(!buildSystemPrompt("general", "", "").includes("PERHATIAN KHUSUS TURN INI"));
  });

  it("prefers crisis resources over the reminder", () => {
    const prompt = buildSystemPrompt("crisis", "", "", "mengandung kekerasan");
    assert.ok(prompt.includes("119"), "crisis hotline missing");
    assert.ok(!prompt.includes("PERHATIAN KHUSUS TURN INI"));
  });

  it("stays within Latin-1 so it cannot break an HTTP header", () => {
    const prompt = buildSystemPrompt("doctrine_question", "konteks", "ayat", "politik praktis");
    assert.equal(/[^\x00-\x7F]/.test(prompt), false);
  });

  it("names the reason it was given", () => {
    assert.ok(sensitiveTopicReminder("politik praktis").includes("politik praktis"));
  });
});
