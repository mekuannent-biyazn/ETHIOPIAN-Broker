import React, { Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { OrderProvider } from "./context/OrderContext";
import { NotificationProvider } from "./context/NotificationContext";
import { NotificationSystemProvider } from "./context/NotificationSystemContext";
import { CommunicationProvider } from "./context/CommunicationContext";
import "./i18n/i18n";
import "./App.css";

// Components
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import Loader from "./components/Loader";

// Layouts
import AdminLayout from "./layouts/AdminLayout";
import BrokerLayout from "./layouts/BrokerLayout";
import ClientLayout from "./layouts/ClientLayout";

// Pages
import Home from "./pages/client/Home";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import VerifyEmail from "./pages/auth/VerifyEmail";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import About from "./pages/About";
import Services from "./pages/Services";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";

// Communication Pages
import Communication from "./components/Communication/Communication";

// Admin Pages
import Dashboard from "./pages/admin/Dashboard";
import ManageUsers from "./pages/admin/ManageUsers";
import ManageProperties from "./pages/admin/ManageProperties";
import ManualVerification from "./pages/admin/ManualVerification";
import ContactMessages from "./pages/admin/ContactMessages";

// Broker Pages
import BrokerDashboard from "./pages/broker/BrokerDashboard";
import BrokerProperties from "./pages/broker/BrokerProperties";
import BrokerCommissions from "./pages/broker/BrokerCommissions";

// Client Pages
import ClientDashboard from "./pages/client/ClientDashboard";
import Profile from "./pages/client/Profile";
import Properties from "./pages/client/Properties";
import PropertyDetails from "./pages/client/PropertyDetails";
import CreateProperty from "./pages/client/CreateProperty";
import MyProperties from "./pages/client/MyProperties";
import EditProperty from "./pages/client/EditProperty";
import PaymentSuccess from "./pages/client/PaymentSuccess";
import PaymentError from "./pages/client/PaymentError";
import PaymentPending from "./pages/client/PaymentPending";
import PaymentHistory from "./pages/client/PaymentHistory";
import PaymentVerify from "./pages/client/PaymentVerify";
import ManualVerificationPage from "./pages/client/ManualVerification";
import BrokerProfile from "./pages/broker/BrokerProfile";
import TermsAndConditions from "./pages/auth/TermsAndConditions";

function App() {
  return (
    <Suspense fallback={<Loader />}>
      <AuthProvider>
        <NotificationProvider>
          <NotificationSystemProvider>
            <OrderProvider>
              <CommunicationProvider>
                <Router>
                  <div className="App min-h-screen flex flex-col">
                    <Navbar />
                    <main className="flex-grow">
                      <Routes>
                        {/* Public Routes */}
                        <Route path="/" element={<Home />} />
                        <Route path="/properties" element={<Properties />} />
                        <Route
                          path="/property/:id"
                          element={<PropertyDetails />}
                        />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/verify-email" element={<VerifyEmail />} />
                        <Route path="/terms" element={<TermsAndConditions />} />
                        <Route
                          path="/forgot-password"
                          element={<ForgotPassword />}
                        />
                        <Route
                          path="/reset-password"
                          element={<ResetPassword />}
                        />
                        <Route path="/about" element={<About />} />
                        <Route path="/services" element={<Services />} />
                        <Route path="/contact" element={<Contact />} />

                        {/* Protected Routes with Layouts */}

                        {/* Admin Routes */}
                        <Route
                          path="/admin"
                          element={
                            <ProtectedRoute allowedRoles={["admin"]}>
                              <AdminLayout />
                            </ProtectedRoute>
                          }
                        >
                          <Route index element={<Dashboard />} />
                          <Route path="users" element={<ManageUsers />} />
                          <Route
                            path="properties"
                            element={<ManageProperties />}
                          />
                          <Route
                            path="manual-verification"
                            element={<ManualVerification />}
                          />
                          <Route
                            path="contact-messages"
                            element={<ContactMessages />}
                          />
                          <Route
                            path="communication"
                            element={<Communication />}
                          />
                          <Route
                            path="communication/:userId"
                            element={<Communication />}
                          />
                        </Route>

                        {/* Broker Routes */}
                        <Route
                          path="/broker"
                          element={
                            <ProtectedRoute allowedRoles={["broker"]}>
                              <BrokerLayout />
                            </ProtectedRoute>
                          }
                        >
                          <Route
                            index
                            element={
                              <Navigate to="/broker/dashboard" replace />
                            }
                          />
                          <Route
                            path="dashboard"
                            element={<BrokerDashboard />}
                          />
                          <Route
                            path="properties"
                            element={<BrokerProperties />}
                          />
                          <Route
                            path="commissions"
                            element={<BrokerCommissions />}
                          />
                          <Route path="profile" element={<BrokerProfile />} />
                          <Route
                            path="communication"
                            element={<Communication />}
                          />
                          <Route
                            path="communication/:userId"
                            element={<Communication />}
                          />
                        </Route>

                        {/* Client Routes */}
                        <Route
                          path="/client"
                          element={
                            <ProtectedRoute
                              allowedRoles={["client", "buyer", "tenant"]}
                            >
                              <ClientLayout />
                            </ProtectedRoute>
                          }
                        >
                          <Route index element={<ClientDashboard />} />
                          <Route path="profile" element={<Profile />} />
                          <Route
                            path="my-properties"
                            element={<MyProperties />}
                          />
                          <Route
                            path="create-property"
                            element={<CreateProperty />}
                          />
                          <Route
                            path="edit-property/:id"
                            element={<EditProperty />}
                          />
                          <Route
                            path="orders"
                            element={<Navigate to="/payment-history" replace />}
                          />
                          <Route
                            path="communication"
                            element={<Communication />}
                          />
                          <Route
                            path="communication/:userId"
                            element={<Communication />}
                          />
                        </Route>

                        {/* Global Communication Route */}
                        <Route
                          path="/communication"
                          element={
                            <ProtectedRoute
                              allowedRoles={[
                                "admin",
                                "broker",
                                "client",
                                "buyer",
                                "tenant",
                              ]}
                            >
                              <Communication />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/communication/:userId"
                          element={
                            <ProtectedRoute
                              allowedRoles={[
                                "admin",
                                "broker",
                                "client",
                                "buyer",
                                "tenant",
                              ]}
                            >
                              <Communication />
                            </ProtectedRoute>
                          }
                        />

                        {/* Redirects for better UX */}
                        <Route
                          path="/edit-property/:id"
                          element={
                            <Navigate to="/client/edit-property/:id" replace />
                          }
                        />
                        <Route
                          path="/payment/success"
                          element={<PaymentSuccess />}
                        />
                        <Route
                          path="/payment/verify"
                          element={<PaymentVerify />}
                        />
                        <Route
                          path="/payment/error"
                          element={<PaymentError />}
                        />
                        <Route
                          path="/payment/pending"
                          element={<PaymentPending />}
                        />
                        <Route
                          path="/payment-history"
                          element={<PaymentHistory />}
                        />
                        <Route
                          path="/properties/:propertyId/verify"
                          element={<ManualVerificationPage />}
                        />

                        {/* Direct broker route redirects */}
                        <Route
                          path="/broker-dashboard"
                          element={<Navigate to="/broker/dashboard" replace />}
                        />
                        <Route
                          path="/broker-properties"
                          element={<Navigate to="/broker/properties" replace />}
                        />
                        <Route
                          path="/broker-commissions"
                          element={
                            <Navigate to="/broker/commissions" replace />
                          }
                        />

                        {/* 404 Route */}
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </main>
                    <Footer />
                  </div>
                </Router>
              </CommunicationProvider>
            </OrderProvider>
          </NotificationSystemProvider>
        </NotificationProvider>
      </AuthProvider>
    </Suspense>
  );
}

export default App;
