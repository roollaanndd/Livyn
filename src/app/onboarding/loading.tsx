export default function OnboardingLoading() {
  // Matches the flow's own background so a dark-theme user never sees a flash
  // of the old hard-coded light gradient.
  return <div className="fixed inset-0 bg-background" />;
}
