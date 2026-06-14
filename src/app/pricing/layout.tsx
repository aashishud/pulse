import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing | Pulse",
  description: "Simple, transparent pricing for gamers.",
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
