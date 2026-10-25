import { Mail } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { IconTile, Note } from "@/design-system";
import { pendingSignUp } from "../pending-sign-up-cookie";
import { BackToSignIn } from "./back-to-sign-in";
import { ResendEmail } from "./resend-email";

// Without the cookie (expired, or the page opened directly) there is no address to show.
export async function CheckYourInbox() {
  const pending = await pendingSignUp();
  if (!pending) redirect("/sign-in");
  const t = await getTranslations("Auth.checkInbox");

  return (
    <div className="flex flex-1 flex-col gap-6 pt-6 lg:pt-0">
      <BackToSignIn />
      <div className="flex flex-col gap-4">
        <IconTile icon={Mail} />
        <h1 className="text-heading text-text">{t("title")}</h1>
        <p className="text-body text-text-secondary">
          {t.rich("sent", {
            email: pending.email,
            strong: (chunks) => <strong className="font-semibold text-text">{chunks}</strong>,
          })}
        </p>
      </div>
      <Note>{t("note")}</Note>
      <ResendEmail />
      <p className="text-center text-small text-text-secondary">
        {t.rich("wrongAddress", {
          link: (chunks) => (
            <Link href="/sign-up" className="font-semibold text-brand underline underline-offset-4">
              {chunks}
            </Link>
          ),
        })}
      </p>
    </div>
  );
}
