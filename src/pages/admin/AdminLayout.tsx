import { Outlet, Navigate, Link, useLocation } from "react-router-dom";
import { User, Link as LinkIcon, LogOut, Eye } from "lucide-react";

export default function AdminLayout() {
  const token = localStorage.getItem("admin_token");
  const location = useLocation();

  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    window.location.href = "/admin/login";
  };

  const navItems = [
    { name: "Profile", path: "/admin/profile", icon: User },
    { name: "Links", path: "/admin/links", icon: LinkIcon },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row">
      {/* Sidebar */}
      <div className="w-full md:w-64 bg-white shadow-md flex flex-col">
        <div className="p-6">
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            Microsite
          </h1>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? "bg-rose-50 text-rose-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <item.icon className="mr-3 flex-shrink-0 h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t space-y-2">
          <Link
            to="/solarhijab"
            target="_blank"
            className="flex items-center px-4 py-2 text-sm font-medium text-gray-600 hover:text-rose-600 rounded-lg hover:bg-gray-50"
          >
            <Eye className="mr-3 h-5 w-5" />
            Preview Site
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-3xl mx-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
