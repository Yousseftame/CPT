// src/routes/routes.tsx
import { createBrowserRouter } from "react-router-dom";

// Layouts
import AuthLayout from "../layouts/AuthLayout/AuthLayout";
import MasterLayout from "../layouts/MasterLayout/MasterLayout";

// Auth Pages
import Login from "../Pages/Auth/Login/Login";
import ForgetPassword from "../Pages/Auth/ForgetPassword/ForgetPassword";
import ResetPassword from "../Pages/Auth/ResetPassword/ResetPassword";
import VerifyAccount from "../Pages/Auth/VerifyAccount/VerifyAccount";

// Admin Pages - Models
import AddGenerator from "../Pages/Admin/Model/AddGenerator";
import GeneratorList from "../Pages/Admin/Model/GeneratorList";
import EditGenerator from "../Pages/Admin/Model/EditGenerator";
import ViewGeneratorDetails from "../Pages/Admin/Model/ViewGeneratorDetails";

// Admin Pages - Customers
import CreateCustomer from "../Pages/Admin/Customer/CreateCustomer";
import CustomersList from "../Pages/Admin/Customer/CustomersList";
import CustomerDetails from "../Pages/Admin/Customer/CustomerDetails";
import CustomerTickets from "../Pages/Admin/Customer/CustomerTickets";
import EditCustomer from "../Pages/Admin/Customer/EditCustomer";

// Admin Pages - Requests
import PurchaseRequests from "../Pages/Admin/Request/PurchaseRequests";
import RequestDetails from "../Pages/Admin/Request/RequestDetails";

// Admin Pages - Tickets
import TicketDetails from "../Pages/Admin/Ticket/TicketDetails";
import TicketList from "../Pages/Admin/Ticket/TicketList";

// Admin Pages - Admin Role
import AdminList from "../Pages/Admin/AdminRole/AdminList";
import CreateAdmin from "../Pages/Admin/AdminRole/CreateAdmin";
import EditAdmin from "../Pages/Admin/AdminRole/EditAdmin";
import AdminDetails from "../Pages/Admin/AdminRole/AdminDetails";

// Admin Pages - Audit
import AuditLogs from "../Pages/Admin/AuditLogs/AuditLogs";

// Other Pages
import Dashboard from "../Pages/Dashbaord/Dashboard";
import NotFound from "../Pages/NotFound/NotFound";
import Unauthorized from "../Pages/Unauthorized/Unauthorized";

// Components
import ProtectedRoute from "../components/ProtectedRoute/ProtectedRoute";
import Register from "../Pages/Auth/Register/Register";

export const routes = createBrowserRouter([
  {
    path: "/",
    element: <AuthLayout />,
    errorElement: <NotFound />,
    children: [
      { index: true, element: <Login /> },
      { path: "login", element: <Login /> },
      { path: "register", element: <Register /> },
      { path: "reset-password", element: <ResetPassword /> },
      { path: "forget-password", element: <ForgetPassword /> },
      { path: "verify-account", element: <VerifyAccount /> },
    ],
  },
  {
    path: "/unauthorized",
    element: <Unauthorized />,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute allowedRoles={["admin", "superAdmin"]}>
        <MasterLayout />
      </ProtectedRoute>
    ),
    errorElement: <NotFound />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: "dashboard",
        element: <Dashboard />,
      },

      // Customer routes
      { path: "customers", element: <CreateCustomer /> },
      { path: "customer", element: <CustomersList /> },
      { path: "customer/:id", element: <CustomerDetails /> },
      { path: "customer/:id/edit", element: <EditCustomer /> },
      { path: "customer/:id/tickets", element: <CustomerTickets /> },

      // Model/Generator routes
      { path: "/models/add", element: <AddGenerator /> },
      { path: "/models", element: <GeneratorList /> },
      { path: "/models/view/:id", element: <ViewGeneratorDetails /> },
      { path: "/models/edit/:id", element: <EditGenerator /> },

      // Request routes
      { path: "/requests", element: <PurchaseRequests /> },
      { path: "/requests/:id", element: <RequestDetails /> },

      // Ticket routes
      { path: "ticket", element: <TicketList /> },
      { path: "ticket/:id", element: <TicketDetails /> },

      // Admin Role (Super Admin only)
      {
        path: "admins",
        element: (
          <ProtectedRoute allowedRoles={["superAdmin"]}>
            <AdminList />
          </ProtectedRoute>
        ),
      },
      {
        path: "/admins/create",
        element: (
          <ProtectedRoute allowedRoles={["superAdmin"]}>
            <CreateAdmin />
          </ProtectedRoute>
        ),
      },
      {
        path: "/admins/:id",
        element: (
          <ProtectedRoute allowedRoles={["superAdmin"]}>
            <AdminDetails />
          </ProtectedRoute>
        ),
      },
      {
        path: "/admins/:id/edit",
        element: (
          <ProtectedRoute allowedRoles={["superAdmin"]}>
            <EditAdmin />
          </ProtectedRoute>
        ),
      },

      // Audit Logs (Super Admin only)
      {
        path: "audit-logs",
        element: (
          <ProtectedRoute allowedRoles={["superAdmin"]}>
            <AuditLogs />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);