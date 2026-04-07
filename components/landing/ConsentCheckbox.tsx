"use client";

interface ConsentCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: boolean;
  dark?: boolean;
}

export function ConsentCheckbox({ checked, onChange, error, dark = false }: ConsentCheckboxProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="flex items-start gap-3 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 w-4 h-4 flex-shrink-0 cursor-pointer rounded"
          style={{ accentColor: "#C9964A" }}
        />
        <span
          className="text-xs leading-relaxed"
          style={{ color: "#9E9990" }}
        >
          אני מאשר/ת קבלת עדכונים, מבצעים ותוכן שיווקי מהדר דנן בע״מ באמצעות אימייל, SMS ווואטסאפ. ניתן לבטל בכל עת.
        </span>
      </label>
      {error && (
        <p className="text-xs text-red-400 pr-7">יש לאשר קבלת עדכונים כדי להמשיך</p>
      )}
    </div>
  );
}
