/**
 * CreditBanner - shows accumulated credit and discounted price.
 * Pure server component (no client JS needed).
 *
 * dark=true  → for dark-background pages (challenge, course, premium)
 * dark=false → for light-background pages (strategy)
 */

function shekel(n: number) {
  return "₪" + n.toLocaleString("he-IL");
}

interface CreditBannerProps {
  credit: number;
  listPrice: number;
  productName: string;
  dark?: boolean;
}

export function CreditBanner({ credit, listPrice, productName, dark = false }: CreditBannerProps) {
  if (credit <= 0) return null;

  const toPay = Math.max(0, listPrice - credit);

  const containerStyle = dark
    ? { background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.35)" }
    : { background: "linear-gradient(135deg, #f0fdf4, #dcfce7)", border: "1px solid #86efac" };

  const headingColor = dark ? "#4ade80" : "#166534";
  const textColor    = dark ? "#86efac" : "#15803d";
  const strongColor  = dark ? "#bbf7d0" : "#14532d";

  if (toPay === 0) {
    return (
      <div
        className="w-full rounded-2xl px-5 py-4 flex flex-col gap-1.5"
        style={containerStyle}
        dir="rtl"
      >
        <p className="font-black text-lg" style={{ color: headingColor }}>
          ✅ הזיכוי שלך מכסה את {productName} במלואו!
        </p>
        <p className="text-sm leading-snug" style={{ color: textColor }}>
          שילמת <strong style={{ color: strongColor }}>{shekel(credit)}</strong> בעבר -
          הגישה ניתנת ללא תשלום נוסף. לחץ על הכפתור למטה 👇
        </p>
      </div>
    );
  }

  return (
    <div
      className="w-full rounded-2xl px-5 py-4 flex flex-col gap-1.5"
      style={containerStyle}
      dir="rtl"
    >
      <p className="font-black text-lg" style={{ color: headingColor }}>
        🎉 יש לך זיכוי של {shekel(credit)} מרכישות קודמות!
      </p>
      <p className="text-sm leading-snug" style={{ color: textColor }}>
        המחיר שלך:{" "}
        <strong style={{ color: strongColor }}>{shekel(toPay)} בלבד</strong>
        {" "}(במקום {shekel(listPrice)})
      </p>
    </div>
  );
}
