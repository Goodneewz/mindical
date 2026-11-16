import { AuthGate } from "@/components/auth-gate";
import { ProfileGate } from "@/components/profile-gate";

export default function HomePage() {
  return (
    <AuthGate>
      <ProfileGate />
    </AuthGate>
  );
}
