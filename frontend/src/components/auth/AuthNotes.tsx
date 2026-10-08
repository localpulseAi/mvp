import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { PRIVACY_POLICY_URL, SUPPORT_EMAIL } from "./authConfig";

const linkClass =
  "font-semibold text-brand-600 underline-offset-2 hover:text-brand-700 hover:underline";

interface PrototypeNoteProps {
  privacyPolicyUrl?: string | null;
}

/** Accurate prototype note. Links a privacy policy only when one is published. */
export function PrototypeNote({ privacyPolicyUrl = PRIVACY_POLICY_URL }: PrototypeNoteProps) {
  return (
    <div className="mt-7 flex gap-3 rounded-control bg-lilac/70 p-4">
      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
      <p className="text-xs leading-5 text-gray-600">
        {privacyPolicyUrl && (
          <>
            Read how your information is handled in our{" "}
            <a href={privacyPolicyUrl} className={linkClass}>
              Privacy Policy
            </a>
            .{" "}
          </>
        )}
        This is an Agenzy prototype. Pilot access and launch timing are still being validated.
      </p>
    </div>
  );
}

/** Help links kept visible in every sign-in state. */
export function AuthHelp() {
  return (
    <div className="mt-6 space-y-1.5 text-center text-sm text-gray-500">
      <p>
        Want to look around first?{" "}
        <Link href="/dashboard" className={linkClass}>
          Explore the demo
        </Link>
      </p>
      <p>
        Trouble signing in?{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`} className={linkClass}>
          {SUPPORT_EMAIL}
        </a>
      </p>
    </div>
  );
}

export const authCardClass = "rounded-[20px] border border-brand-200/60 bg-white p-6 shadow-soft sm:p-9";
