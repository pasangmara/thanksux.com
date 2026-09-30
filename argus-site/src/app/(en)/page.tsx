import Home from "@/components/home";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata("en");

export default function Page() {
  return <Home lang="en" />;
}
