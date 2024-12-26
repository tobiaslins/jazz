import { Card } from "gcmp-design-system/src/app/components/atoms/Card";
import { H2 } from "gcmp-design-system/src/app/components/atoms/Headings";
import { NewsletterForm } from "gcmp-design-system/src/app/components/organisms/NewsletterForm";
import Link from "next/link";

export function NewsletterCard() {
  return (
    <Card className="p-4 md:py-16">
      <div className="lg:max-w-3xl md:text-center mx-auto space-y-6">
        <p className="uppercase text-blue tracking-widest text-sm font-medium dark:text-stone-400">
          Stay up to date
        </p>
        <H2>Subscribe to our newsletter</H2>
        <div className="flex justify-center">
          <NewsletterForm />
        </div>

        <p>
          Follow <Link href="https://x.com/gardendotco">@gardendotco</Link> and{" "}
          <Link href="https://x.com/jazz_tools">@jazz_tools</Link>.
        </p>

        <p>
          And if you want to build something with Jazz, you should definitely{" "}
          <Link href="https://discord.gg/utDMjHYg42">
            join the Jazz Discord
          </Link>
          !
        </p>
      </div>
    </Card>
  );
}
