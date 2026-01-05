import { createBrowserRouter, RouterProvider } from "react-router-dom";
import AuthLayout from "./layouts/AuthLayout/AuthLayout";
import NotFound from "./Pages/NotFound/NotFound";
import Login from "./Pages/Auth/Login/Login";
import ForgetPassword from "./Pages/Auth/ForgetPassword/ForgetPassword";
import MasterLayout from "./layouts/MasterLayout/MasterLayout";
import Dashboard from "./Pages/Dashbaord/Dashboard";
import { Toaster } from "react-hot-toast";
import ResetPassword from "./Pages/Auth/ResetPassword/ResetPassword";
import Register from "./Pages/Auth/Register/Register";
import VerifyAccount from "./Pages/Auth/VerifyAccount/VerifyAccount";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";
import Unauthorized from "./Pages/Unauthorized/Unauthorized";
import AddGenerator from "./Pages/Admin/Model/AddGenerator";
import GeneratorList from "./Pages/Admin/Model/GeneratorList";
import EditGenerator from "./Pages/Admin/Model/EditGenerator";
import ViewGeneratorDetails from "./Pages/Admin/Model/ViewGeneratorDetails";
import CreateCustomer from "./Pages/Admin/Customer/CreateCustomer";
import CustomersList from "./Pages/Admin/Customer/CustomersList";
import CustomerDetails from "./Pages/Admin/Customer/CustomerDetails";
import CustomerTickets from "./Pages/Admin/Customer/CustomerTickets";
import PurchaseRequests from "./Pages/Admin/Request/PurchaseRequests";
import RequestDetails from "./Pages/Admin/Request/RequestDetails";
import EditCustomer from "./Pages/Admin/Customer/EditCustomer";
import TicketDetails from "./Pages/Admin/Ticket/TicketDetails";
import TicketList from "./Pages/Admin/Ticket/TicketList";
import AdminList from "./Pages/Admin/AdminRole/AdminList";
import CreateAdmin from "./Pages/Admin/AdminRole/CreateAdmin";
import EditAdmin from "./Pages/Admin/AdminRole/EditAdmin";
import AdminDetails from "./Pages/Admin/AdminRole/AdminDetails";
import AuditLogs from "./Pages/Admin/AuditLogs/AuditLogs";


function App() {
  const routes = createBrowserRouter([
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
      path: "",
      element: (
        <ProtectedRoute>
          <MasterLayout />
        </ProtectedRoute>
      ),
      errorElement: <NotFound />,
      children: [
        { index: true, element: <Dashboard /> },
        {
          path: "dashboard", 
          element: (
            <ProtectedRoute allowedRoles={["admin", "superAdmin"]}>
              <Dashboard />
            </ProtectedRoute>
          )
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

        // Ticket route
        { path: "ticket", element: <TicketList /> },
        { path: "ticket/:id", element: <TicketDetails /> },
         
        

        // Admin Role (Super Admin only)
        {
          path: "admins", 
          element: (
            <ProtectedRoute allowedRoles={["superAdmin"]}>
              <AdminList />
            </ProtectedRoute>
            
          )
        },
        { path: "/admins/create", element: <CreateAdmin /> },
        { path: "/admins/:id", element: <AdminDetails /> },
        { path: "/admins/:id/edit", element: <EditAdmin /> },
        { path: "audit-logs", element:<ProtectedRoute allowedRoles={["superAdmin"]}><AuditLogs /></ProtectedRoute> }
       

      
      ],
    },
  ]);

  return (
    <>
      <RouterProvider router={routes} />
      <Toaster
        position="bottom-right"
        reverseOrder={false}
      />
    </>
  );
}

export default App;