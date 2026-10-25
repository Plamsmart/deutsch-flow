"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";

export default function SignOutButton() {
  const router = useRouter();
  const t = useTranslations("student");
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/mi-cuenta/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={isSigningOut}
      className="rounded-[10px] border border-[rgba(0,84,97,0.18)] px-4 py-2 text-[0.85rem] font-medium text-[#005461] transition-colors duration-200 hover:bg-[rgba(0,84,97,0.06)] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isSigningOut ? t("signingOutText") : t("signOutButton")}
    </button>
  );
}
