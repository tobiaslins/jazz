import { NewsletterForm } from "@/components/organisms/NewsletterForm";

export function Forms() {
  return (
    <div>
      <h2 id="forms" className="text-xl mt-5 mb-2 font-bold">
        Forms
      </h2>

      <div className="p-3">
        <NewsletterForm />
      </div>
    </div>
  );
}
