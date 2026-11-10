import { describe, expect, it } from "vitest";
import { roadmapCategories, roadmapTools, tools, toolCounts, toolCategoryCounts, implementedTools } from "./toolRegistry";

describe("central tool registry", () => {
  it("keeps implemented tools, coming-soon tools and roadmap entries distinct", () => {
    expect(toolCounts.implemented).toBe(22);
    expect(toolCounts.roadmap).toBe(3000);
    expect(toolCounts.planned).toBe(3002);
    expect(toolCounts.total).toBe(3024);
    expect(implementedTools.every(tool => tool.status === "implemented" && !tool.comingSoon)).toBe(true);
    expect(tools.filter(tool => tool.status === "planned").every(tool => tool.comingSoon)).toBe(true);
  });

  it("contains 30 roadmap categories with exactly 100 planned entries each", () => {
    expect(roadmapCategories).toHaveLength(30);
    for (const category of roadmapCategories) {
      expect(category.actions).toHaveLength(10);
      expect(category.subjects).toHaveLength(10);
      expect(roadmapTools.filter(tool => tool.category === category.key)).toHaveLength(100);
      expect(toolCategoryCounts[category.key]).toBeGreaterThanOrEqual(100);
    }
  });

  it("assigns every tool to a known category and gives it a unique id", () => {
    const categoryKeys = new Set(roadmapCategories.map(category => category.key));
    const ids = tools.map(tool => tool.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(tools.every(tool => categoryKeys.has(tool.category))).toBe(true);
  });

  it("keeps all seven implemented PDF workflows grouped under PDF Tools", () => {
    expect(toolCategoryCounts.pdf).toBe(107);
    expect(implementedTools.filter(tool => tool.category === "pdf")).toHaveLength(7);
  });
});
