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

// Restaurant Pages
import RestaurantDashboard from "./pages/restaurant/Dashboard";
import RestaurantMenu from "./pages/restaurant/Menu";
import RestaurantMenuItemForm from "./pages/restaurant/MenuItemForm";
import RestaurantCategoryForm from "./pages/restaurant/CategoryForm";
import RestaurantOrders from "./pages/restaurant/Orders";
import RestaurantOrderDetail from "./pages/restaurant/OrderDetail";
import RestaurantTables from "./pages/restaurant/Tables";
import RestaurantTableForm from "./pages/restaurant/TableForm";
import RestaurantEmployees from "./pages/restaurant/Employees";
import RestaurantEmployeeForm from "./pages/restaurant/EmployeeForm";
import RestaurantKYC from "./pages/restaurant/KYC";
import RestaurantSubscription from "./pages/restaurant/Subscription";
import RestaurantTransactions from "./pages/restaurant/Transactions";
import RestaurantSettings from "./pages/restaurant/Settings";
import RestaurantProfile from "./pages/restaurant/Profile";
import RestaurantPromotions from "./pages/restaurant/Promotions";

// Employee Pages
import KitchenDashboard from "./pages/employee/KitchenDashboard";
import CashierDashboard from "./pages/employee/CashierDashboard";
import OrderList from "./pages/employee/OrderList";
import EmployeeChangePassword from "./pages/employee/EmployeeChangePassword";

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

function App() {
  const { user, isLoading } = useAuth();
  const isEmployeeUser =
    user?.scope === "employee" ||
    ["kitchen", "cashier", "manager", "waiter"].includes(user?.role);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Auth Routes */}
      <Route path="/login" element={<Login />} />
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
        <Route path="/platform/cms" element={<PlatformCMS />} />
        <Route path="/platform/admins" element={<PlatformAdmins />} />
        <Route path="/platform/settings" element={<PlatformSettings />} />
      </Route>

      {/* Restaurant Routes */}
      <Route element={<RestaurantLayout />}>
        <Route path="/restaurant/dashboard" element={<RestaurantDashboard />} />
        <Route path="/restaurant/menu" element={<RestaurantMenu />} />
        <Route
          path="/restaurant/menu/category/new"
          element={<RestaurantCategoryForm />}
        />
        <Route
          path="/restaurant/menu/category/:id/edit"
          element={<RestaurantCategoryForm />}
        />
        <Route
          path="/restaurant/menu/item/new"
          element={<RestaurantMenuItemForm />}
        />
        <Route
          path="/restaurant/menu/item/:id/edit"
          element={<RestaurantMenuItemForm />}
        />
        <Route path="/restaurant/orders" element={<RestaurantOrders />} />
        <Route
          path="/restaurant/orders/:id"
          element={<RestaurantOrderDetail />}
        />
        <Route path="/restaurant/tables" element={<RestaurantTables />} />
        <Route
          path="/restaurant/tables/new"
          element={<RestaurantTableForm />}
        />
        <Route
          path="/restaurant/tables/:id/edit"
          element={<RestaurantTableForm />}
        />
        <Route path="/restaurant/employees" element={<RestaurantEmployees />} />
        <Route
          path="/restaurant/employees/new"
          element={<RestaurantEmployeeForm />}
        />
        <Route
          path="/restaurant/employees/:id/edit"
          element={<RestaurantEmployeeForm />}
        />
        <Route path="/restaurant/kyc" element={<RestaurantKYC />} />
        <Route
          path="/restaurant/subscription"
          element={<RestaurantSubscription />}
        />
        <Route
          path="/restaurant/transactions"
          element={<RestaurantTransactions />}
        />
        <Route path="/restaurant/promotions" element={<RestaurantPromotions />} />
        <Route path="/restaurant/settings" element={<RestaurantSettings />} />
        <Route path="/restaurant/profile" element={<RestaurantProfile />} />
      </Route>

      {/* Employee: forced password change (no sidebar) */}
      <Route path="/employee/change-password" element={<EmployeeChangePassword />} />

      {/* Employee Routes */}
      <Route element={<EmployeeLayout />}>
        <Route path="/kitchen/dashboard" element={<KitchenDashboard />} />
        <Route path="/cashier/dashboard" element={<CashierDashboard />} />
        <Route path="/employee/orders" element={<OrderList />} />
        <Route path="/employee/orders/:id" element={<RestaurantOrderDetail />} />
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
          ) : isEmployeeUser && user.role === "kitchen" ? (
            <Navigate to="/kitchen/dashboard" />
          ) : isEmployeeUser && user.role === "cashier" ? (
            <Navigate to="/cashier/dashboard" />
          ) : isEmployeeUser ? (
            <Navigate to="/employee/orders" />
          ) : user.role === "super_admin" || user.role === "admin" ? (
            <Navigate to="/platform/dashboard" />
          ) : user.role === "restaurant" ? (
            <Navigate to="/restaurant/dashboard" />
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
              <h1 className="text-4xl font-bold text-gray-900">404</h1>
              <p className="text-gray-500 mt-2">Page not found</p>
            </div>
          </div>
        }
      />
    </Routes>
  );
}

export default App;
