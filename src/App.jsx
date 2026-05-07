import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";

// Auth Pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";

// Platform Pages
import PlatformDashboard from "./pages/platform/Dashboard";
import PlatformRestaurants from "./pages/platform/Restaurants";
import PlatformRestaurantDetail from "./pages/platform/RestaurantDetail";
import PlatformKYCPending from "./pages/platform/KYCPending";
import PlatformKYCDetail from "./pages/platform/KYCDetail";
import PlatformSubscriptions from "./pages/platform/Subscriptions";
import PlatformCreatePlan from "./pages/platform/CreatePlan";
import PlatformCMS from "./pages/platform/CMS";
import PlatformAdmins from "./pages/platform/Admins";
import PlatformSettings from "./pages/platform/Settings";
import PlatformInvoices from "./pages/platform/Invoices";
import PlatformInvoiceDetail from "./pages/platform/InvoiceDetail";
import PlatformSubscriptionActivity from "./pages/platform/SubscriptionActivity";
import PlatformSystemLogs from "./pages/platform/SystemLogs";
import PlatformTickets from "./pages/platform/Tickets";
import PlatformTicketDetail from "./pages/platform/TicketDetail";

// Restaurant Pages
import RestaurantDashboard from "./pages/restaurant/Dashboard";
import RestaurantMenu from "./pages/restaurant/Menu";
import RestaurantMenuItemForm from "./pages/restaurant/MenuItemForm";
import RestaurantCategoryForm from "./pages/restaurant/CategoryForm";
import RestaurantOrders from "./pages/restaurant/Orders";
import RestaurantOrderDetail from "./pages/restaurant/OrderDetail";
import RestaurantOrderActivityReport from "./pages/restaurant/OrderActivityReport";
import RestaurantCreateOrder from "./pages/restaurant/CreateOrder";
import RestaurantTables from "./pages/restaurant/Tables";
import RestaurantTableForm from "./pages/restaurant/TableForm";
import RestaurantEmployees from "./pages/restaurant/Employees";
import RestaurantEmployeeForm from "./pages/restaurant/EmployeeForm";
import RestaurantKYC from "./pages/restaurant/KYC";
import RestaurantSubscription from "./pages/restaurant/Subscription";
import RestaurantSubscriptionInvoiceDetail from "./pages/restaurant/SubscriptionInvoiceDetail";
import RestaurantTransactions from "./pages/restaurant/Transactions";
import RestaurantSettings from "./pages/restaurant/Settings";
import RestaurantProfile from "./pages/restaurant/Profile";
import RestaurantPromotions from "./pages/restaurant/Promotions";
import RestaurantSystemLogs from "./pages/restaurant/SystemLogs";
import RestaurantTickets from "./pages/restaurant/Tickets";
import RestaurantTicketDetail from "./pages/restaurant/TicketDetail";

// Employee Pages
import KitchenDashboard from "./pages/employee/KitchenDashboard";
import CashierDashboard from "./pages/employee/CashierDashboard";
import OrderList from "./pages/employee/OrderList";
import EmployeeChangePassword from "./pages/employee/EmployeeChangePassword";
import WaiterDashboard from "./pages/waiter/Dashboard";
import WaiterTakeOrder from "./pages/waiter/TakeOrder";
import WaiterLogin from "./pages/waiter/Login";

// Customer Pages
import CustomerHome from "./pages/customer/Home/Home";
import CustomerMenu from "./pages/customer/Menu/MenuCategories";
import CustomerMenuItem from "./pages/customer/MenuItems/MenuItems";
import CustomerMenuItemDetail from "./pages/customer/ItemDetails/ItemDetails";
import CustomerCart from "./pages/customer/Cart";
import CustomerMyOrders from "./pages/customer/MyOrders";
import CustomerOrderTracking from "./pages/customer/OrderTracking";
import CustomerAccountPage from "./pages/customer/AccountPage";


// Layouts
import PlatformLayout from "./components/platform/PlatformLayout";
import RestaurantLayout from "./components/restaurant/RestaurantLayout";
import EmployeeLayout from "./components/employee/EmployeeLayout";
import { defaultPortalPathForUser, getTenantSegments } from "./utils/tenantPaths";
import LandingPage from "./pages/LandingPage";
import NotificationsPage from "./pages/Notifications";

function App() {
  const { user, isLoading } = useAuth();
  const isEmployeeUser =
    user?.scope === "employee" ||
    ["kitchen", "cashier", "manager", "waiter"].includes(user?.role);
  const { slug: userSlug, restaurantId: userRestaurantId } = getTenantSegments(user);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-gray-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Landing Page */}
      <Route path="/" element={<LandingPage />} />
      {/* Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/waiter/login" element={<WaiterLogin />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Platform Routes */}
      <Route element={<PlatformLayout />}>
        <Route path="/platform/dashboard" element={<PlatformDashboard />} />
        <Route path="/platform/restaurants" element={<PlatformRestaurants />} />
        <Route
          path="/platform/restaurants/:id"
          element={<PlatformRestaurantDetail />}
        />
        <Route path="/platform/kyc" element={<PlatformKYCPending />} />
        <Route path="/platform/kyc/:id" element={<PlatformKYCDetail />} />
        <Route
          path="/platform/subscriptions"
          element={<PlatformSubscriptions />}
        />
        <Route
          path="/platform/subscriptions/create"
          element={<PlatformCreatePlan />}
        />
        <Route
          path="/platform/subscriptions/edit/:id"
          element={<PlatformCreatePlan />}
        />
        <Route path="/platform/cms" element={<PlatformCMS />} />
        <Route path="/platform/admins" element={<PlatformAdmins />} />
        <Route path="/platform/tickets" element={<PlatformTickets />} />
        <Route path="/platform/tickets/:id" element={<PlatformTicketDetail />} />
        <Route path="/platform/logs" element={<PlatformSystemLogs />} />
        <Route path="/platform/settings" element={<PlatformSettings />} />
        <Route path="/platform/invoices" element={<PlatformInvoices />} />
        <Route path="/platform/invoices/:id" element={<PlatformInvoiceDetail />} />
        <Route path="/platform/subscription-activity" element={<PlatformSubscriptionActivity />} />
        <Route path="/platform/notifications" element={<NotificationsPage />} />
      </Route>

      {/* Restaurant Routes: /restaurant/:slug/:restaurantId/... */}
      <Route path="/restaurant/:slug/:restaurantId" element={<RestaurantLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<RestaurantDashboard />} />
        <Route path="menu" element={<RestaurantMenu />} />
        <Route path="menu/category/new" element={<RestaurantCategoryForm />} />
        <Route path="menu/category/:id/edit" element={<RestaurantCategoryForm />} />
        <Route path="menu/item/new" element={<RestaurantMenuItemForm />} />
        <Route path="menu/item/:id/edit" element={<RestaurantMenuItemForm />} />
        <Route path="orders" element={<RestaurantOrders />} />
        <Route path="orders/new" element={<RestaurantCreateOrder />} />
        <Route path="orders/activity" element={<RestaurantOrderActivityReport />} />
        <Route path="orders/:id" element={<RestaurantOrderDetail />} />
        <Route path="tables" element={<RestaurantTables />} />
        <Route path="tables/new" element={<RestaurantTableForm />} />
        <Route path="tables/:id/edit" element={<RestaurantTableForm />} />
        <Route path="employees" element={<RestaurantEmployees />} />
        <Route path="employees/new" element={<RestaurantEmployeeForm />} />
        <Route path="employees/:id/edit" element={<RestaurantEmployeeForm />} />
        <Route path="kyc" element={<RestaurantKYC />} />
        <Route path="subscription" element={<RestaurantSubscription />} />
        <Route path="subscription/invoice/:invoiceId" element={<RestaurantSubscriptionInvoiceDetail />} />
        <Route path="transactions" element={<RestaurantTransactions />} />
        <Route path="promotions" element={<RestaurantPromotions />} />
        <Route path="tickets" element={<RestaurantTickets />} />
        <Route path="tickets/create" element={<RestaurantTicketDetail />} />
        <Route path="tickets/:id" element={<RestaurantTicketDetail />} />
        <Route path="logs" element={<RestaurantSystemLogs />} />
        <Route path="settings" element={<RestaurantSettings />} />
        <Route path="profile" element={<RestaurantProfile />} />
        <Route path="notifications" element={<NotificationsPage />} />
      </Route>

      {/* Employee: forced password change (no sidebar) */}
      <Route path="/employee/change-password" element={<EmployeeChangePassword />} />

      {/* Employee Routes: kitchen / cashier / generic employee — all include :slug :restaurantId */}
      <Route element={<EmployeeLayout />}>
        <Route path="/kitchen/:slug/:restaurantId/dashboard" element={<KitchenDashboard />} />
        <Route path="/kitchen/:slug/:restaurantId/orders" element={<OrderList />} />
        <Route path="/kitchen/:slug/:restaurantId/orders/:id" element={<RestaurantOrderDetail />} />
        <Route path="/cashier/:slug/:restaurantId/dashboard" element={<CashierDashboard />} />
        <Route path="/cashier/:slug/:restaurantId/orders/:id" element={<RestaurantOrderDetail />} />
        <Route path="/waiter/:slug/:restaurantId/dashboard" element={<WaiterDashboard />} />
        <Route path="/waiter/:slug/:restaurantId/order" element={<WaiterTakeOrder />} />
        <Route path="/waiter/:slug/:restaurantId/notifications" element={<NotificationsPage />} />
        <Route path="/employee/:slug/:restaurantId/orders" element={<OrderList />} />
        <Route path="/employee/:slug/:restaurantId/orders/:id" element={<RestaurantOrderDetail />} />
        <Route path="/employee/:slug/:restaurantId/notifications" element={<NotificationsPage />} />
        <Route path="/kitchen/:slug/:restaurantId/notifications" element={<NotificationsPage />} />
        <Route path="/cashier/:slug/:restaurantId/notifications" element={<NotificationsPage />} />
      </Route>

      {/* Customer Routes - Public */}
      {/* IMPORTANT: Add the menu route with slug and token parameters */}
      <Route path="/home/:slug/:token" element={<CustomerHome />} />
      <Route path="/menu/:slug/:token" element={<CustomerMenu />} />
      <Route path="/item/:slug/:token/:category" element={<CustomerMenuItem />} />
      <Route path="/item-detail/:slug/:token/:id" element={<CustomerMenuItemDetail />} />
      <Route path="/cart/:slug/:token" element={<CustomerCart />} />
      <Route path="/orders/:slug/:token" element={<CustomerMyOrders />} />
      <Route path="/order/track/:qrToken" element={<CustomerOrderTracking />} />
      <Route path="/account/:slug/:token" element={<CustomerAccountPage />} />
      {/* <Route
        path="/order/success/:orderId"
        element={<CustomerOrderSuccess />}
      /> */}

      {/* Default Redirect */}
      <Route
        path="/"
        element={
          !user ? (
            <Navigate to="/login" />
          ) : isEmployeeUser && user.mustChangePassword ? (
            <Navigate to="/employee/change-password" />
          ) : isEmployeeUser && userSlug != null && userRestaurantId != null ? (
            <Navigate to={defaultPortalPathForUser(user)} replace />
          ) : user.role === "super_admin" || user.role === "admin" ? (
            <Navigate to="/platform/dashboard" />
          ) : user.role === "restaurant" && userSlug != null && userRestaurantId != null ? (
            <Navigate to={defaultPortalPathForUser(user)} replace />
          ) : (
            <Navigate to="/login" />
          )
        }
      />

      {/* Catch all - 404 */}
      <Route
        path="*"
        element={
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">404</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-2">Page not found</p>
            </div>
          </div>
        }
      />
    </Routes>
  );
}

export default App;
