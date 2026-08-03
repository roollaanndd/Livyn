import { LeafLoader } from "@/components/ui/loading";

export default function ContributorLoading() {
  return (
    <div className="flex min-h-[60dvh] items-center justify-center">
      <LeafLoader size="lg" />
    </div>
  );
}
