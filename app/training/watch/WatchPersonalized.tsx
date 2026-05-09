"use client";

import { useEffect, useState } from "react";
import { getSessionUser } from "@/lib/quiz-session";

// ── Greeting inserted above h1 ────────────────────────────────
export function WatchGreeting() {
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    const user = getSessionUser();
    if (user?.name) {
      setName(user.name.split(" ")[0]);
    }
  }, []);

  if (!name) return null;

  return (
    <p
      style={{
        fontSize: "1.1rem",
        fontWeight: 700,
        color: "#C9964A",
        marginBottom: 4,
      }}
    >
      {name}, הנה השיעור שלך
    </p>
  );
}

// ── Next-step section below video ─────────────────────────────
export function WatchNextStep() {
  const [knownUser, setKnownUser] = useState<boolean | null>(null);

  useEffect(() => {
    const user = getSessionUser();
    setKnownUser(user !== null);
  }, []);

  // Don't flash anything while checking localStorage
  if (knownUser === null) return null;

  // Known user → show challenge card
  if (knownUser) {
    return (
      <section
        style={{
          background: "#141820",
          borderTop: "1px solid #2C323E",
          borderBottom: "1px solid #2C323E",
          padding: "40px 24px",
        }}
        dir="rtl"
      >
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          {/* Label */}
          <p
            style={{
              fontSize: "0.75rem",
              fontWeight: 700,
              letterSpacing: "0.1em",
              color: "#C9964A",
              textTransform: "uppercase",
              marginBottom: 16,
              textAlign: "center",
            }}
          >
            הצעד הבא שלך
          </p>

          {/* Netflix-style challenge card */}
          <a
            href="/challenge"
            style={{
              display: "block",
              borderRadius: 16,
              overflow: "hidden",
              position: "relative",
              textDecoration: "none",
              border: "1px solid rgba(201,150,74,0.25)",
              boxShadow: "0 4px 32px rgba(0,0,0,0.5)",
            }}
          >
            {/* Image */}
            <div style={{ position: "relative", height: 220 }}>
              <img
                src="/etgar.png"
                alt="אתגר 7 הימים"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
              {/* Gradient overlay */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(to top, rgba(10,14,24,1) 0%, rgba(10,14,24,0.6) 50%, transparent 100%)",
                }}
              />
              {/* Match badge */}
              <div
                style={{
                  position: "absolute",
                  top: 12,
                  right: 12,
                  background: "linear-gradient(135deg,#E8B94A,#C9964A)",
                  color: "#101520",
                  fontSize: "0.7rem",
                  fontWeight: 800,
                  padding: "4px 10px",
                  borderRadius: 9999,
                }}
              >
                הצעד הבא
              </div>
              {/* Price badge */}
              <div
                style={{
                  position: "absolute",
                  top: 12,
                  left: 12,
                  background: "rgba(16,21,32,0.85)",
                  color: "#EDE9E1",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  padding: "4px 10px",
                  borderRadius: 9999,
                  border: "1px solid rgba(201,150,74,0.2)",
                }}
              >
                ₪197
              </div>
            </div>

            {/* Text body */}
            <div
              style={{
                background: "linear-gradient(145deg,#1D2430,#111620)",
                padding: "20px 24px 24px",
              }}
            >
              <h3
                style={{
                  fontSize: "1.35rem",
                  fontWeight: 800,
                  color: "#EDE9E1",
                  marginBottom: 6,
                }}
              >
                אתגר 7 הימים
              </h3>
              <p
                style={{
                  fontSize: "0.9rem",
                  color: "#9E9990",
                  marginBottom: 16,
                  lineHeight: 1.6,
                }}
              >
                7 ימים, 7 סרטונים - מהחסם הראשון ועד תוכן שמביא לקוחות אמיתיים.
              </p>

              {/* Bullets */}
              <ul
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  marginBottom: 20,
                }}
              >
                {[
                  "שובר את חסם המצלמה במהירות",
                  "פידבק אישי מהדר על הסרטונים שלך",
                  "קבוצת וואצאפ חיה - תמיכה מלאה",
                ].map((b) => (
                  <li
                    key={b}
                    style={{
                      display: "flex",
                      gap: 8,
                      alignItems: "flex-start",
                      fontSize: "0.85rem",
                      color: "#9E9990",
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: "#C9964A",
                        marginTop: 6,
                        flexShrink: 0,
                      }}
                    />
                    {b}
                  </li>
                ))}
              </ul>

              {/* CTA button */}
              <div
                style={{
                  width: "100%",
                  borderRadius: 9999,
                  padding: "14px 0",
                  background: "linear-gradient(135deg,#E8B94A,#C9964A,#9E7C3A)",
                  color: "#101520",
                  fontWeight: 800,
                  fontSize: "1rem",
                  textAlign: "center",
                }}
              >
                להצטרף לאתגר 7 הימים ←
              </div>
            </div>
          </a>
        </div>
      </section>
    );
  }

  // Unknown user → keep quiz CTA
  return (
    <section
      style={{
        background: "#141820",
        borderTop: "1px solid #2C323E",
        borderBottom: "1px solid #2C323E",
        padding: "32px 24px",
        textAlign: "center",
      }}
    >
      <p style={{ color: "#EDE9E1", fontWeight: 700, fontSize: "1.1rem", marginBottom: 8 }}>
        צפית? הצעד הבא שלך:
      </p>
      <p style={{ color: "#9E9990", fontSize: "0.9rem", marginBottom: 20 }}>
        כשהאות שלך ברור - הלקוחות הנכונים מגיעים מאליהם
      </p>
      <a
        href="/quiz"
        style={{
          display: "inline-block",
          background: "linear-gradient(135deg,#E8B94A,#C9964A,#9E7C3A)",
          color: "#1A1206",
          fontWeight: 800,
          fontSize: "1rem",
          borderRadius: 9999,
          padding: "14px 36px",
          textDecoration: "none",
        }}
      >
        גלה את הצעד הנכון עבורך ←
      </a>
    </section>
  );
}
