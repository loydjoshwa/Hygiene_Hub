import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingBag,
  Menu,
  X,
  LogOut,
  Home,
  ChevronRight,
} from "lucide-react";

const AdminLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("adminLogged");
    localStorage.removeItem("adminEmail");
    toast.success("Logged out successfully!");
    window.location.href = "/login";
  };

  const navItems = [
    { name: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Orders", path: "/admin/orders", icon: ShoppingBag },
    { name: "Products", path: "/admin/products", icon: Package },
    { name: "Users", path: "/admin/users", icon: Users },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#00CAFF]/5 to-[#4300FF]/5">


      <aside
        className={`
          fixed inset-y-0 left-0 z-50
          bg-gradient-to-b from-[#4300FF] to-[#0065F8] text-white
          transition-all duration-300 shadow-2xl
          ${sidebarOpen ? "translate-x-0 w-64" : "-translate-x-full w-64"}
          lg:translate-x-0 lg:w-20 lg:hover:w-64 group
        `}
      >
        
        <div className="h-20 border-b border-white/20 flex items-center px-4">
          <div className="w-12 h-12 shrink-0 bg-gradient-to-br from-[#00FFDE] to-[#00CAFF] rounded-xl flex items-center justify-center text-2xl font-bold">
            H
          </div>
          <div className="ml-3 opacity-0 lg:group-hover:opacity-100 transition-all duration-300">
            <h1 className="font-bold text-xl">HygieneHub</h1>
            <p className="text-xs text-white/70">Admin Panel</p>
          </div>
        </div>

      
        <nav className="p-4">
          <ul className="space-y-2">
            {navItems.map(({ name, path, icon: Icon }) => (
              <li key={path}>
                <Link
                  to={path}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-4 px-3 py-3 rounded-xl
                    transition-all
                    ${isActive(path)
                      ? "bg-white/20 shadow-lg"
                      : "hover:bg-white/10"}
                  `}
                >
                  
                  <div className="w-10 h-10 shrink-0 flex items-center justify-center">
                    <Icon
                      className={`w-5 h-5 ${
                        isActive(path) ? "text-[#00FFDE]" : "text-white"
                      }`}
                    />
                  </div>

                  
                  <span
                    className="
                      whitespace-nowrap
                      opacity-0
                      lg:group-hover:opacity-100
                      transition-all duration-300
                      font-medium
                    "
                  >
                    {name}
                  </span>

                  <ChevronRight
                    className="
                      w-4 h-4 ml-auto
                      opacity-0
                      lg:group-hover:opacity-100
                      transition-all
                    "
                  />
                </Link>
              </li>
            ))}

          

            <li className="pt-6 mt-6 border-t border-white/20">
              <button
                onClick={handleLogout}
                className="flex items-center gap-4 px-3 py-3 rounded-xl hover:bg-white/10 w-full"
              >
                <div className="w-10 h-10 shrink-0 flex items-center justify-center">
                  <LogOut className="w-5 h-5" />
                </div>
                <span className="opacity-0 lg:group-hover:opacity-100 transition-all duration-300 font-medium">
                  Logout
                </span>
              </button>
            </li>
          </ul>
        </nav>
      </aside>

      
      <div className="lg:ml-20 transition-all duration-300">
        <header className="bg-white/80 backdrop-blur shadow border-b">
          <div className="flex items-center gap-4 px-6 py-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-3 rounded-xl bg-gradient-to-r from-[#4300FF] to-[#0065F8] text-white"
            >
              {sidebarOpen ? <X /> : <Menu />}
            </button>

            <Home className="text-[#0065F8]" />
            <h1 className="text-xl font-bold">Admin Panel</h1>
          </div>
        </header>

        <main className="p-6">
          <div className="bg-white rounded-2xl shadow p-4 min-h-[calc(100vh-120px)]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
