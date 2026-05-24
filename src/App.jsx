import React, { useEffect, useRef } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import api from "./services/api";
import { useTheme } from "./context/ThemeContext";
import useGlobalButtonSpinner from "./hooks/useGlobalButtonSpinner";
import useDisableNumberInputWheel from "./hooks/useDisableNumberInputWheel";
import { Agentation } from "agentation";

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
import PlatformPlanAccessSettings from "./pages/platform/PlanAccessSettings";
import PlatformCMS from "./pages/platform/CMS";
import PlatformReviews from "./pages/platform/Reviews";
import PlatformAdmins from "./pages/platform/Admins";
import PlatformSettings from "./pages/platform/Settings";
import PlatformFinanceSettings from "./pages/platform/PlatformFinanceSettings";
import PlatformInvoices from "./pages/platform/Invoices";
import PlatformInvoiceDetail from "./pages/platform/InvoiceDetail";
import PlatformSubscriptionActivity from "./pages/platform/SubscriptionActivity";
import PlatformSystemLogs from "./pages/platform/SystemLogs";
import PlatformSecurityOperations from "./pages/platform/SecurityOperations";
import PlatformTickets from "./pages/platform/Tickets";
import PlatformTicketDetail from "./pages/platform/TicketDetail";
import PlatformSubscriptionPayments from "./pages/platform/SubscriptionPayments";
import PlatformPayroll from "./pages/platform/PlatformPayroll";
import PlatformExpenses from "./pages/platform/finance/PlatformExpenses";
import PlatformProfitLoss from "./pages/platform/finance/PlatformProfitLoss";
import PlatformPermissionGate from "./components/platform/PlatformPermissionGate";

// Restaurant Pages
import RestaurantDashboard from "./pages/restaurant/Dashboard";
import RestaurantMenu from "./pages/restaurant/Menu";
import RestaurantMenuItemForm from "./pages/restaurant/MenuItemForm";
import RestaurantCategoryForm from "./pages/restaurant/CategoryForm";
import RestaurantOrders from "./pages/restaurant/Orders";
import RestaurantOrderDetail from "./pages/restaurant/OrderDetail";
import RestaurantOrderActivityReport from "./pages/restaurant/OrderActivityReport";
import RestaurantTables from "./pages/restaurant/Tables";
import RestaurantTableForm from "./pages/restaurant/TableForm";
import RestaurantEmployees from "./pages/restaurant/Employees";
import RestaurantEmployeeForm from "./pages/restaurant/EmployeeForm";
import RestaurantKYC from "./pages/restaurant/KYC";
import RestaurantSubscription from "./pages/restaurant/Subscription";
import RestaurantSubscriptionCheckout from "./pages/restaurant/SubscriptionCheckout";
import RestaurantSubscriptionInvoiceDetail from "./pages/restaurant/SubscriptionInvoiceDetail";
import RestaurantSettings from "./pages/restaurant/Settings";
import BackupRecovery from "./pages/restaurant/BackupRecovery";
import RestaurantActiveDevices from "./pages/restaurant/ActiveDevices";
import RestaurantCreditCustomers from "./pages/restaurant/CreditCustomers";
import RestaurantProfile from "./pages/restaurant/Profile";
import RestaurantPublicProfile from "./pages/restaurant/PublicProfile";
import RestaurantPromotions from "./pages/restaurant/Promotions";
import RestaurantReservations from "./pages/restaurant/Reservations";
import RestaurantBranches from "./pages/restaurant/Branches";
import BranchLogin from "./pages/branch/BranchLogin";
import BranchSettings from "./pages/branch/BranchSettings";
import RestaurantSystemLogs from "./pages/restaurant/SystemLogs";
import RestaurantTickets from "./pages/restaurant/Tickets";
import RestaurantTicketDetail from "./pages/restaurant/TicketDetail";
import FinanceDashboard from "./pages/restaurant/finance/Dashboard";
import FinanceExpenses from "./pages/restaurant/finance/Expenses";
import FinanceProfitLoss from "./pages/restaurant/finance/ProfitLoss";
import FinancePayroll from "./pages/restaurant/finance/Payroll";
import FinanceInvoices from "./pages/restaurant/finance/Invoices";
import FinanceInventory from "./pages/restaurant/finance/Inventory";
import FinanceBudget from "./pages/restaurant/finance/Budget";
import FinanceAccounting from "./pages/restaurant/finance/Accounting";
import FeedbackInbox from "./pages/restaurant/FeedbackInbox";
import CustomerDirectory from "./pages/restaurant/CustomerDirectory";
import DeliveryDispatch from "./pages/restaurant/DeliveryDispatch";
import FoodCostReport from "./pages/restaurant/FoodCostReport";
import PosLayout from "./pages/restaurant/pos/PosLayout";
import PosMain from "./pages/restaurant/pos/PosMain";
import PosOrdersList from "./pages/restaurant/pos/PosOrdersList";
import PosBilling from "./pages/restaurant/pos/PosBilling";
import PosHistory from "./pages/restaurant/pos/PosHistory";
import PosReturns from "./pages/restaurant/pos/PosReturns";
import PosShift from "./pages/restaurant/pos/PosShift";
import PosReports from "./pages/restaurant/pos/PosReports";

// Employee Pages
import KitchenDashboard from "./pages/employee/KitchenDashboard";
import CashierDashboard from "./pages/employee/CashierDashboard";
import CashierTransactions from "./pages/employee/CashierTransactions";
import CashierHouseCredit from "./pages/employee/CashierHouseCredit";
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
import CustomerBill from "./pages/customer/CustomerBill";
import CustomerAccountPage from "./pages/customer/AccountPage";
import CustomerAboutRestaurant from "./pages/customer/Home/AboutRestaurant";
import CustomerSettingsPage from "./pages/customer/Home/Settings";
import CustomerPrivacyPage from "./pages/customer/Home/CustomerDataNotice";
import CustomerCreditApply from "./pages/customer/CreditApply";

// Layouts
import PlatformLayout from "./components/platform/PlatformLayout";
import RestaurantLayout from "./components/restaurant/RestaurantLayout";
import RestaurantPortalIndex from "./components/restaurant/RestaurantPortalIndex";
import PlanProtectedOutlet from "./components/restaurant/PlanProtectedOutlet";
import BranchLayout from "./components/branch/BranchLayout";
import EmployeeLayout from "./components/employee/EmployeeLayout";
import ManagerLayout from "./components/manager/ManagerLayout";
import ManagerDashboard from "./pages/manager/Dashboard";
import ManagerSalesActivity from "./pages/manager/SalesActivity";
import ManagerTeam from "./pages/manager/Team";
import {
  defaultPortalPathForUser,
  getTenantSegments,
} from "./utils/tenantPaths";
import LandingPage from "./pages/LandingPage";
import Blog from "./pages/Blog";
import BlogDetail from "./pages/BlogDetail";
import NotificationsPage from "./pages/Notifications";
import SubscriptionPaymentCallback from "./pages/restaurant/SubscriptionPaymentCallback";

const CUSTOMER_ROUTE_PREFIXES = [
  "/home/",
  "/menu/",
  "/item/",
  "/item-detail/",
  "/cart/",
  "/orders/",
  "/order/track/",
  "/order/bill/",
  "/account/",
  "/about/",
  "/settings/",
  "/privacy/",
  "/credit-apply/",
];

function CustomerRouteScrollReset() {
  const { pathname } = useLocation();

  useEffect(() => {
    const isCustomerRoute = CUSTOMER_ROUTE_PREFIXES.some((prefix) =>
      pathname.startsWith(prefix),
    );
    if (!isCustomerRoute) return;

    const previousScrollBehavior = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = "auto";
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;

    const frame = window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      document.documentElement.style.scrollBehavior = previousScrollBehavior;
    });

    return () => {
      window.cancelAnimationFrame(frame);
      document.documentElement.style.scrollBehavior = previousScrollBehavior;
    };
  }, [pathname]);

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  return null;
}

function App() {
  const { user, isLoading, mergeUser } = useAuth();
  const { applyRemoteTheme } = useTheme();
  useGlobalButtonSpinner();
  useDisableNumberInputWheel();
  const themeProfileLoadedFor = useRef("");
  const isEmployeeUser =
    user?.scope === "employee" ||
    ["kitchen", "cashier", "manager", "waiter", "admin", "accountant"].includes(
      user?.role,
    );
  const { slug: userSlug, restaurantId: userRestaurantId } =
    getTenantSegments(user);

  useEffect(() => {
    const key = user?.restaurantId || user?.id || "";
    const shouldLoad =
      user &&
      key &&
      (user.role === "restaurant" ||
        user.scope === "branch_user" ||
        user.scope === "employee" ||
        ["kitchen", "cashier", "manager", "waiter", "accountant"].includes(
          user.role,
        ));

    if (!shouldLoad || themeProfileLoadedFor.current === key) return;
    themeProfileLoadedFor.current = key;

    api
      .get("/restaurant/auth/profile", { skipErrorToast: true })
      .then((res) => {
        const restaurant = res?.data?.data;
        if (restaurant?.settings?.themeSettings) {
          applyRemoteTheme(restaurant.settings.themeSettings);
        }
        if (restaurant?.logo || restaurant?.favicon) {
          mergeUser({
            logo: restaurant.logo || user?.logo || "",
            favicon: restaurant.favicon || user?.favicon || "",
          });
        }
      })
      .catch(() => {
        themeProfileLoadedFor.current = "";
      });
  }, [applyRemoteTheme, mergeUser, user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-gray-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <>
      <Agentation />
      <CustomerRouteScrollReset />
      <Routes>
        {/* Landing Page */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:key" element={<BlogDetail />} />
        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/vendor/login" element={<Login />} />
        <Route path="/platform/login" element={<Login />} />
        <Route path="/staff/login" element={<Login />} />
        <Route path="/waiter/login" element={<WaiterLogin />} />
        <Route path="/register" element={<Register />} />
        <Route path="/vendor/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route
          path="/branch/dashboard"
          element={
            user?.scope === "branch_user" ? (
              <Navigate to={defaultPortalPathForUser(user)} replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route path="/branch/login" element={<BranchLogin />} />
        <Route
          path="/branch/:restaurantId/:portalKey/:branchSlug/login"
          element={<BranchLogin />}
        />

        {/* Platform Routes */}
        <Route element={<PlatformLayout />}>
          <Route
            path="/platform/dashboard"
            element={
              <PlatformPermissionGate permission="viewAnalytics">
                <PlatformDashboard />
              </PlatformPermissionGate>
            }
          />
          <Route
            path="/platform/restaurants"
            element={
              <PlatformPermissionGate permission="manageRestaurants">
                <PlatformRestaurants />
              </PlatformPermissionGate>
            }
          />
          <Route
            path="/platform/restaurants/:id"
            element={
              <PlatformPermissionGate permission="manageRestaurants">
                <PlatformRestaurantDetail />
              </PlatformPermissionGate>
            }
          />
          <Route
            path="/platform/kyc"
            element={
              <PlatformPermissionGate permission="verifyKYC">
                <PlatformKYCPending />
              </PlatformPermissionGate>
            }
          />
          <Route
            path="/platform/kyc/:id"
            element={
              <PlatformPermissionGate permission="verifyKYC">
                <PlatformKYCDetail />
              </PlatformPermissionGate>
            }
          />
          <Route
            path="/platform/subscriptions"
            element={
              <PlatformPermissionGate permission="manageSubscriptionPlans">
                <PlatformSubscriptions />
              </PlatformPermissionGate>
            }
          />
          <Route
            path="/platform/subscriptions/create"
            element={
              <PlatformPermissionGate permission="manageSubscriptionPlans">
                <PlatformCreatePlan />
              </PlatformPermissionGate>
            }
          />
          <Route
            path="/platform/subscriptions/edit/:id"
            element={
              <PlatformPermissionGate permission="manageSubscriptionPlans">
                <PlatformCreatePlan />
              </PlatformPermissionGate>
            }
          />
          <Route
            path="/platform/plan-access-settings"
            element={
              <PlatformPermissionGate permission="manageTrialAccess">
                <PlatformPlanAccessSettings />
              </PlatformPermissionGate>
            }
          />
          <Route
            path="/platform/cms"
            element={
              <PlatformPermissionGate permission="manageCMS">
                <PlatformCMS />
              </PlatformPermissionGate>
            }
          />
          <Route
            path="/platform/reviews"
            element={
              <PlatformPermissionGate permission="manageReviews">
                <PlatformReviews />
              </PlatformPermissionGate>
            }
          />
          <Route path="/platform/admins" element={<PlatformAdmins />} />
          <Route
            path="/platform/payroll"
            element={
              <PlatformPermissionGate permission="managePayroll">
                <PlatformPayroll />
              </PlatformPermissionGate>
            }
          />
          <Route path="/platform/expenses" element={<PlatformExpenses />} />
          <Route
            path="/platform/profit-loss"
            element={<PlatformProfitLoss />}
          />
          <Route
            path="/platform/tickets"
            element={
              <PlatformPermissionGate permission="manageTickets">
                <PlatformTickets />
              </PlatformPermissionGate>
            }
          />
          <Route
            path="/platform/tickets/:id"
            element={
              <PlatformPermissionGate permission="manageTickets">
                <PlatformTicketDetail />
              </PlatformPermissionGate>
            }
          />
          <Route
            path="/platform/logs"
            element={
              <PlatformPermissionGate permission="manageLogs">
                <PlatformSystemLogs />
              </PlatformPermissionGate>
            }
          />
          <Route
            path="/platform/security"
            element={
              <PlatformPermissionGate permission="manageSecurity">
                <PlatformSecurityOperations />
              </PlatformPermissionGate>
            }
          />
          <Route
            path="/platform/settings"
            element={
              <PlatformPermissionGate staffOnly>
                <PlatformSettings />
              </PlatformPermissionGate>
            }
          />
          <Route
            path="/platform/finance/settings"
            element={<PlatformFinanceSettings />}
          />
          <Route
            path="/platform/invoices"
            element={
              <PlatformPermissionGate permission="manageSubscriptionInvoices">
                <PlatformInvoices />
              </PlatformPermissionGate>
            }
          />
          <Route
            path="/platform/invoices/:id"
            element={
              <PlatformPermissionGate permission="manageSubscriptionInvoices">
                <PlatformInvoiceDetail />
              </PlatformPermissionGate>
            }
          />
          <Route
            path="/platform/subscription-activity"
            element={
              <PlatformPermissionGate permission="manageSubscriptionActivity">
                <PlatformSubscriptionActivity />
              </PlatformPermissionGate>
            }
          />
          <Route
            path="/platform/subscription-payments"
            element={
              <PlatformPermissionGate permission="manageSubscriptionPayments">
                <PlatformSubscriptionPayments />
              </PlatformPermissionGate>
            }
          />
          <Route
            path="/platform/notifications"
            element={<NotificationsPage />}
          />
        </Route>

        {/* Restaurant Routes: /restaurant/:slug/:restaurantId/... */}
        <Route
          path="/restaurant/:slug/:restaurantId"
          element={<RestaurantLayout />}
        >
          <Route index element={<RestaurantPortalIndex />} />
          <Route element={<PlanProtectedOutlet />}>
            <Route path="dashboard" element={<RestaurantDashboard />} />
            <Route path="menu" element={<RestaurantMenu />} />
            <Route
              path="menu/category/new"
              element={<RestaurantCategoryForm />}
            />
            <Route
              path="menu/category/:id/edit"
              element={<RestaurantCategoryForm />}
            />
            <Route path="menu/item/new" element={<RestaurantMenuItemForm />} />
            <Route
              path="menu/item/:id/edit"
              element={<RestaurantMenuItemForm />}
            />
            <Route path="orders" element={<RestaurantOrders />} />
            <Route
              path="orders/activity"
              element={<RestaurantOrderActivityReport />}
            />
            <Route path="orders/dispatch" element={<DeliveryDispatch />} />
            <Route path="reports/food-cost" element={<FoodCostReport />} />
            <Route path="feedback" element={<FeedbackInbox />} />
            <Route path="customers" element={<CustomerDirectory />} />
            <Route path="orders/:id" element={<RestaurantOrderDetail />} />
            <Route path="tables" element={<RestaurantTables />} />
            <Route path="reservations" element={<RestaurantReservations />} />
            <Route path="tables/new" element={<RestaurantTableForm />} />
            <Route path="tables/:id/edit" element={<RestaurantTableForm />} />
            <Route path="employees" element={<RestaurantEmployees />} />
            <Route path="employees/new" element={<RestaurantEmployeeForm />} />
            <Route
              path="employees/:id/edit"
              element={<RestaurantEmployeeForm />}
            />
            <Route path="kyc" element={<RestaurantKYC />} />
            <Route path="subscription" element={<RestaurantSubscription />} />
            <Route
              path="subscription/checkout/:planId"
              element={<RestaurantSubscriptionCheckout />}
            />
            <Route
              path="subscription/invoice/:invoiceId"
              element={<RestaurantSubscriptionInvoiceDetail />}
            />
            <Route
              path="transactions"
              element={<Navigate to="../orders/activity" replace />}
            />
            <Route path="promotions" element={<RestaurantPromotions />} />
            <Route path="branches" element={<RestaurantBranches />} />
            <Route
              path="credit-customers"
              element={<RestaurantCreditCustomers />}
            />
            <Route path="tickets" element={<RestaurantTickets />} />
            <Route path="tickets/create" element={<RestaurantTicketDetail />} />
            <Route path="tickets/:id" element={<RestaurantTicketDetail />} />
            <Route path="logs" element={<RestaurantSystemLogs />} />
            <Route path="finance/dashboard" element={<FinanceDashboard />} />
            <Route path="finance/expenses" element={<FinanceExpenses />} />
            <Route path="finance/profit-loss" element={<FinanceProfitLoss />} />
            <Route path="finance/payroll" element={<FinancePayroll />} />
            <Route path="finance/invoices" element={<FinanceInvoices />} />
            <Route path="finance/inventory" element={<FinanceInventory />} />
            <Route path="finance/budget" element={<FinanceBudget />} />
            <Route path="finance/accounting" element={<FinanceAccounting />} />
            <Route path="settings" element={<RestaurantSettings />} />
            <Route path="backup-recovery" element={<BackupRecovery />} />
            <Route
              path="public-profile"
              element={<RestaurantPublicProfile />}
            />
            <Route path="profile" element={<RestaurantProfile />} />
            <Route path="settings" element={<RestaurantSettings />} />
            <Route path="security" element={<RestaurantActiveDevices />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="pos" element={<PosLayout />}>
              <Route index element={<PosMain />} />
              <Route path="orders" element={<PosOrdersList />} />
              <Route path="billing" element={<PosBilling />} />
              <Route path="history" element={<PosHistory />} />
              <Route path="returns" element={<PosReturns />} />
              <Route path="shift" element={<PosShift />} />
              <Route path="reports" element={<PosReports />} />
            </Route>
          </Route>
        </Route>

        {/* Branch portal: /branch/:restaurantId/:portalKey/:branchSlug/... */}
        <Route
          path="/branch/:restaurantId/:portalKey/:branchSlug"
          element={<BranchLayout />}
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<RestaurantDashboard />} />
          <Route path="menu" element={<RestaurantMenu />} />
          <Route
            path="menu/category/new"
            element={<RestaurantCategoryForm />}
          />
          <Route
            path="menu/category/:id/edit"
            element={<RestaurantCategoryForm />}
          />
          <Route path="menu/item/new" element={<RestaurantMenuItemForm />} />
          <Route
            path="menu/item/:id/edit"
            element={<RestaurantMenuItemForm />}
          />
          <Route path="orders" element={<RestaurantOrders />} />
          <Route
            path="orders/activity"
            element={<RestaurantOrderActivityReport />}
          />
          <Route path="orders/dispatch" element={<DeliveryDispatch />} />
          <Route path="reports/food-cost" element={<FoodCostReport />} />
          <Route path="feedback" element={<FeedbackInbox />} />
          <Route path="customers" element={<CustomerDirectory />} />
          <Route path="orders/:id" element={<RestaurantOrderDetail />} />
          <Route path="tables" element={<RestaurantTables />} />
          <Route path="reservations" element={<RestaurantReservations />} />
          <Route path="tables/new" element={<RestaurantTableForm />} />
          <Route path="tables/:id/edit" element={<RestaurantTableForm />} />
          <Route path="employees" element={<RestaurantEmployees />} />
          <Route path="employees/new" element={<RestaurantEmployeeForm />} />
          <Route
            path="employees/:id/edit"
            element={<RestaurantEmployeeForm />}
          />
          <Route path="promotions" element={<RestaurantPromotions />} />
          <Route
            path="credit-customers"
            element={<RestaurantCreditCustomers />}
          />
          <Route path="finance/dashboard" element={<FinanceDashboard />} />
          <Route path="finance/expenses" element={<FinanceExpenses />} />
          <Route path="finance/profit-loss" element={<FinanceProfitLoss />} />
          <Route path="finance/payroll" element={<FinancePayroll />} />
          <Route path="finance/invoices" element={<FinanceInvoices />} />
          <Route path="finance/inventory" element={<FinanceInventory />} />
          <Route path="finance/budget" element={<FinanceBudget />} />
          <Route path="finance/accounting" element={<FinanceAccounting />} />
          <Route path="profile" element={<RestaurantProfile />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="tickets" element={<RestaurantTickets />} />
          <Route path="tickets/create" element={<RestaurantTicketDetail />} />
          <Route path="tickets/:id" element={<RestaurantTicketDetail />} />
          <Route path="public-profile" element={<RestaurantPublicProfile />} />
          <Route path="settings" element={<BranchSettings />} />
          <Route path="pos" element={<PosLayout />}>
            <Route index element={<PosMain />} />
            <Route path="orders" element={<PosOrdersList />} />
            <Route path="billing" element={<PosBilling />} />
            <Route path="history" element={<PosHistory />} />
            <Route path="returns" element={<PosReturns />} />
            <Route path="shift" element={<PosShift />} />
            <Route path="reports" element={<PosReports />} />
          </Route>
        </Route>

        {/* Employee: forced password change (no sidebar) */}
        <Route
          path="/employee/change-password"
          element={<EmployeeChangePassword />}
        />

        {/* Manager portal: operations, analytics, team */}
        <Route path="/manager/:slug/:restaurantId" element={<ManagerLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<ManagerDashboard />} />
          <Route path="orders" element={<RestaurantOrders />} />
          <Route path="orders/:id" element={<RestaurantOrderDetail />} />
          <Route path="tables" element={<RestaurantTables />} />
          <Route path="reservations" element={<RestaurantReservations />} />
          <Route path="tables/new" element={<RestaurantTableForm />} />
          <Route path="tables/:id/edit" element={<RestaurantTableForm />} />
          <Route path="payments" element={<CashierDashboard />} />
          <Route path="sales-activity" element={<ManagerSalesActivity />} />
          <Route path="reports" element={<RestaurantOrderActivityReport />} />
          <Route path="team" element={<ManagerTeam />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="pos" element={<PosLayout />}>
            <Route index element={<PosMain />} />
            <Route path="orders" element={<PosOrdersList />} />
            <Route path="billing" element={<PosBilling />} />
            <Route path="history" element={<PosHistory />} />
            <Route path="returns" element={<PosReturns />} />
            <Route path="shift" element={<PosShift />} />
            <Route path="reports" element={<PosReports />} />
          </Route>
        </Route>

        {/* Employee Routes: kitchen / cashier / generic employee — all include :slug :restaurantId */}
        <Route element={<EmployeeLayout />}>
          <Route
            path="/kitchen/:slug/:restaurantId/dashboard"
            element={<KitchenDashboard />}
          />
          <Route
            path="/kitchen/:slug/:restaurantId/orders"
            element={<OrderList />}
          />
          <Route
            path="/kitchen/:slug/:restaurantId/orders/:id"
            element={<RestaurantOrderDetail />}
          />
          <Route
            path="/cashier/:slug/:restaurantId/dashboard"
            element={<CashierDashboard />}
          />
          <Route
            path="/cashier/:slug/:restaurantId/transactions"
            element={<CashierTransactions />}
          />
          <Route
            path="/cashier/:slug/:restaurantId/house-credit"
            element={<CashierHouseCredit />}
          />
          <Route
            path="/cashier/:slug/:restaurantId/orders/:id"
            element={<RestaurantOrderDetail />}
          />
          <Route
            path="/waiter/:slug/:restaurantId/dashboard"
            element={<WaiterDashboard />}
          />
          <Route
            path="/waiter/:slug/:restaurantId/order"
            element={<WaiterTakeOrder />}
          />
          <Route
            path="/waiter/:slug/:restaurantId/notifications"
            element={<NotificationsPage />}
          />
          <Route
            path="/employee/:slug/:restaurantId/orders"
            element={<OrderList />}
          />
          <Route
            path="/employee/:slug/:restaurantId/orders/:id"
            element={<RestaurantOrderDetail />}
          />
          <Route
            path="/employee/:slug/:restaurantId/notifications"
            element={<NotificationsPage />}
          />
          <Route
            path="/kitchen/:slug/:restaurantId/notifications"
            element={<NotificationsPage />}
          />
          <Route
            path="/cashier/:slug/:restaurantId/notifications"
            element={<NotificationsPage />}
          />
          <Route path="/waiter/:slug/:restaurantId/pos" element={<PosLayout />}>
            <Route index element={<PosMain />} />
            <Route path="orders" element={<PosOrdersList />} />
            <Route path="billing" element={<PosBilling />} />
            <Route path="history" element={<PosHistory />} />
            <Route path="returns" element={<PosReturns />} />
            <Route path="shift" element={<PosShift />} />
            <Route path="reports" element={<PosReports />} />
          </Route>
        </Route>

        {/* Customer Routes - Public */}
        {/* IMPORTANT: Add the menu route with slug and token parameters */}
        <Route path="/home/:slug/:token" element={<CustomerHome />} />
        <Route path="/menu/:slug/:token" element={<CustomerMenu />} />
        <Route
          path="/item/:slug/:token/:category"
          element={<CustomerMenuItem />}
        />
        <Route
          path="/item-detail/:slug/:token/:id"
          element={<CustomerMenuItemDetail />}
        />
        <Route path="/cart/:slug/:token" element={<CustomerCart />} />
        <Route path="/orders/:slug/:token" element={<CustomerMyOrders />} />
        <Route
          path="/order/track/:qrToken"
          element={<CustomerOrderTracking />}
        />
        <Route path="/order/bill/:qrToken" element={<CustomerBill />} />
        <Route path="/account/:slug/:token" element={<CustomerAccountPage />} />
        <Route
          path="/about/:slug/:token"
          element={<CustomerAboutRestaurant />}
        />
        <Route
          path="/settings/:slug/:token"
          element={<CustomerSettingsPage />}
        />
        <Route path="/privacy/:slug/:token" element={<CustomerPrivacyPage />} />
        <Route
          path="/credit-apply/:slug/:token"
          element={<CustomerCreditApply />}
        />
        <Route
          path="/subscription/payment/esewa/success"
          element={<SubscriptionPaymentCallback gateway="esewa" />}
        />
        <Route
          path="/subscription/payment/esewa/failure"
          element={<SubscriptionPaymentCallback gateway="esewa" failed />}
        />
        <Route
          path="/subscription/payment/khalti/callback"
          element={<SubscriptionPaymentCallback gateway="khalti" />}
        />
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
            ) : user?.scope === "branch_user" && user?.branchSlug ? (
              <Navigate to={defaultPortalPathForUser(user)} replace />
            ) : isEmployeeUser &&
              userSlug != null &&
              userRestaurantId != null ? (
              <Navigate to={defaultPortalPathForUser(user)} replace />
            ) : (user.role === "super_admin" || user.role === "admin") &&
              user.scope !== "employee" ? (
              <Navigate to="/platform/dashboard" />
            ) : user.role === "restaurant" &&
              userSlug != null &&
              userRestaurantId != null ? (
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
                <h1 className="text-4xl font-semibold text-gray-900 dark:text-gray-100">
                  404
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2">
                  Page not found
                </p>
              </div>
            </div>
          }
        />
      </Routes>
    </>
  );
}

export default App;
