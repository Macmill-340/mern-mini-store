import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-20 text-center">
      <h1 className="text-4xl font-bold text-zinc-900">404</h1>
      <p className="mt-2 text-zinc-500">Page not found.</p>
      <Link to="/" className="mt-4 inline-block text-emerald-600 hover:underline">Go home</Link>
    </div>
  );
}
