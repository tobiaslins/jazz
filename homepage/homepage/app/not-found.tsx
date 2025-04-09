import Link from 'next/link'
import { Icon404 } from 'gcmp-design-system/src/app/components/atoms/icons/404'
 
export default function NotFound() {
  const text = "Don't Worry 'Bout Me";

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <Icon404 className="w-75" />
      <h1 className="text-3xl font-semibold m-7">{text}</h1>
      <p className="m-3">Page not found.</p>
    </div>
  )
}