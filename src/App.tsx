import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppProvider } from './lib/store';
import { CustomerLayout, PortalLayout } from './components/layout';
import {
  CategoriesPage, CategoryPage, DealsPage, HomePage, ProductPage, SearchPage, VendorStorePage,
} from './routes/customer';
import {
  AccountAddresses, AccountCoupons, AccountLayout, AccountNotifications, AccountOverview,
  AccountPayments, AccountPreferences, AccountReturns, AccountReviews, AccountSecurity, CartPage,
  CheckoutPage, ContactSupportPage, HelpPage, OrderConfirmedPage, OrderDetailPage, OrdersPage,
  WishlistPage,
} from './routes/shop';
import { AdminDashboard, VendorDashboard } from './routes/portal';
import {
  VendorAnalytics, VendorCustomers, VendorInventory, VendorOnboarding, VendorOrders,
  VendorProductForm, VendorProducts, VendorPromotions, VendorPayouts, VendorReviews, VendorSettings,
  VendorStorePage as VendorStoreSettings,
} from './routes/vendorPages';
import {
  AdminAnalytics, AdminAudit, AdminCategories, AdminCommissions, AdminCustomers, AdminDisputes,
  AdminOrders, AdminPayments, AdminPayouts, AdminProducts, AdminPromotions, AdminReturns,
  AdminSettings, AdminShipping, AdminSupport, AdminVendorDetail, AdminVendors,
} from './routes/adminPages';
import { Button, EmptyState, Panel } from './components/ui';

function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <Panel>
        <EmptyState
          title="Page not found"
          body="This route does not exist. Use the navigation to get back to the marketplace, vendor portal or admin console."
          action={<Button variant="primary" to="/">Back to marketplace</Button>}
          secondary={<Button to="/admin">Admin console</Button>}
        />
      </Panel>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          {/* ── Customer marketplace ── */}
          <Route element={<CustomerLayout />}>
            <Route index element={<HomePage />} />
            <Route path="categories" element={<CategoriesPage />} />
            <Route path="c/:slug" element={<CategoryPage />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="deals" element={<DealsPage />} />
            <Route path="p/:slug" element={<ProductPage />} />
            <Route path="store/:slug" element={<VendorStorePage />} />
            <Route path="cart" element={<CartPage />} />
            <Route path="checkout" element={<CheckoutPage />} />
            <Route path="order-confirmed/:id" element={<OrderConfirmedPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="orders/:id" element={<OrderDetailPage />} />
            <Route path="wishlist" element={<WishlistPage />} />
            <Route path="help" element={<HelpPage />} />
            <Route path="help/contact" element={<ContactSupportPage />} />
            <Route path="account" element={<AccountLayout />}>
              <Route index element={<AccountOverview />} />
              <Route path="returns" element={<AccountReturns />} />
              <Route path="addresses" element={<AccountAddresses />} />
              <Route path="payments" element={<AccountPayments />} />
              <Route path="reviews" element={<AccountReviews />} />
              <Route path="coupons" element={<AccountCoupons />} />
              <Route path="notifications" element={<AccountNotifications />} />
              <Route path="security" element={<AccountSecurity />} />
              <Route path="preferences" element={<AccountPreferences />} />
            </Route>
          </Route>

          {/* ── Vendor portal ── */}
          <Route path="/vendor" element={<PortalLayout kind="vendor" />}>
            <Route index element={<VendorDashboard />} />
            <Route path="products" element={<VendorProducts />} />
            <Route path="products/new" element={<VendorProductForm />} />
            <Route path="products/:id" element={<VendorProductForm />} />
            <Route path="inventory" element={<VendorInventory />} />
            <Route path="orders" element={<VendorOrders />} />
            <Route path="customers" element={<VendorCustomers />} />
            <Route path="reviews" element={<VendorReviews />} />
            <Route path="promotions" element={<VendorPromotions />} />
            <Route path="payouts" element={<VendorPayouts />} />
            <Route path="analytics" element={<VendorAnalytics />} />
            <Route path="store" element={<VendorStoreSettings />} />
            <Route path="settings" element={<VendorSettings />} />
            <Route path="onboarding" element={<VendorOnboarding />} />
          </Route>

          {/* ── Admin console ── */}
          <Route path="/admin" element={<PortalLayout kind="admin" />}>
            <Route index element={<AdminDashboard />} />
            <Route path="vendors" element={<AdminVendors />} />
            <Route path="vendors/:id" element={<AdminVendorDetail />} />
            <Route path="customers" element={<AdminCustomers />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="returns" element={<AdminReturns />} />
            <Route path="shipping" element={<AdminShipping />} />
            <Route path="payments" element={<AdminPayments />} />
            <Route path="payouts" element={<AdminPayouts />} />
            <Route path="commissions" element={<AdminCommissions />} />
            <Route path="promotions" element={<AdminPromotions />} />
            <Route path="disputes" element={<AdminDisputes />} />
            <Route path="support" element={<AdminSupport />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="audit" element={<AdminAudit />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
