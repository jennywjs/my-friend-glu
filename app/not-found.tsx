import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Not Found</h2>
        <p className="text-gray-600 mb-4">Could not find requested resource</p>
        <Link
          href="/"
          className="inline-flex items-center px-4 py-2 bg-pink-500 text-white rounded-md hover:bg-pink-600 transition-colors"
        >
          Return Home
        </Link>
      </div>
    </div>
  )
}
