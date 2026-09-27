"use client";

import { Wand2 } from "lucide-react";
import { CATEGORY_ICONS, type CategoryIconKey } from "@/lib/category-icon-keys";
import { getCategoryIcon, getIconByKey } from "@/lib/category-icons";
import { cn } from "@/lib/utils";

/**
 * Pick the icon a category shows on the website (category tiles, the
 * menu, and product pictures until a photo is added). "Auto" guesses one
 * from the category's name.
 */
export function CategoryIconPicker({
  value,
  onChange,
  categoryName,
  idPrefix,
}: {
  value: CategoryIconKey | null;
  onChange: (value: CategoryIconKey | null) => void;
  categoryName: string;
  idPrefix: string;
}) {
  const AutoIcon = getCategoryIcon(categoryName || "category");

  return (
    <fieldset aria-labelledby={`${idPrefix}-icon-label`} className="flex flex-col gap-1.5">
      <legend id={`${idPrefix}-icon-label`} className="text-xs font-medium">
        Icon on the website:{" "}
        <span className="text-muted-foreground">
          {value ? CATEGORY_ICONS.find((icon) => icon.key === value)?.label : "Auto (from the name)"}
        </span>
      </legend>
      <div className="flex flex-wrap gap-1.5">
        <IconChoice selected={value === null} onClick={() => onChange(null)} label="Auto (from the name)">
          {/* A fixed, module-level lucide icon picked by name, never a component defined during render. */}
          {/* eslint-disable-next-line react-hooks/static-components */}
          <AutoIcon className="size-4" aria-hidden />
          <Wand2 className="absolute -right-1 -top-1 size-3 rounded-full bg-card text-muted-foreground" aria-hidden />
        </IconChoice>
        {CATEGORY_ICONS.map(({ key, label }) => {
          const Icon = getIconByKey(key);
          return (
            <IconChoice key={key} selected={value === key} onClick={() => onChange(key)} label={label}>
              <Icon className="size-4" aria-hidden />
            </IconChoice>
          );
        })}
      </div>
    </fieldset>
  );
}

function IconChoice({
  selected,
  onClick,
  label,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      aria-label={label}
      title={label}
      className={cn(
        "relative flex size-9 items-center justify-center rounded-lg border transition-colors",
        selected ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}
