import MovementClient from "./MovementClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "מנוע התנועה | הדר דנן",
  robots: { index: false, follow: false },
};

export default function MovementPage() {
  return <MovementClient />;
}
