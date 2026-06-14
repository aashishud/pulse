import { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ | Pulse",
  description: "Frequently Asked Questions about Pulse.",
};

export default function FAQLayout({ children }: { children: React.ReactNode }) {
  return children;
}
