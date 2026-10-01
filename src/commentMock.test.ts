import { describe, it, expect } from "vitest";
import { commentsFor } from "./commentMock";

describe("commentsFor (mock determinístico, docs/12)", () => {
  it("mesmo reviewId → mesma thread", () => {
    expect(commentsFor("mock-1")).toEqual(commentsFor("mock-1"));
  });

  it("2 a 4 comentários, com campos preenchidos", () => {
    const list = commentsFor("mock-1");
    expect(list.length).toBeGreaterThanOrEqual(2);
    expect(list.length).toBeLessThanOrEqual(4);
    for (const c of list) {
      expect(c.id).toBeTruthy();
      expect(c.userId).toBeTruthy();
      expect(c.text.length).toBeGreaterThan(0);
      expect(Number.isNaN(Date.parse(c.createdAt))).toBe(false);
    }
  });

  it("ids únicos dentro da thread", () => {
    const ids = commentsFor("mock-1").map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("ordem cronológica: mais antigo primeiro", () => {
    const list = commentsFor("mock-3");
    const times = list.map((c) => Date.parse(c.createdAt));
    expect([...times].sort((a, b) => a - b)).toEqual(times);
  });
});
