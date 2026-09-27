import { describe, expect, it } from "vitest";
import { CATEGORY_ICON_KEYS } from "@/lib/category-icon-keys";
import { getCategoryIcon, getIconByKey, guessCategoryIconKey } from "@/lib/category-icons";
import { categoryFormSchema } from "@/lib/validation/admin-categories";

describe("category icons", () => {
  it("guesses a sensible icon from the name when the admin leaves it on Auto", () => {
    expect(guessCategoryIconKey("uniforms")).toBe("uniform");
    expect(guessCategoryIconKey("School Uniforms")).toBe("uniform");
    expect(guessCategoryIconKey("shirts")).toBe("shirt");
    expect(guessCategoryIconKey("jeans")).toBe("trousers");
    expect(guessCategoryIconKey("kurtis")).toBe("kurta");
    expect(guessCategoryIconKey("socks")).toBe("socks");
    expect(guessCategoryIconKey("school-bags")).toBe("bag");
    expect(guessCategoryIconKey("something new")).toBe("handbag");
  });

  it("Uniforms and Shirts no longer share an icon", () => {
    expect(getCategoryIcon("uniforms")).not.toBe(getCategoryIcon("shirts"));
  });

  it("uses the icon the admin chose, and ignores an unknown saved value", () => {
    expect(getCategoryIcon("shirts", "gift")).toBe(getIconByKey("gift"));
    expect(getCategoryIcon("shirts", "not-an-icon")).toBe(getIconByKey("shirt"));
    expect(getCategoryIcon("shirts", null)).toBe(getIconByKey("shirt"));
  });

  it("has a drawing for every icon the admin can pick", () => {
    for (const key of CATEGORY_ICON_KEYS) expect(getIconByKey(key)).toBeTruthy();
  });

  it("the category form accepts a listed icon or Auto (null), and rejects anything else", () => {
    const base = { name: "Kurtis", slug: "kurtis" };
    expect(categoryFormSchema.safeParse({ ...base, icon: "kurta" }).success).toBe(true);
    expect(categoryFormSchema.safeParse({ ...base, icon: null }).success).toBe(true);
    expect(categoryFormSchema.safeParse(base).success).toBe(true);
    expect(categoryFormSchema.safeParse({ ...base, icon: "rocket" }).success).toBe(false);
  });
});
