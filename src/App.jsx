import React, { Suspense, lazy, useEffect } from "react";
import { BrowserRouter, Navigate, Routes, Route, useLocation } from "react-router-dom";
import { WalletProvider } from "./wallet/WalletProvider";
import PaymentWatcher from "./lib/PaymentWatcher";
import Toast from "./components/Toast";
import { startSync } from "./lib/store";
import { CREDITS_ENABLED } from "./lib/config";
import Home from "./pages/Home";
import Products from "./pages/Products";
import Product from "./pages/Product";
import Services from "./pages/Services";
import Gig from "./pages/Gig";
import Seller from "./pages/Seller";
import Credits from "./pages/Credits";
import Wallet from "./pages/Wallet";
import Checkout from "./pages/Checkout";
import Payment from "./pages/Payment";
import Library from "./pages/Library";
import Orders from "./pages/Orders";
import Order from "./pages/Order";
import Search from "./pages/Search";
import Info from "./pages/Info";
import NotFound from "./pages/NotFound";

// Selling and admin screens load on demand; most visitors only shop.
const Onboarding = lazy(() => import("./pages/Onboarding"));
const SellerCenter = lazy(() => import("./pages/SellerCenter"));
const CreateProduct = lazy(() => import("./pages/CreateListing").then((m) => ({ default: m.CreateProduct })));
const CreateService = lazy(() => import("./pages/CreateListing").then((m) => ({ default: m.CreateService })));
const Admin = lazy(() => import("./pages/Admin"));

function ScrollToTop() {
  const { pathname } = useLocation();
  // Braces matter: newer browsers return a Promise from scrollTo, which React
  // would try to call as the effect's cleanup.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

// The routes, without a router, so tests can render them in a MemoryRouter.
export function AppRoutes() {
  return (
    <WalletProvider>
      <ScrollToTop />
      <PaymentWatcher />
      <Toast />
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<Product />} />
          <Route path="/services" element={<Services />} />
          <Route path="/services/:id" element={<Gig />} />
          <Route path="/sellers/:id" element={<Seller />} />
          <Route path="/credits" element={CREDITS_ENABLED ? <Credits /> : <Navigate to="/wallet" replace />} />
          <Route path="/wallet" element={<Wallet />} />
          <Route path="/checkout/:orderId" element={<Checkout />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/orders/:orderId" element={<Order />} />
          <Route path="/orders/:orderId/payment" element={<Payment />} />
          <Route path="/library" element={<Library />} />
          <Route path="/sell" element={<Onboarding />} />
          <Route path="/seller" element={<SellerCenter />} />
          <Route path="/seller/new-product" element={<CreateProduct />} />
          <Route path="/seller/new-service" element={<CreateService />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/help" element={<Info page="help" />} />
          <Route path="/terms/:slug" element={<Info />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </WalletProvider>
  );
}

export default function App() {
  useEffect(() => { startSync().catch((e) => console.error("AlkeShop: couldn't load the shop", e)); }, []);
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
