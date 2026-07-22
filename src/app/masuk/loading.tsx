import { LeafLoader } from "@/components/ui/loading";

export default function LoginLoading() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background">
      <LeafLoader size="md" />
    </div>
  );
}
