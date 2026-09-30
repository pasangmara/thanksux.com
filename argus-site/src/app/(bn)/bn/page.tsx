import Home from "@/components/home";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata("bn");

export default function Page() {
  return <Home lang="bn" />;
}
