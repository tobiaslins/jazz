import Link from "next/link";

export default function DocsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Components</h1>
      <ul>
        <li>
          <Link href="/docs/button">Button</Link>
        </li>
      </ul>
    </div>
  );
}
