import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { ShoppingCart, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

export function Header() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const [open, setOpen] = useState(false);

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-lg px-3 py-2 text-sm font-medium ${isActive ? 'bg-zinc-900 text-white' : 'text-zinc-700 hover:bg-zinc-100'}`;

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-lg font-bold text-emerald-600">MERN Store</Link>

        <nav className="hidden items-center gap-1 md:flex">
          <NavLink to="/" className={navClass} end>Shop</NavLink>
          {user && <NavLink to="/orders" className={navClass}>Orders</NavLink>}
          {user?.role === 'admin' && <NavLink to="/admin" className={navClass}>Admin</NavLink>}
        </nav>

        <div className="flex items-center gap-2">
          <Link to="/cart" aria-label="Cart" className="relative rounded-lg p-2 hover:bg-zinc-100">
            <ShoppingCart className="h-5 w-5" />
            {count > 0 && <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-xs text-white">{count}</span>}
          </Link>
          {user ? (
            <div className="hidden items-center gap-2 md:flex">
              <span className="text-sm text-zinc-600">{user.name}</span>
              <button onClick={logout} className="rounded-lg p-2 text-zinc-600 hover:bg-zinc-100" title="Logout" aria-label="Logout"><LogOut className="h-5 w-5" /></button>
            </div>
          ) : (
            <div className="hidden gap-2 md:flex">
              <Link to="/login" className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100">Login</Link>
              <Link to="/register" className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700">Register</Link>
            </div>
          )}
          <button className="rounded-lg p-2 md:hidden" aria-label={open ? 'Close menu' : 'Open menu'} onClick={() => setOpen((v) => !v)}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-zinc-200 px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            <NavLink to="/" className={navClass} end onClick={() => setOpen(false)}>Shop</NavLink>
            {user && <NavLink to="/orders" className={navClass} onClick={() => setOpen(false)}>Orders</NavLink>}
            {user?.role === 'admin' && <NavLink to="/admin" className={navClass} onClick={() => setOpen(false)}>Admin</NavLink>}
            {user ? (
              <button onClick={() => { logout(); setOpen(false); }} className="rounded-lg px-3 py-2 text-left text-sm font-medium text-zinc-700 hover:bg-zinc-100">Logout</button>
            ) : (
              <>
                <NavLink to="/login" className={navClass} onClick={() => setOpen(false)}>Login</NavLink>
                <NavLink to="/register" className={navClass} onClick={() => setOpen(false)}>Register</NavLink>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
