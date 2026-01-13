// import React, { useState, useEffect } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import { useAuth } from "../../context/AuthContext";
// import { useTranslation } from "react-i18next";
// import axios from "../../api/axios";

// const ClientDashboard = () => {
//   const [properties, setProperties] = useState([]);
//   const [myProperties, setMyProperties] = useState([]);
//   const [orderedProperties, setOrderedProperties] = useState([]);
//   const [pendingPayments, setPendingPayments] = useState([]);
//   const [ownerEarnings, setOwnerEarnings] = useState(null);
//   const [allProperties, setAllProperties] = useState([]);
//   const [paymentSummary, setPaymentSummary] = useState({
//     totalSpent: 0,
//     propertiesPurchased: 0,
//     averagePayment: 0,
//     totalTransactions: 0,
//     successRate: 0,
//   });
//   const [stats, setStats] = useState({
//     totalProperties: 0,
//     availableProperties: 0,
//     myPropertiesCount: 0,
//     orderedProperties: 0,
//     pendingPaymentsCount: 0,
//     soldProperties: 0,
//   });
//   const [loading, setLoading] = useState(true);
//   const [activeTab, setActiveTab] = useState("browse");
//   const [searchTerm, setSearchTerm] = useState("");
//   const [processingPayments, setProcessingPayments] = useState({});
//   const { user } = useAuth();
//   const navigate = useNavigate();
//   const { t } = useTranslation();

//   useEffect(() => {
//     fetchDashboardData();
//   }, [activeTab]);

//   const fetchDashboardData = async () => {
//     try {
//       setLoading(true);

//       // Fetch ALL properties for total count - ENHANCED
//       let allPropsData = [];
//       try {
//         const allPropsResponse = await axios.get("/api/property?limit=1000");
//         console.log("All properties API response:", allPropsResponse.data);

//         // Handle different API response structures
//         if (Array.isArray(allPropsResponse.data)) {
//           allPropsData = allPropsResponse.data;
//         } else if (Array.isArray(allPropsResponse.data?.properties)) {
//           allPropsData = allPropsResponse.data.properties;
//         } else if (Array.isArray(allPropsResponse.data?.data?.properties)) {
//           allPropsData = allPropsResponse.data.data.properties;
//         } else if (Array.isArray(allPropsResponse.data?.data)) {
//           allPropsData = allPropsResponse.data.data;
//         } else if (
//           allPropsResponse.data?.properties &&
//           typeof allPropsResponse.data.properties === "object"
//         ) {
//           // If properties is an object, convert to array
//           allPropsData = Object.values(allPropsResponse.data.properties);
//         } else if (
//           allPropsResponse.data?.data &&
//           typeof allPropsResponse.data.data === "object"
//         ) {
//           // If data is an object, convert to array
//           allPropsData = Object.values(allPropsResponse.data.data);
//         } else {
//           // Last resort: try to extract any array from the response
//           const findArray = (obj) => {
//             for (let key in obj) {
//               if (Array.isArray(obj[key])) {
//                 return obj[key];
//               }
//               if (typeof obj[key] === "object" && obj[key] !== null) {
//                 const found = findArray(obj[key]);
//                 if (found) return found;
//               }
//             }
//             return [];
//           };
//           allPropsData = findArray(allPropsResponse.data);
//         }

//         console.log("Extracted properties:", allPropsData.length, allPropsData);
//         setAllProperties(Array.isArray(allPropsData) ? allPropsData : []);
//       } catch (error) {
//         console.error("Error fetching all properties:", error);
//         setAllProperties([]);
//       }

//       // Fetch properties for browse tab
//       if (activeTab === "browse") {
//         try {
//           const response = await axios.get("/api/property?limit=8");
//           let propertiesData = response.data.properties || response.data;
//           if (!Array.isArray(propertiesData)) {
//             propertiesData = [];
//           }
//           setProperties(propertiesData);
//         } catch (error) {
//           console.error("Error fetching browse properties:", error);
//           setProperties([]);
//         }
//       }
//       // Fetch user's properties for myProperties tab
//       else if (activeTab === "myProperties") {
//         try {
//           const response = await axios.get("/api/property/my-properties");
//           let myPropertiesData = response.data.properties || response.data;
//           if (!Array.isArray(myPropertiesData)) {
//             myPropertiesData = [];
//           }
//           setMyProperties(myPropertiesData);
//         } catch (error) {
//           console.error("Error fetching my properties:", error);
//           setMyProperties([]);
//         }
//       }
//       // Fetch user's ordered properties
//       else if (activeTab === "ordered") {
//         try {
//           const response = await axios.get("/api/property/user/orders");
//           let orderedData =
//             response.data.data?.properties ||
//             response.data.properties ||
//             response.data ||
//             [];
//           if (!Array.isArray(orderedData)) {
//             orderedData = [];
//           }
//           setOrderedProperties(orderedData);
//         } catch (error) {
//           console.error("Error fetching ordered properties:", error);
//           setOrderedProperties([]);
//         }
//       }
//       // Fetch pending payments
//       else if (activeTab === "payments") {
//         try {
//           const response = await axios.get(
//             "/api/property/user/pending-payments"
//           );
//           let pendingData =
//             response.data.data?.properties ||
//             response.data.properties ||
//             response.data ||
//             [];
//           if (!Array.isArray(pendingData)) {
//             pendingData = [];
//           }
//           setPendingPayments(pendingData);
//         } catch (error) {
//           console.error("Error fetching pending payments:", error);
//           setPendingPayments([]);
//         }
//       }
//       // Fetch owner earnings
//       else if (activeTab === "earnings") {
//         await fetchOwnerEarnings();
//       }

//       // Fetch all stats and payment summary - PASS allPropsData directly to avoid race condition
//       await fetchStats(allPropsData);
//       await fetchPaymentSummary();
//     } catch (error) {
//       console.error("Error fetching dashboard data:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // UPDATED: Accept allPropertiesData as parameter to avoid race condition
//   const fetchStats = async (allPropertiesData = null) => {
//     try {
//       // Use passed data or fall back to state
//       const propertiesData = allPropertiesData || allProperties;
//       console.log("Current properties for stats:", propertiesData);

//       // Calculate total properties - ALL properties regardless of status
//       const totalPropertiesCount = Array.isArray(propertiesData)
//         ? propertiesData.length
//         : 0;

//       // Calculate available properties - ONLY properties with "Available" status
//       const totalAvailable = Array.isArray(propertiesData)
//         ? propertiesData.filter((property) => property.status === "Available")
//             .length
//         : 0;

//       // Fetch user's ordered properties for count
//       let orderedProps = [];
//       try {
//         const orderedResponse = await axios.get("/api/property/user/orders");
//         let orderedData =
//           orderedResponse.data.data?.properties ||
//           orderedResponse.data.properties ||
//           orderedResponse.data ||
//           [];
//         if (!Array.isArray(orderedData)) {
//           orderedData = [];
//         }
//         orderedProps = orderedData;
//       } catch (error) {
//         console.error("Error fetching ordered properties for stats:", error);
//       }

//       // Fetch user's properties for count
//       let myProps = [];
//       try {
//         const myPropsResponse = await axios.get("/api/property/my-properties");
//         let myPropsData =
//           myPropsResponse.data.properties || myPropsResponse.data || [];
//         if (!Array.isArray(myPropsData)) {
//           myPropsData = [];
//         }
//         myProps = myPropsData;
//       } catch (error) {
//         console.error("Error fetching my properties for stats:", error);
//       }

//       // Fetch pending payments
//       let pendingData = [];
//       try {
//         const pendingResponse = await axios.get(
//           "/api/property/user/pending-payments"
//         );
//         let pendingPaymentsData =
//           pendingResponse.data.data?.properties ||
//           pendingResponse.data.properties ||
//           pendingResponse.data ||
//           [];
//         if (!Array.isArray(pendingPaymentsData)) {
//           pendingPaymentsData = [];
//         }
//         pendingData = pendingPaymentsData;
//       } catch (error) {
//         console.error("Error fetching pending payments for stats:", error);
//       }

//       // Calculate sold/rented properties from user's properties
//       const soldPropertiesCount = Array.isArray(myProps)
//         ? myProps.filter(
//             (property) =>
//               property.status === "Sold" || property.status === "Rented"
//           ).length
//         : 0;

//       const newStats = {
//         totalProperties: totalPropertiesCount,
//         availableProperties: totalAvailable, // Now correctly shows only "Available" status
//         myPropertiesCount: myProps.length,
//         orderedProperties: orderedProps.length,
//         pendingPaymentsCount: pendingData.length,
//         soldProperties: soldPropertiesCount,
//       };

//       console.log("Setting stats:", newStats);
//       setStats(newStats);
//     } catch (error) {
//       console.error("Error fetching stats:", error);
//     }
//   };

//   const fetchPaymentSummary = async () => {
//     try {
//       const response = await axios.get("/api/payments/client/summary");
//       if (response.data.success) {
//         setPaymentSummary(response.data.data.summary || {});
//       }
//     } catch (error) {
//       console.error("Error fetching payment summary:", error);
//     }
//   };

//   // Enhanced owner earnings calculation
//   const fetchOwnerEarnings = async () => {
//     try {
//       const response = await axios.get("/api/payments/owner/earnings");
//       if (response.data.success) {
//         const earningsData = response.data.data;
//         const enhancedEarnings = calculateEnhancedEarnings(earningsData);
//         setOwnerEarnings(enhancedEarnings);
//       }
//     } catch (error) {
//       console.error("Error fetching owner earnings:", error);
//       setOwnerEarnings(null);
//     }
//   };

//   // Function to calculate proper commission and earnings
//   const calculateEnhancedEarnings = (earningsData) => {
//     if (!earningsData) return null;

//     const enhancedProperties = earningsData.properties.map((property) => {
//       const commissionRate = 0.02;
//       const commission = property.price * commissionRate;
//       const netEarnings = property.price - commission;

//       return {
//         ...property,
//         totalCommissionReceived: commission,
//         netAmountReceived: netEarnings,
//         commissionRate: commissionRate,
//       };
//     });

//     const totalEarnings = enhancedProperties.reduce(
//       (sum, prop) => sum + prop.price,
//       0
//     );
//     const totalCommission = enhancedProperties.reduce(
//       (sum, prop) => sum + prop.totalCommissionReceived,
//       0
//     );
//     const netEarnings = totalEarnings - totalCommission;

//     return {
//       ...earningsData,
//       properties: enhancedProperties,
//       earningsSummary: {
//         ...earningsData.earningsSummary,
//         totalEarnings: totalEarnings,
//         totalCommissionPaid: totalCommission,
//         netEarnings: netEarnings,
//         totalPropertiesSoldRented: enhancedProperties.length,
//       },
//     };
//   };

//   const handleSearch = (e) => {
//     e.preventDefault();
//     if (searchTerm.trim()) {
//       navigate(`/properties?search=${encodeURIComponent(searchTerm)}`);
//     }
//   };

//   const handleQuickOrder = async (propertyId, e) => {
//     e.preventDefault();
//     e.stopPropagation();

//     if (!user) {
//       navigate("/login");
//       return;
//     }

//     try {
//       const orderResponse = await axios.post(
//         `/api/property/${propertyId}/order`
//       );

//       if (orderResponse.data.success) {
//         alert(t("client.orderPlacedSuccess"));
//         await handleCompletePayment(propertyId);
//       }
//     } catch (error) {
//       console.error("Error ordering property:", error);
//       alert(error.response?.data?.message || t("client.orderError"));
//     }
//   };

//   const handleCompletePayment = async (
//     propertyId,
//     paymentType = "full_payment"
//   ) => {
//     try {
//       setProcessingPayments((prev) => ({ ...prev, [propertyId]: true }));

//       const paymentResponse = await axios.post("/api/payments/initialize", {
//         propertyId: propertyId,
//         paymentType: paymentType,
//       });

//       if (paymentResponse.data.success) {
//         window.location.href = paymentResponse.data.data.paymentUrl;
//       } else {
//         throw new Error(
//           paymentResponse.data.message || t("client.paymentInitFailed")
//         );
//       }
//     } catch (error) {
//       console.error("❌ Payment initialization error:", error);
//       let errorMessage = t("client.paymentInitFailed");
//       if (error.response?.data?.message) {
//         errorMessage = error.response.data.message;
//       } else if (error.message.includes("Network Error")) {
//         errorMessage = t("client.networkError");
//       } else if (error.response?.data?.error) {
//         errorMessage = error.response.data.error;
//       }
//       alert(errorMessage);
//     } finally {
//       setProcessingPayments((prev) => ({ ...prev, [propertyId]: false }));
//     }
//   };

//   const handlePayWithExistingUrl = (paymentUrl) => {
//     if (paymentUrl) {
//       window.location.href = paymentUrl;
//     } else {
//       alert(t("client.paymentUrlNotAvailable"));
//     }
//   };

//   const canCompletePayment = (property) => {
//     return (
//       property.status === "Ordered" &&
//       (property.orderInfo?.paymentStatus === "Pending" ||
//         property.paymentStatus === "Pending" ||
//         property.paymentInfo?.paymentStatus === "Pending")
//     );
//   };

//   const formatPrice = (price) => {
//     if (!price) return "ETB 0";
//     return new Intl.NumberFormat("en-ET", {
//       style: "currency",
//       currency: "ETB",
//     }).format(price);
//   };

//   const getStatusBadgeColor = (status, paymentStatus) => {
//     switch (status) {
//       case "Available":
//         return "bg-green-100 text-green-800 border border-green-200";
//       case "Pending":
//         return "bg-yellow-100 text-yellow-800 border border-yellow-200";
//       case "Ordered":
//         if (paymentStatus === "Pending" || paymentStatus === "pending") {
//           return "bg-blue-100 text-blue-800 border border-blue-200";
//         } else if (
//           paymentStatus === "Completed" ||
//           paymentStatus === "completed"
//         ) {
//           return "bg-green-100 text-green-800 border border-green-200";
//         } else {
//           return "bg-purple-100 text-purple-800 border border-purple-200";
//         }
//       case "Sold":
//       case "Rented":
//         return "bg-red-100 text-red-800 border border-red-200";
//       default:
//         return "bg-gray-100 text-gray-800 border border-gray-200";
//     }
//   };

//   const getStatusText = (property) => {
//     if (property.status === "Ordered") {
//       const paymentStatus =
//         property.paymentInfo?.paymentStatus ||
//         property.orderInfo?.paymentStatus ||
//         property.paymentStatus;
//       if (paymentStatus === "Completed" || paymentStatus === "completed") {
//         return t("client.orderedPaymentCompleted");
//       } else if (paymentStatus === "Pending" || paymentStatus === "pending") {
//         return t("client.orderedPaymentPending");
//       }
//       return t("client.ordered");
//     }
//     return t(`client.${property.status.toLowerCase()}`) || property.status;
//   };

//   const canOrderProperty = (property) => {
//     if (!user) return false;
//     if (property.owner?._id === user._id) return false;
//     if (["admin", "broker"].includes(user?.role)) return false;

//     return (
//       property.status === "Available" ||
//       (property.status === "Ordered" &&
//         (property.orderInfo?.paymentStatus === "Pending" ||
//           property.paymentStatus === "Pending"))
//     );
//   };

//   const PropertyCard = ({
//     property,
//     showStatus = false,
//     showOrderInfo = false,
//     showPaymentButton = false,
//   }) => {
//     const canOrder = canOrderProperty(property);
//     const isProcessing = processingPayments[property._id];
//     const hasPendingPayment = canCompletePayment(property);
//     const hasExistingPaymentUrl = property.paymentInfo?.paymentUrl;
//     const isPaymentCompleted =
//       property.paymentInfo?.paymentStatus === "Completed" ||
//       property.orderInfo?.paymentStatus === "Completed" ||
//       property.paymentStatus === "Completed";

//     return (
//       <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100">
//         <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200">
//           {property.images && property.images.length > 0 ? (
//             <img
//               src={property.images[0]}
//               alt={property.title}
//               className="w-full h-full object-cover"
//             />
//           ) : (
//             <div className="w-full h-full flex items-center justify-center text-gray-400">
//               <span className="text-5xl">
//                 {property.propertyType === "Home"
//                   ? "🏠"
//                   : property.propertyType === "Car"
//                   ? "🚗"
//                   : "💻"}
//               </span>
//             </div>
//           )}

//           <div className="absolute top-3 left-3 flex flex-col space-y-2">
//             <span
//               className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(
//                 property.status,
//                 property.paymentInfo?.paymentStatus ||
//                   property.orderInfo?.paymentStatus
//               )}`}
//             >
//               {getStatusText(property)}
//             </span>
//             {showStatus && property.approvedByAdmin && (
//               <span className="px-2 py-1 bg-green-500 text-white rounded-full text-xs font-medium">
//                 ✓ {t("client.approved")}
//               </span>
//             )}
//             {showOrderInfo && property.orderInfo && (
//               <span
//                 className={`px-2 py-1 rounded-full text-xs font-medium ${
//                   isPaymentCompleted
//                     ? "bg-green-500 text-white"
//                     : "bg-yellow-500 text-white"
//                 }`}
//               >
//                 {isPaymentCompleted
//                   ? `✓ ${t("client.paid")}`
//                   : `⏳ ${t("client.paymentPending")}`}
//               </span>
//             )}
//           </div>

//           <div className="absolute top-3 right-3">
//             <span className="px-3 py-1 bg-white bg-opacity-90 text-gray-700 rounded-full text-xs font-semibold border">
//               {property.propertyType}
//             </span>
//           </div>

//           <div className="absolute bottom-3 left-3">
//             <span
//               className={`px-3 py-1 rounded-full text-xs font-semibold ${
//                 property.purpose === "Sell"
//                   ? "bg-orange-100 text-orange-800 border border-orange-200"
//                   : "bg-blue-100 text-blue-800 border border-blue-200"
//               }`}
//             >
//               {t("client.for")} {property.purpose}
//             </span>
//           </div>
//         </div>

//         <div className="p-5">
//           <h3 className="font-bold text-gray-900 mb-2 line-clamp-1 text-lg">
//             {property.title}
//           </h3>
//           <p className="text-gray-600 text-sm mb-3 line-clamp-2 leading-relaxed">
//             {property.description}
//           </p>

//           <div className="flex items-center justify-between mb-3">
//             <span className="text-xl font-bold text-blue-600">
//               {formatPrice(property.price)}
//             </span>
//             <div className="flex items-center text-sm text-gray-500">
//               <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
//               {property.city}
//             </div>
//           </div>

//           {property.propertyType === "Home" && property.homeDetails && (
//             <div className="flex items-center justify-between text-xs text-gray-500 mb-4 bg-gray-50 p-2 rounded-lg">
//               <span className="flex items-center">
//                 🛏️ {property.homeDetails.bedrooms}
//               </span>
//               <span className="flex items-center">
//                 🛁 {property.homeDetails.bathrooms}
//               </span>
//               <span className="flex items-center">
//                 📏 {property.homeDetails.size} sqft
//               </span>
//             </div>
//           )}

//           {property.propertyType === "Car" && property.carDetails && (
//             <div className="flex items-center justify-between text-xs text-gray-500 mb-4 bg-gray-50 p-2 rounded-lg">
//               <span className="flex items-center">
//                 🚗 {property.carDetails.brand}
//               </span>
//               <span className="flex items-center">
//                 📊 {property.carDetails.model}
//               </span>
//               <span className="flex items-center">
//                 🎯 {property.carDetails.year}
//               </span>
//             </div>
//           )}

//           <div className="flex space-x-2">
//             <Link
//               to={`/property/${property._id}`}
//               className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-center py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg block"
//             >
//               {t("client.viewDetails")}
//             </Link>

//             {(showPaymentButton || hasPendingPayment) &&
//               !isPaymentCompleted && (
//                 <div className="flex flex-col space-y-2 flex-1">
//                   {hasExistingPaymentUrl ? (
//                     <button
//                       onClick={() =>
//                         handlePayWithExistingUrl(
//                           property.paymentInfo.paymentUrl
//                         )
//                       }
//                       className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white text-center py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
//                     >
//                       {t("client.completePayment")}
//                     </button>
//                   ) : (
//                     <button
//                       onClick={() => handleCompletePayment(property._id)}
//                       disabled={isProcessing}
//                       className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:bg-gray-400 text-white text-center py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
//                     >
//                       {isProcessing ? (
//                         <span className="flex items-center justify-center">
//                           <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
//                           {t("client.processing")}
//                         </span>
//                       ) : (
//                         t("client.completePayment")
//                       )}
//                     </button>
//                   )}
//                 </div>
//               )}

//             {!showPaymentButton && canOrder && !hasPendingPayment && (
//               <button
//                 onClick={(e) => handleQuickOrder(property._id, e)}
//                 className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white text-center py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
//               >
//                 {t("client.orderNow")}
//               </button>
//             )}
//           </div>

//           {property.orderInfo && (
//             <div className="mt-3 text-xs text-gray-500">
//               {t("client.orderedOn")}:{" "}
//               {new Date(property.orderInfo.orderDate).toLocaleDateString()}
//             </div>
//           )}

//           {(property.paymentInfo || property.orderInfo) && (
//             <div className="mt-2 text-xs">
//               {isPaymentCompleted ? (
//                 <span className="text-green-600">
//                   ✅ {t("client.paymentCompletedOn")}{" "}
//                   {new Date(
//                     property.paymentInfo?.paymentDate ||
//                       property.orderInfo?.paymentDate ||
//                       new Date()
//                   ).toLocaleDateString()}
//                 </span>
//               ) : (
//                 <span className="text-yellow-600">
//                   ⏳ {t("client.paymentPendingMessage")}
//                 </span>
//               )}
//             </div>
//           )}
//         </div>
//       </div>
//     );
//   };

//   const PendingPaymentCard = ({ property }) => {
//     const payment =
//       property.pendingPayment || property.paymentInfo || property.orderInfo;
//     const isProcessing = processingPayments[property._id];
//     const hasExistingPaymentUrl = payment?.paymentUrl;

//     return (
//       <div className="bg-white rounded-xl shadow-lg border border-yellow-200 p-6">
//         <div className="flex flex-col md:flex-row md:items-center justify-between">
//           <div className="flex items-center space-x-4 mb-4 md:mb-0">
//             {property.images && property.images.length > 0 ? (
//               <img
//                 src={property.images[0]}
//                 alt={property.title}
//                 className="w-16 h-16 object-cover rounded-lg"
//               />
//             ) : (
//               <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
//                 <span className="text-2xl">
//                   {property.propertyType === "Home"
//                     ? "🏠"
//                     : property.propertyType === "Car"
//                     ? "🚗"
//                     : "💻"}
//                 </span>
//               </div>
//             )}
//             <div>
//               <h3 className="font-semibold text-gray-900">{property.title}</h3>
//               <p className="text-sm text-gray-600">
//                 {property.propertyType} • {property.purpose}
//               </p>
//               <p className="text-lg font-bold text-blue-600 mt-1">
//                 {formatPrice(payment?.amount || property.price)}
//               </p>
//               <p className="text-sm text-gray-500 mt-1">
//                 {t("client.status")}: {getStatusText(property)}
//               </p>
//             </div>
//           </div>

//           <div className="flex flex-col space-y-2">
//             <div className="text-sm text-gray-600">
//               <span className="font-medium">{t("client.dueDate")}:</span>{" "}
//               {payment?.dueDate
//                 ? new Date(payment.dueDate).toLocaleDateString()
//                 : "N/A"}
//             </div>

//             {hasExistingPaymentUrl ? (
//               <button
//                 onClick={() => handlePayWithExistingUrl(payment.paymentUrl)}
//                 className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold text-center transition duration-200"
//               >
//                 {t("client.completePayment")}
//               </button>
//             ) : (
//               <button
//                 onClick={() => handleCompletePayment(property._id)}
//                 disabled={isProcessing}
//                 className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-semibold text-center transition duration-200"
//               >
//                 {isProcessing ? (
//                   <span className="flex items-center justify-center">
//                     <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
//                     {t("client.processing")}
//                   </span>
//                 ) : (
//                   t("client.initializePayment")
//                 )}
//               </button>
//             )}
//           </div>
//         </div>
//       </div>
//     );
//   };

//   // Owner Earnings Tab Component
//   const OwnerEarningsTab = () => {
//     const [selectedProperty, setSelectedProperty] = useState(null);

//     if (!ownerEarnings) {
//       return (
//         <div className="text-center py-12">
//           <div className="text-gray-400 text-6xl mb-4">💰</div>
//           <h3 className="text-xl font-semibold text-gray-900 mb-2">
//             {t("client.noEarningsYet")}
//           </h3>
//           <p className="text-gray-600">{t("client.earningsWillAppear")}</p>
//         </div>
//       );
//     }

//     return (
//       <div className="space-y-6">
//         <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
//           <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
//             <div className="flex items-center">
//               <div className="p-3 bg-green-100 rounded-xl mr-4">
//                 <span className="text-2xl">💰</span>
//               </div>
//               <div>
//                 <p className="text-sm font-medium text-gray-600">
//                   {t("client.totalEarnings")}
//                 </p>
//                 <p className="text-2xl font-bold text-gray-900">
//                   {formatPrice(ownerEarnings.earningsSummary.totalEarnings)}
//                 </p>
//                 <p className="text-xs text-gray-500 mt-1">
//                   {t("client.grossAmountBeforeCommission")}
//                 </p>
//               </div>
//             </div>
//           </div>

//           <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
//             <div className="flex items-center">
//               <div className="p-3 bg-blue-100 rounded-xl mr-4">
//                 <span className="text-2xl">🏠</span>
//               </div>
//               <div>
//                 <p className="text-sm font-medium text-gray-600">
//                   {t("client.propertiesSoldRented")}
//                 </p>
//                 <p className="text-2xl font-bold text-gray-900">
//                   {ownerEarnings.earningsSummary.totalPropertiesSoldRented}
//                 </p>
//               </div>
//             </div>
//           </div>

//           <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
//             <div className="flex items-center">
//               <div className="p-3 bg-purple-100 rounded-xl mr-4">
//                 <span className="text-2xl">💸</span>
//               </div>
//               <div>
//                 <p className="text-sm font-medium text-gray-600">
//                   {t("client.commissionPaid")}
//                 </p>
//                 <p className="text-2xl font-bold text-gray-900">
//                   {formatPrice(
//                     ownerEarnings.earningsSummary.totalCommissionPaid
//                   )}
//                 </p>
//                 <p className="text-xs text-gray-500 mt-1">
//                   {t("client.platformCommission")}
//                 </p>
//               </div>
//             </div>
//           </div>

//           <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
//             <div className="flex items-center">
//               <div className="p-3 bg-orange-100 rounded-xl mr-4">
//                 <span className="text-2xl">📈</span>
//               </div>
//               <div>
//                 <p className="text-sm font-medium text-gray-600">
//                   {t("client.netEarnings")}
//                 </p>
//                 <p className="text-2xl font-bold text-gray-900">
//                   {formatPrice(ownerEarnings.earningsSummary.netEarnings)}
//                 </p>
//                 <p className="text-xs text-gray-500 mt-1">
//                   {t("client.afterCommissionDeduction")}
//                 </p>
//               </div>
//             </div>
//           </div>
//         </div>

//         <div className="bg-white rounded-xl shadow-lg p-6">
//           <h2 className="text-2xl font-bold text-gray-900 mb-6">
//             {t("client.soldRentedProperties")}
//           </h2>
//           {ownerEarnings.properties.length > 0 ? (
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//               {ownerEarnings.properties.map((property) => (
//                 <div
//                   key={property._id}
//                   className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition duration-300"
//                 >
//                   <div className="flex items-center justify-between mb-4">
//                     <h3 className="font-semibold text-gray-900">
//                       {property.title}
//                     </h3>
//                     <span
//                       className={`px-2 py-1 rounded-full text-xs font-medium ${
//                         property.status === "Sold"
//                           ? "bg-green-100 text-green-800"
//                           : "bg-purple-100 text-purple-800"
//                       }`}
//                     >
//                       {property.status}
//                     </span>
//                   </div>

//                   {property.images && property.images.length > 0 && (
//                     <img
//                       src={property.images[0]}
//                       alt={property.title}
//                       className="w-full h-32 object-cover rounded-lg mb-4"
//                     />
//                   )}

//                   <div className="space-y-2 mb-4">
//                     <div className="flex justify-between text-sm">
//                       <span className="text-gray-600">{t("client.type")}:</span>
//                       <span className="font-medium">
//                         {property.propertyType}
//                       </span>
//                     </div>
//                     <div className="flex justify-between text-sm">
//                       <span className="text-gray-600">
//                         {t("client.purpose")}:
//                       </span>
//                       <span className="font-medium">{property.purpose}</span>
//                     </div>
//                     <div className="flex justify-between text-sm">
//                       <span className="text-gray-600">
//                         {t("client.location")}:
//                       </span>
//                       <span className="font-medium">{property.city}</span>
//                     </div>
//                     <div className="flex justify-between text-sm">
//                       <span className="text-gray-600">
//                         {t("client.soldRentedDate")}:
//                       </span>
//                       <span className="font-medium">
//                         {new Date(property.soldRentedDate).toLocaleDateString()}
//                       </span>
//                     </div>
//                     <div className="flex justify-between text-sm">
//                       <span className="text-gray-600">
//                         {t("client.salePrice")}:
//                       </span>
//                       <span className="font-semibold">
//                         {formatPrice(property.price)}
//                       </span>
//                     </div>
//                     <div className="flex justify-between text-sm">
//                       <span className="text-gray-600">
//                         {t("client.commissionPaid")}:
//                       </span>
//                       <span className="font-semibold text-red-600">
//                         -{formatPrice(property.totalCommissionReceived)}
//                       </span>
//                     </div>
//                     <div className="flex justify-between text-sm font-bold border-t pt-2">
//                       <span>{t("client.netReceived")}:</span>
//                       <span className="text-green-600">
//                         {formatPrice(property.netAmountReceived)}
//                       </span>
//                     </div>
//                   </div>

//                   <button
//                     onClick={() => setSelectedProperty(property)}
//                     className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition duration-300"
//                   >
//                     {t("client.viewEarningsDetails")}
//                   </button>
//                 </div>
//               ))}
//             </div>
//           ) : (
//             <div className="text-center py-8">
//               <div className="text-gray-400 text-6xl mb-4">🏠</div>
//               <h3 className="text-lg font-medium text-gray-900 mb-2">
//                 {t("client.noPropertiesSoldRentedYet")}
//               </h3>
//               <p className="text-gray-600">
//                 {t("client.earningsWillAppearWhenSold")}
//               </p>
//             </div>
//           )}
//         </div>

//         {ownerEarnings.payments && ownerEarnings.payments.length > 0 && (
//           <div className="bg-white rounded-xl shadow-lg p-6">
//             <h2 className="text-2xl font-bold text-gray-900 mb-6">
//               {t("client.recentPayments")}
//             </h2>
//             <div className="space-y-4">
//               {ownerEarnings.payments.slice(0, 5).map((payment) => (
//                 <div
//                   key={payment._id}
//                   className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
//                 >
//                   <div className="flex items-center space-x-4">
//                     <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
//                       <span className="text-green-600 text-lg">💰</span>
//                     </div>
//                     <div>
//                       <h4 className="font-semibold text-gray-900">
//                         {payment.property?.title || t("client.propertyPayment")}
//                       </h4>
//                       <p className="text-sm text-gray-600">
//                         {payment.paymentType === "broker_commission"
//                           ? t("client.commissionPayment")
//                           : t("client.propertySale")}
//                       </p>
//                       <p className="text-xs text-gray-500">
//                         {new Date(payment.paymentDate).toLocaleDateString()}
//                       </p>
//                     </div>
//                   </div>
//                   <div className="text-right">
//                     <p
//                       className={`text-lg font-semibold ${
//                         payment.paymentType === "broker_commission"
//                           ? "text-green-600"
//                           : "text-blue-600"
//                       }`}
//                     >
//                       {formatPrice(payment.amount)}
//                     </p>
//                     <p className="text-sm text-gray-600 capitalize">
//                       {payment.paymentType.replace("_", " ")}
//                     </p>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>
//         )}

//         {/* UPDATED: Property Earnings Modal */}
//         {selectedProperty && (
//           <PropertyEarningsModal
//             property={selectedProperty}
//             onClose={() => setSelectedProperty(null)}
//           />
//         )}
//       </div>
//     );
//   };

//   // UPDATED: Property Earnings Modal Component with proper data display
//   const PropertyEarningsModal = ({ property, onClose }) => {
//     return (
//       <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
//         <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
//           <div className="p-6">
//             <div className="flex justify-between items-center mb-6">
//               <h2 className="text-2xl font-bold text-gray-900">
//                 {t("client.earningsDetails")} - {property.title}
//               </h2>
//               <button
//                 onClick={onClose}
//                 className="text-gray-400 hover:text-gray-600 text-2xl"
//               >
//                 ×
//               </button>
//             </div>

//             <div className="space-y-6">
//               {/* Property Information */}
//               <div className="bg-gray-50 p-6 rounded-lg">
//                 <h3 className="text-lg font-semibold text-gray-900 mb-4">
//                   {t("client.propertyInformation")}
//                 </h3>
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   <div>
//                     <p className="text-sm text-gray-600">
//                       {t("client.propertyTitle")}
//                     </p>
//                     <p className="font-semibold">{property.title}</p>
//                   </div>
//                   <div>
//                     <p className="text-sm text-gray-600">{t("client.type")}</p>
//                     <p className="font-semibold">{property.propertyType}</p>
//                   </div>
//                   <div>
//                     <p className="text-sm text-gray-600">
//                       {t("client.purpose")}
//                     </p>
//                     <p className="font-semibold">{property.purpose}</p>
//                   </div>
//                   <div>
//                     <p className="text-sm text-gray-600">
//                       {t("client.location")}
//                     </p>
//                     <p className="font-semibold">{property.city}</p>
//                   </div>
//                   <div>
//                     <p className="text-sm text-gray-600">
//                       {t("client.status")}
//                     </p>
//                     <p className="font-semibold">{property.status}</p>
//                   </div>
//                   <div>
//                     <p className="text-sm text-gray-600">
//                       {t("client.soldRentedDate")}
//                     </p>
//                     <p className="font-semibold">
//                       {new Date(property.soldRentedDate).toLocaleDateString()}
//                     </p>
//                   </div>
//                 </div>
//               </div>

//               {/* Financial Breakdown */}
//               <div className="bg-green-50 p-6 rounded-lg">
//                 <h3 className="text-lg font-semibold text-gray-900 mb-4">
//                   {t("client.financialBreakdown")}
//                 </h3>
//                 <div className="space-y-3">
//                   <div className="flex justify-between items-center py-2">
//                     <span className="text-gray-600">
//                       {t("client.originalSalePrice")}:
//                     </span>
//                     <span className="font-semibold text-lg">
//                       {formatPrice(property.price)}
//                     </span>
//                   </div>
//                   <div className="flex justify-between items-center py-2 border-t border-green-200">
//                     <div>
//                       <span className="text-gray-600">
//                         {t("client.platformCommission")}
//                       </span>
//                       <p className="text-xs text-gray-500">
//                         ({property.commissionRate * 100}%{" "}
//                         {t("client.ofSalePrice")})
//                       </p>
//                     </div>
//                     <span className="font-semibold text-red-600 text-lg">
//                       -{formatPrice(property.totalCommissionReceived)}
//                     </span>
//                   </div>
//                   <div className="flex justify-between items-center py-2 border-t border-green-200 font-bold text-lg">
//                     <span>{t("client.netAmountReceived")}:</span>
//                     <span className="text-green-600">
//                       {formatPrice(property.netAmountReceived)}
//                     </span>
//                   </div>
//                 </div>
//               </div>

//               {/* Transaction Details */}
//               <div className="bg-blue-50 p-6 rounded-lg">
//                 <h3 className="text-lg font-semibold text-gray-900 mb-4">
//                   {t("client.transactionDetails")}
//                 </h3>
//                 <div className="space-y-3">
//                   <div className="flex justify-between">
//                     <span className="text-gray-600">
//                       {t("client.transactionDate")}:
//                     </span>
//                     <span className="font-medium">
//                       {new Date(property.soldRentedDate).toLocaleDateString()}
//                     </span>
//                   </div>
//                   <div className="flex justify-between">
//                     <span className="text-gray-600">
//                       {t("client.commissionRate")}:
//                     </span>
//                     <span className="font-medium">
//                       {(property.commissionRate * 100).toFixed(1)}%
//                     </span>
//                   </div>
//                   <div className="flex justify-between">
//                     <span className="text-gray-600">
//                       {t("client.paymentStatus")}:
//                     </span>
//                     <span className="font-medium text-green-600">
//                       {t("client.completed")}
//                     </span>
//                   </div>
//                 </div>
//               </div>

//               {/* Additional Information */}
//               <div className="bg-purple-50 p-6 rounded-lg">
//                 <h3 className="text-lg font-semibold text-gray-900 mb-4">
//                   {t("client.additionalInformation")}
//                 </h3>
//                 <div className="space-y-2">
//                   <p className="text-sm text-gray-600">
//                     <strong>{t("client.note")}:</strong>{" "}
//                     {t("client.commissionNote")}
//                   </p>
//                   <p className="text-sm text-gray-600">
//                     {t("client.netEarningsProcessed")}
//                   </p>
//                 </div>
//               </div>
//             </div>

//             <div className="mt-6 flex justify-end">
//               <button
//                 onClick={onClose}
//                 className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition duration-200"
//               >
//                 {t("client.closeDetails")}
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   };

//   // Loading State
//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
//         <div className="text-center">
//           <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
//           <p className="text-gray-600 text-lg">
//             {t("client.loadingDashboard")}
//           </p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
//       <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 text-white py-12">
//         <div className="max-w-7xl mx-auto px-4">
//           <div className="text-center mb-8">
//             <h1 className="text-4xl md:text-5xl font-bold mb-4">
//               {t("client.welcomeBack")}, {user?.fname}! 👋
//             </h1>
//             <p className="text-xl opacity-90 max-w-2xl mx-auto">
//               {t("client.discoverManageProperties")}
//             </p>
//           </div>

//           <div className="max-w-2xl mx-auto">
//             <form onSubmit={handleSearch} className="relative">
//               <input
//                 type="text"
//                 placeholder={t("client.searchPlaceholder")}
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//                 className="w-full px-6 py-4 rounded-2xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-blue-300 shadow-2xl"
//               />
//               <button
//                 type="submit"
//                 className="absolute right-2 top-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl font-semibold transition duration-200"
//               >
//                 {t("client.search")}
//               </button>
//             </form>
//           </div>
//         </div>
//       </div>

//       <div className="max-w-7xl mx-auto px-4 py-8 -mt-8">
//         {/* Stats Cards - FIXED Total Properties & Available Properties */}
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
//           <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
//             <div className="flex items-center">
//               <div className="p-3 bg-blue-100 rounded-xl mr-4">
//                 <span className="text-2xl">🏠</span>
//               </div>
//               <div>
//                 <p className="text-sm font-medium text-gray-600">
//                   {t("client.totalProperties")}
//                 </p>
//                 <p className="text-2xl font-bold text-gray-900">
//                   {stats.totalProperties}
//                 </p>
//                 <p className="text-xs text-gray-500 mt-1">
//                   {t("client.allPropertiesInSystem")}
//                 </p>
//               </div>
//             </div>
//           </div>

//           <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
//             <div className="flex items-center">
//               <div className="p-3 bg-green-100 rounded-xl mr-4">
//                 <span className="text-2xl">✅</span>
//               </div>
//               <div>
//                 <p className="text-sm font-medium text-gray-600">
//                   {t("client.availableNow")}
//                 </p>
//                 <p className="text-2xl font-bold text-gray-900">
//                   {stats.availableProperties}
//                 </p>
//                 <p className="text-xs text-gray-500 mt-1">
//                   {t("client.propertiesAvailableStatus")}
//                 </p>
//               </div>
//             </div>
//           </div>

//           <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
//             <div className="flex items-center">
//               <div className="p-3 bg-purple-100 rounded-xl mr-4">
//                 <span className="text-2xl">📦</span>
//               </div>
//               <div>
//                 <p className="text-sm font-medium text-gray-600">
//                   {t("client.myListings")}
//                 </p>
//                 <p className="text-2xl font-bold text-gray-900">
//                   {stats.myPropertiesCount}
//                 </p>
//               </div>
//             </div>
//           </div>

//           <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
//             <div className="flex items-center">
//               <div className="p-3 bg-orange-100 rounded-xl mr-4">
//                 <span className="text-2xl">🛒</span>
//               </div>
//               <div>
//                 <p className="text-sm font-medium text-gray-600">
//                   {t("client.myOrders")}
//                 </p>
//                 <p className="text-2xl font-bold text-gray-900">
//                   {stats.orderedProperties}
//                 </p>
//               </div>
//             </div>
//           </div>

//           <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
//             <div className="flex items-center">
//               <div className="p-3 bg-red-100 rounded-xl mr-4">
//                 <span className="text-2xl">💰</span>
//               </div>
//               <div>
//                 <p className="text-sm font-medium text-gray-600">
//                   {t("client.pendingPayments")}
//                 </p>
//                 <p className="text-2xl font-bold text-gray-900">
//                   {stats.pendingPaymentsCount}
//                 </p>
//               </div>
//             </div>
//           </div>

//           <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
//             <div className="flex items-center">
//               <div className="p-3 bg-indigo-100 rounded-xl mr-4">
//                 <span className="text-2xl">💳</span>
//               </div>
//               <div>
//                 <p className="text-sm font-medium text-gray-600">
//                   {t("client.totalSpent")}
//                 </p>
//                 <p className="text-2xl font-bold text-gray-900">
//                   {formatPrice(paymentSummary.totalSpent)}
//                 </p>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Main Content */}
//         <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
//           <div className="border-b border-gray-200">
//             <nav className="flex space-x-8 px-6">
//               <button
//                 onClick={() => setActiveTab("browse")}
//                 className={`py-4 px-1 border-b-2 font-semibold text-sm transition duration-200 ${
//                   activeTab === "browse"
//                     ? "border-blue-500 text-blue-600"
//                     : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
//                 }`}
//               >
//                 🔍 {t("client.browseProperties")}
//               </button>
//               <button
//                 onClick={() => setActiveTab("ordered")}
//                 className={`py-4 px-1 border-b-2 font-semibold text-sm transition duration-200 ${
//                   activeTab === "ordered"
//                     ? "border-blue-500 text-blue-600"
//                     : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
//                 }`}
//               >
//                 🛒 {t("client.myOrders")} ({stats.orderedProperties})
//               </button>
//               <button
//                 onClick={() => setActiveTab("myProperties")}
//                 className={`py-4 px-1 border-b-2 font-semibold text-sm transition duration-200 ${
//                   activeTab === "myProperties"
//                     ? "border-blue-500 text-blue-600"
//                     : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
//                 }`}
//               >
//                 📋 {t("client.myProperties")} ({stats.myPropertiesCount})
//               </button>
//               <button
//                 onClick={() => setActiveTab("payments")}
//                 className={`py-4 px-1 border-b-2 font-semibold text-sm transition duration-200 ${
//                   activeTab === "payments"
//                     ? "border-blue-500 text-blue-600"
//                     : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
//                 }`}
//               >
//                 💰 {t("client.pendingPayments")} ({stats.pendingPaymentsCount})
//               </button>
//               {stats.soldProperties > 0 && (
//                 <button
//                   onClick={() => setActiveTab("earnings")}
//                   className={`py-4 px-1 border-b-2 font-semibold text-sm transition duration-200 ${
//                     activeTab === "earnings"
//                       ? "border-green-500 text-green-600"
//                       : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
//                   }`}
//                 >
//                   💰 {t("client.myEarnings")} ({stats.soldProperties})
//                 </button>
//               )}
//             </nav>
//           </div>

//           <div className="p-6">
//             {activeTab === "browse" && (
//               <div>
//                 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
//                   <div>
//                     <h2 className="text-2xl font-bold text-gray-900">
//                       {t("client.availableProperties")}
//                     </h2>
//                     <p className="text-gray-600 mt-1">
//                       {t("client.availablePropertiesDescription")}
//                     </p>
//                   </div>
//                   <Link
//                     to="/properties"
//                     className="mt-4 sm:mt-0 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl font-semibold transition duration-200 shadow-md hover:shadow-lg"
//                   >
//                     {t("client.browseAllProperties")}
//                   </Link>
//                 </div>

//                 {properties.length > 0 ? (
//                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
//                     {properties
//                       .filter(
//                         (property) =>
//                           property.status === "Available" ||
//                           (property.status === "Ordered" &&
//                             (property.orderInfo?.paymentStatus === "Pending" ||
//                               property.paymentStatus === "Pending"))
//                       )
//                       .map((property) => (
//                         <PropertyCard key={property._id} property={property} />
//                       ))}
//                   </div>
//                 ) : (
//                   <div className="text-center py-12 bg-gray-50 rounded-2xl">
//                     <div className="text-6xl mb-4">🔍</div>
//                     <h3 className="text-xl font-semibold text-gray-900 mb-2">
//                       {t("client.noPropertiesFound")}
//                     </h3>
//                     <p className="text-gray-600 mb-4">
//                       {searchTerm
//                         ? t("client.tryAdjustingSearch")
//                         : t("client.noPropertiesAvailable")}
//                     </p>
//                     <Link
//                       to="/properties"
//                       className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition duration-200"
//                     >
//                       {t("client.browseAllProperties")}
//                     </Link>
//                   </div>
//                 )}
//               </div>
//             )}

//             {activeTab === "ordered" && (
//               <div>
//                 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
//                   <div>
//                     <h2 className="text-2xl font-bold text-gray-900">
//                       {t("client.myOrderedProperties")}
//                     </h2>
//                     <p className="text-gray-600 mt-1">
//                       {t("client.orderedPropertiesDescription")}
//                     </p>
//                   </div>
//                   <div className="mt-4 sm:mt-0 text-sm text-gray-500">
//                     {stats.orderedProperties} {t("client.totalOrders")}
//                   </div>
//                 </div>

//                 {orderedProperties.length > 0 ? (
//                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
//                     {orderedProperties.map((property) => (
//                       <PropertyCard
//                         key={property._id}
//                         property={property}
//                         showOrderInfo={true}
//                         showPaymentButton={true}
//                       />
//                     ))}
//                   </div>
//                 ) : (
//                   <div className="text-center py-12 bg-gray-50 rounded-2xl">
//                     <div className="text-6xl mb-4">🛒</div>
//                     <h3 className="text-xl font-semibold text-gray-900 mb-2">
//                       {t("client.noOrdersYet")}
//                     </h3>
//                     <p className="text-gray-600 mb-4">
//                       {t("client.noOrdersDescription")}
//                     </p>
//                     <button
//                       onClick={() => setActiveTab("browse")}
//                       className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition duration-200"
//                     >
//                       {t("client.browseProperties")}
//                     </button>
//                   </div>
//                 )}
//               </div>
//             )}

//             {activeTab === "myProperties" && (
//               <div>
//                 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
//                   <div>
//                     <h2 className="text-2xl font-bold text-gray-900">
//                       {t("client.myProperties")}
//                     </h2>
//                     <p className="text-gray-600 mt-1">
//                       {t("client.myPropertiesDescription")}
//                     </p>
//                   </div>
//                   <Link
//                     to="/add-property"
//                     className="mt-4 sm:mt-0 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-3 rounded-xl font-semibold transition duration-200 shadow-md hover:shadow-lg"
//                   >
//                     + {t("client.addNewProperty")}
//                   </Link>
//                 </div>

//                 {myProperties.length > 0 ? (
//                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
//                     {myProperties.map((property) => (
//                       <PropertyCard
//                         key={property._id}
//                         property={property}
//                         showStatus={true}
//                       />
//                     ))}
//                   </div>
//                 ) : (
//                   <div className="text-center py-12 bg-gray-50 rounded-2xl">
//                     <div className="text-6xl mb-4">📋</div>
//                     <h3 className="text-xl font-semibold text-gray-900 mb-2">
//                       {t("client.noPropertiesListed")}
//                     </h3>
//                     <p className="text-gray-600 mb-4">
//                       {t("client.noPropertiesListedDescription")}
//                     </p>
//                     <Link
//                       to="/add-property"
//                       className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold transition duration-200"
//                     >
//                       {t("client.addFirstProperty")}
//                     </Link>
//                   </div>
//                 )}
//               </div>
//             )}

//             {activeTab === "payments" && (
//               <div>
//                 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
//                   <div>
//                     <h2 className="text-2xl font-bold text-gray-900">
//                       {t("client.pendingPayments")}
//                     </h2>
//                     <p className="text-gray-600 mt-1">
//                       {t("client.pendingPaymentsDescription")}
//                     </p>
//                   </div>
//                   <div className="mt-4 sm:mt-0 text-sm text-gray-500">
//                     {stats.pendingPaymentsCount}{" "}
//                     {t("client.pendingPaymentsCount")}
//                   </div>
//                 </div>

//                 {pendingPayments.length > 0 ? (
//                   <div className="space-y-4">
//                     {pendingPayments.map((property) => (
//                       <PendingPaymentCard
//                         key={property._id}
//                         property={property}
//                       />
//                     ))}
//                   </div>
//                 ) : (
//                   <div className="text-center py-12 bg-gray-50 rounded-2xl">
//                     <div className="text-6xl mb-4">💰</div>
//                     <h3 className="text-xl font-semibold text-gray-900 mb-2">
//                       {t("client.noPendingPayments")}
//                     </h3>
//                     <p className="text-gray-600 mb-4">
//                       {t("client.noPendingPaymentsDescription")}
//                     </p>
//                     <button
//                       onClick={() => setActiveTab("ordered")}
//                       className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition duration-200"
//                     >
//                       {t("client.viewMyOrders")}
//                     </button>
//                   </div>
//                 )}
//               </div>
//             )}

//             {activeTab === "earnings" && (
//               <div>
//                 <OwnerEarningsTab />
//               </div>
//             )}
//           </div>
//         </div>

//         {paymentSummary.totalSpent > 0 && (
//           <div className="bg-white rounded-2xl shadow-xl p-6 mt-8">
//             <h2 className="text-2xl font-bold text-gray-900 mb-6">
//               {t("client.paymentSummary")}
//             </h2>
//             <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
//               <div className="text-center">
//                 <div className="text-3xl font-bold text-blue-600">
//                   {formatPrice(paymentSummary.totalSpent)}
//                 </div>
//                 <p className="text-gray-600 text-sm mt-2">
//                   {t("client.totalSpent")}
//                 </p>
//               </div>
//               <div className="text-center">
//                 <div className="text-3xl font-bold text-green-600">
//                   {paymentSummary.propertiesPurchased}
//                 </div>
//                 <p className="text-gray-600 text-sm mt-2">
//                   {t("client.propertiesOwned")}
//                 </p>
//               </div>
//               <div className="text-center">
//                 <div className="text-3xl font-bold text-purple-600">
//                   {formatPrice(paymentSummary.averagePayment)}
//                 </div>
//                 <p className="text-gray-600 text-sm mt-2">
//                   {t("client.averagePayment")}
//                 </p>
//               </div>
//               <div className="text-center">
//                 <div className="text-3xl font-bold text-orange-600">
//                   {paymentSummary.successRate?.toFixed(1)}%
//                 </div>
//                 <p className="text-gray-600 text-sm mt-2">
//                   {t("client.successRate")}
//                 </p>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default ClientDashboard;

import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";
import axios from "../../api/axios";

const ClientDashboard = () => {
  const [properties, setProperties] = useState([]);
  const [myProperties, setMyProperties] = useState([]);
  const [orderedProperties, setOrderedProperties] = useState([]);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [ownerEarnings, setOwnerEarnings] = useState(null);
  const [allProperties, setAllProperties] = useState([]);
  const [paymentSummary, setPaymentSummary] = useState({
    totalSpent: 0,
    propertiesPurchased: 0,
    averagePayment: 0,
    totalTransactions: 0,
    successRate: 0,
  });
  const [stats, setStats] = useState({
    totalProperties: 0,
    availableProperties: 0,
    myPropertiesCount: 0,
    orderedProperties: 0,
    pendingPaymentsCount: 0,
    soldProperties: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("browse");
  const [searchTerm, setSearchTerm] = useState("");
  const [processingPayments, setProcessingPayments] = useState({});
  const [cancellingPayments, setCancellingPayments] = useState({});
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    fetchDashboardData();
  }, [activeTab]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch ALL properties for total count - ENHANCED
      let allPropsData = [];
      try {
        const allPropsResponse = await axios.get("/api/property?limit=1000");
        console.log("All properties API response:", allPropsResponse.data);

        // Handle different API response structures
        if (Array.isArray(allPropsResponse.data)) {
          allPropsData = allPropsResponse.data;
        } else if (Array.isArray(allPropsResponse.data?.properties)) {
          allPropsData = allPropsResponse.data.properties;
        } else if (Array.isArray(allPropsResponse.data?.data?.properties)) {
          allPropsData = allPropsResponse.data.data.properties;
        } else if (Array.isArray(allPropsResponse.data?.data)) {
          allPropsData = allPropsResponse.data.data;
        } else if (
          allPropsResponse.data?.properties &&
          typeof allPropsResponse.data.properties === "object"
        ) {
          // If properties is an object, convert to array
          allPropsData = Object.values(allPropsResponse.data.properties);
        } else if (
          allPropsResponse.data?.data &&
          typeof allPropsResponse.data.data === "object"
        ) {
          // If data is an object, convert to array
          allPropsData = Object.values(allPropsResponse.data.data);
        } else {
          // Last resort: try to extract any array from the response
          const findArray = (obj) => {
            for (let key in obj) {
              if (Array.isArray(obj[key])) {
                return obj[key];
              }
              if (typeof obj[key] === "object" && obj[key] !== null) {
                const found = findArray(obj[key]);
                if (found) return found;
              }
            }
            return [];
          };
          allPropsData = findArray(allPropsResponse.data);
        }

        console.log("Extracted properties:", allPropsData.length, allPropsData);
        setAllProperties(Array.isArray(allPropsData) ? allPropsData : []);
      } catch (error) {
        console.error("Error fetching all properties:", error);
        setAllProperties([]);
      }

      // Fetch properties for browse tab
      if (activeTab === "browse") {
        try {
          const response = await axios.get("/api/property?limit=8");
          let propertiesData = response.data.properties || response.data;
          if (!Array.isArray(propertiesData)) {
            propertiesData = [];
          }
          setProperties(propertiesData);
        } catch (error) {
          console.error("Error fetching browse properties:", error);
          setProperties([]);
        }
      }
      // Fetch user's properties for myProperties tab
      else if (activeTab === "myProperties") {
        try {
          const response = await axios.get("/api/property/my-properties");
          let myPropertiesData = response.data.properties || response.data;
          if (!Array.isArray(myPropertiesData)) {
            myPropertiesData = [];
          }
          setMyProperties(myPropertiesData);
        } catch (error) {
          console.error("Error fetching my properties:", error);
          setMyProperties([]);
        }
      }
      // Fetch user's ordered properties
      else if (activeTab === "ordered") {
        try {
          const response = await axios.get("/api/property/user/orders");
          let orderedData =
            response.data.data?.properties ||
            response.data.properties ||
            response.data ||
            [];
          if (!Array.isArray(orderedData)) {
            orderedData = [];
          }
          setOrderedProperties(orderedData);
        } catch (error) {
          console.error("Error fetching ordered properties:", error);
          setOrderedProperties([]);
        }
      }
      // Fetch pending payments
      else if (activeTab === "payments") {
        try {
          const response = await axios.get(
            "/api/property/user/pending-payments"
          );
          let pendingData =
            response.data.data?.properties ||
            response.data.properties ||
            response.data ||
            [];
          if (!Array.isArray(pendingData)) {
            pendingData = [];
          }
          setPendingPayments(pendingData);
        } catch (error) {
          console.error("Error fetching pending payments:", error);
          setPendingPayments([]);
        }
      }
      // Fetch owner earnings
      else if (activeTab === "earnings") {
        await fetchOwnerEarnings();
      }

      // Fetch all stats and payment summary - PASS allPropsData directly to avoid race condition
      await fetchStats(allPropsData);
      await fetchPaymentSummary();
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  // UPDATED: Accept allPropertiesData as parameter to avoid race condition
  const fetchStats = async (allPropertiesData = null) => {
    try {
      // Use passed data or fall back to state
      const propertiesData = allPropertiesData || allProperties;
      console.log("Current properties for stats:", propertiesData);

      // Calculate total properties - ALL properties regardless of status
      const totalPropertiesCount = Array.isArray(propertiesData)
        ? propertiesData.length
        : 0;

      // Calculate available properties - ONLY properties with "Available" status
      const totalAvailable = Array.isArray(propertiesData)
        ? propertiesData.filter((property) => property.status === "Available")
            .length
        : 0;

      // Fetch user's ordered properties for count
      let orderedProps = [];
      try {
        const orderedResponse = await axios.get("/api/property/user/orders");
        let orderedData =
          orderedResponse.data.data?.properties ||
          orderedResponse.data.properties ||
          orderedResponse.data ||
          [];
        if (!Array.isArray(orderedData)) {
          orderedData = [];
        }
        orderedProps = orderedData;
      } catch (error) {
        console.error("Error fetching ordered properties for stats:", error);
      }

      // Fetch user's properties for count
      let myProps = [];
      try {
        const myPropsResponse = await axios.get("/api/property/my-properties");
        let myPropsData =
          myPropsResponse.data.properties || myPropsResponse.data || [];
        if (!Array.isArray(myPropsData)) {
          myPropsData = [];
        }
        myProps = myPropsData;
      } catch (error) {
        console.error("Error fetching my properties for stats:", error);
      }

      // Fetch pending payments
      let pendingData = [];
      try {
        const pendingResponse = await axios.get(
          "/api/property/user/pending-payments"
        );
        let pendingPaymentsData =
          pendingResponse.data.data?.properties ||
          pendingResponse.data.properties ||
          pendingResponse.data ||
          [];
        if (!Array.isArray(pendingPaymentsData)) {
          pendingPaymentsData = [];
        }
        pendingData = pendingPaymentsData;
      } catch (error) {
        console.error("Error fetching pending payments for stats:", error);
      }

      // Calculate sold/rented properties from user's properties
      const soldPropertiesCount = Array.isArray(myProps)
        ? myProps.filter(
            (property) =>
              property.status === "Sold" || property.status === "Rented"
          ).length
        : 0;

      const newStats = {
        totalProperties: totalPropertiesCount,
        availableProperties: totalAvailable, // Now correctly shows only "Available" status
        myPropertiesCount: myProps.length,
        orderedProperties: orderedProps.length,
        pendingPaymentsCount: pendingData.length,
        soldProperties: soldPropertiesCount,
      };

      console.log("Setting stats:", newStats);
      setStats(newStats);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchPaymentSummary = async () => {
    try {
      const response = await axios.get("/api/payments/client/summary");
      if (response.data.success) {
        setPaymentSummary(response.data.data.summary || {});
      }
    } catch (error) {
      console.error("Error fetching payment summary:", error);
    }
  };

  // Enhanced owner earnings calculation
  const fetchOwnerEarnings = async () => {
    try {
      const response = await axios.get("/api/payments/owner/earnings");
      if (response.data.success) {
        const earningsData = response.data.data;
        const enhancedEarnings = calculateEnhancedEarnings(earningsData);
        setOwnerEarnings(enhancedEarnings);
      }
    } catch (error) {
      console.error("Error fetching owner earnings:", error);
      setOwnerEarnings(null);
    }
  };

  // Function to calculate proper commission and earnings
  const calculateEnhancedEarnings = (earningsData) => {
    if (!earningsData) return null;

    const enhancedProperties = earningsData.properties.map((property) => {
      const commissionRate = 0.02;
      const commission = property.price * commissionRate;
      const netEarnings = property.price - commission;

      return {
        ...property,
        totalCommissionReceived: commission,
        netAmountReceived: netEarnings,
        commissionRate: commissionRate,
      };
    });

    const totalEarnings = enhancedProperties.reduce(
      (sum, prop) => sum + prop.price,
      0
    );
    const totalCommission = enhancedProperties.reduce(
      (sum, prop) => sum + prop.totalCommissionReceived,
      0
    );
    const netEarnings = totalEarnings - totalCommission;

    return {
      ...earningsData,
      properties: enhancedProperties,
      earningsSummary: {
        ...earningsData.earningsSummary,
        totalEarnings: totalEarnings,
        totalCommissionPaid: totalCommission,
        netEarnings: netEarnings,
        totalPropertiesSoldRented: enhancedProperties.length,
      },
    };
  };

  // Handle cancel payment
  const handleCancelPayment = async (paymentId, propertyId, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // Show confirmation dialog
    if (!window.confirm(t("client.cancelPaymentConfirm"))) {
      return;
    }

    try {
      setCancellingPayments((prev) => ({ ...prev, [paymentId]: true }));

      const response = await axios.post(`/api/payments/${paymentId}/cancel`);

      if (response.data.success) {
        alert(t("client.paymentCancelledSuccessfully"));

        // Refresh the relevant data based on current tab
        await fetchDashboardData();

        // If in payments tab, remove the cancelled payment from local state
        if (activeTab === "payments") {
          setPendingPayments((prev) =>
            prev.filter(
              (p) =>
                !(
                  p.paymentInfo?._id === paymentId ||
                  p.paymentInfo?.paymentId === paymentId
                )
            )
          );
        }

        // If in ordered tab, update the property status
        if (activeTab === "ordered") {
          setOrderedProperties((prev) =>
            prev.map((p) =>
              p._id === propertyId
                ? {
                    ...p,
                    status: "Ordered",
                    paymentStatus: "Cancelled",
                    paymentInfo: {
                      ...p.paymentInfo,
                      paymentStatus: "Cancelled",
                    },
                  }
                : p
            )
          );
        }
      }
    } catch (error) {
      console.error("Error cancelling payment:", error);
      alert(error.response?.data?.message || t("client.cancelPaymentError"));
    } finally {
      setCancellingPayments((prev) => ({ ...prev, [paymentId]: false }));
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/properties?search=${encodeURIComponent(searchTerm)}`);
    }
  };

  const handleQuickOrder = async (propertyId, e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      navigate("/login");
      return;
    }

    try {
      const orderResponse = await axios.post(
        `/api/property/${propertyId}/order`
      );

      if (orderResponse.data.success) {
        alert(t("client.orderPlacedSuccess"));
        await handleCompletePayment(propertyId);
      }
    } catch (error) {
      console.error("Error ordering property:", error);
      alert(error.response?.data?.message || t("client.orderError"));
    }
  };

  const handleCompletePayment = async (
    propertyId,
    paymentType = "full_payment"
  ) => {
    try {
      setProcessingPayments((prev) => ({ ...prev, [propertyId]: true }));

      const paymentResponse = await axios.post("/api/payments/initialize", {
        propertyId: propertyId,
        paymentType: paymentType,
      });

      if (paymentResponse.data.success) {
        window.location.href = paymentResponse.data.data.paymentUrl;
      } else {
        throw new Error(
          paymentResponse.data.message || t("client.paymentInitFailed")
        );
      }
    } catch (error) {
      console.error("❌ Payment initialization error:", error);
      let errorMessage = t("client.paymentInitFailed");
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message.includes("Network Error")) {
        errorMessage = t("client.networkError");
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      alert(errorMessage);
    } finally {
      setProcessingPayments((prev) => ({ ...prev, [propertyId]: false }));
    }
  };

  const handlePayWithExistingUrl = (paymentUrl) => {
    if (paymentUrl) {
      window.location.href = paymentUrl;
    } else {
      alert(t("client.paymentUrlNotAvailable"));
    }
  };

  const canCompletePayment = (property) => {
    return (
      property.status === "Ordered" &&
      (property.orderInfo?.paymentStatus === "Pending" ||
        property.paymentStatus === "Pending" ||
        property.paymentInfo?.paymentStatus === "Pending")
    );
  };

  const formatPrice = (price) => {
    if (!price) return "ETB 0";
    return new Intl.NumberFormat("en-ET", {
      style: "currency",
      currency: "ETB",
    }).format(price);
  };

  const getStatusBadgeColor = (status, paymentStatus) => {
    switch (status) {
      case "Available":
        return "bg-green-100 text-green-800 border border-green-200";
      case "Pending":
        return "bg-yellow-100 text-yellow-800 border border-yellow-200";
      case "Ordered":
        if (paymentStatus === "Pending" || paymentStatus === "pending") {
          return "bg-blue-100 text-blue-800 border border-blue-200";
        } else if (
          paymentStatus === "Completed" ||
          paymentStatus === "completed"
        ) {
          return "bg-green-100 text-green-800 border border-green-200";
        } else if (
          paymentStatus === "Cancelled" ||
          paymentStatus === "cancelled"
        ) {
          return "bg-red-100 text-red-800 border border-red-200";
        } else {
          return "bg-purple-100 text-purple-800 border border-purple-200";
        }
      case "Sold":
      case "Rented":
        return "bg-red-100 text-red-800 border border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border border-gray-200";
    }
  };

  const getStatusText = (property) => {
    if (property.status === "Ordered") {
      const paymentStatus =
        property.paymentInfo?.paymentStatus ||
        property.orderInfo?.paymentStatus ||
        property.paymentStatus;
      if (paymentStatus === "Completed" || paymentStatus === "completed") {
        return t("client.orderedPaymentCompleted");
      } else if (paymentStatus === "Pending" || paymentStatus === "pending") {
        return t("client.orderedPaymentPending");
      } else if (
        paymentStatus === "Cancelled" ||
        paymentStatus === "cancelled"
      ) {
        return t("client.orderedPaymentCancelled");
      }
      return t("client.ordered");
    }
    return t(`client.${property.status.toLowerCase()}`) || property.status;
  };

  const canOrderProperty = (property) => {
    if (!user) return false;
    if (property.owner?._id === user._id) return false;
    if (["admin", "broker"].includes(user?.role)) return false;

    return (
      property.status === "Available" ||
      (property.status === "Ordered" &&
        (property.orderInfo?.paymentStatus === "Pending" ||
          property.paymentStatus === "Pending"))
    );
  };

  const PropertyCard = ({
    property,
    showStatus = false,
    showOrderInfo = false,
    showPaymentButton = false,
  }) => {
    const canOrder = canOrderProperty(property);
    const isProcessing = processingPayments[property._id];
    const isCancelling =
      cancellingPayments[property.paymentInfo?.paymentId || property._id];
    const hasPendingPayment = canCompletePayment(property);
    const hasExistingPaymentUrl = property.paymentInfo?.paymentUrl;
    const isPaymentCompleted =
      property.paymentInfo?.paymentStatus === "Completed" ||
      property.orderInfo?.paymentStatus === "Completed" ||
      property.paymentStatus === "Completed";
    const isPaymentCancelled =
      property.paymentInfo?.paymentStatus === "Cancelled" ||
      property.orderInfo?.paymentStatus === "Cancelled" ||
      property.paymentStatus === "Cancelled";
    const paymentId =
      property.paymentInfo?.paymentId || property.paymentInfo?._id;

    return (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100">
        <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200">
          {property.images && property.images.length > 0 ? (
            <img
              src={property.images[0]}
              alt={property.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <span className="text-5xl">
                {property.propertyType === "Home"
                  ? "🏠"
                  : property.propertyType === "Car"
                  ? "🚗"
                  : "💻"}
              </span>
            </div>
          )}

          <div className="absolute top-3 left-3 flex flex-col space-y-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(
                property.status,
                property.paymentInfo?.paymentStatus ||
                  property.orderInfo?.paymentStatus
              )}`}
            >
              {getStatusText(property)}
            </span>
            {showStatus && property.approvedByAdmin && (
              <span className="px-2 py-1 bg-green-500 text-white rounded-full text-xs font-medium">
                ✓ {t("client.approved")}
              </span>
            )}
            {showOrderInfo && property.orderInfo && (
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  isPaymentCompleted
                    ? "bg-green-500 text-white"
                    : isPaymentCancelled
                    ? "bg-red-500 text-white"
                    : "bg-yellow-500 text-white"
                }`}
              >
                {isPaymentCompleted
                  ? `✓ ${t("client.paid")}`
                  : isPaymentCancelled
                  ? `❌ ${t("client.cancelled")}`
                  : `⏳ ${t("client.paymentPending")}`}
              </span>
            )}
          </div>

          <div className="absolute top-3 right-3">
            <span className="px-3 py-1 bg-white bg-opacity-90 text-gray-700 rounded-full text-xs font-semibold border">
              {property.propertyType}
            </span>
          </div>

          <div className="absolute bottom-3 left-3">
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                property.purpose === "Sell"
                  ? "bg-orange-100 text-orange-800 border border-orange-200"
                  : "bg-blue-100 text-blue-800 border border-blue-200"
              }`}
            >
              {t("client.for")} {property.purpose}
            </span>
          </div>
        </div>

        <div className="p-5">
          <h3 className="font-bold text-gray-900 mb-2 line-clamp-1 text-lg">
            {property.title}
          </h3>
          <p className="text-gray-600 text-sm mb-3 line-clamp-2 leading-relaxed">
            {property.description}
          </p>

          <div className="flex items-center justify-between mb-3">
            <span className="text-xl font-bold text-blue-600">
              {formatPrice(property.price)}
            </span>
            <div className="flex items-center text-sm text-gray-500">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              {property.city}
            </div>
          </div>

          {property.propertyType === "Home" && property.homeDetails && (
            <div className="flex items-center justify-between text-xs text-gray-500 mb-4 bg-gray-50 p-2 rounded-lg">
              <span className="flex items-center">
                🛏️ {property.homeDetails.bedrooms}
              </span>
              <span className="flex items-center">
                🛁 {property.homeDetails.bathrooms}
              </span>
              <span className="flex items-center">
                📏 {property.homeDetails.size} sqft
              </span>
            </div>
          )}

          {property.propertyType === "Car" && property.carDetails && (
            <div className="flex items-center justify-between text-xs text-gray-500 mb-4 bg-gray-50 p-2 rounded-lg">
              <span className="flex items-center">
                🚗 {property.carDetails.brand}
              </span>
              <span className="flex items-center">
                📊 {property.carDetails.model}
              </span>
              <span className="flex items-center">
                🎯 {property.carDetails.year}
              </span>
            </div>
          )}

          <div className="flex flex-col space-y-3">
            {/* View Details Button */}
            <Link
              to={`/property/${property._id}`}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-center py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg block"
            >
              {t("client.viewDetails")}
            </Link>

            {/* Payment/Cancel Buttons Section */}
            {(showPaymentButton || hasPendingPayment) &&
              !isPaymentCompleted &&
              !isPaymentCancelled && (
                <div className="space-y-2">
                  {hasExistingPaymentUrl ? (
                    <div className="flex space-x-2">
                      <button
                        onClick={() =>
                          handlePayWithExistingUrl(
                            property.paymentInfo.paymentUrl
                          )
                        }
                        className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white text-center py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
                      >
                        {t("client.completePayment")}
                      </button>
                      {paymentId && (
                        <button
                          onClick={(e) =>
                            handleCancelPayment(paymentId, property._id, e)
                          }
                          disabled={isCancelling}
                          className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-center py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
                        >
                          {isCancelling ? (
                            <span className="flex items-center justify-center">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                              {t("client.cancelling")}
                            </span>
                          ) : (
                            <>
                              <span className="mr-1">❌</span>
                              {t("client.cancelPayment")}
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <button
                        onClick={() => handleCompletePayment(property._id)}
                        disabled={isProcessing}
                        className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:bg-gray-400 text-white text-center py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
                      >
                        {isProcessing ? (
                          <span className="flex items-center justify-center">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                            {t("client.processing")}
                          </span>
                        ) : (
                          t("client.completePayment")
                        )}
                      </button>
                      {paymentId && (
                        <button
                          onClick={(e) =>
                            handleCancelPayment(paymentId, property._id, e)
                          }
                          disabled={isCancelling}
                          className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-center py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
                        >
                          {isCancelling ? (
                            <span className="flex items-center justify-center">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                              {t("client.cancelling")}
                            </span>
                          ) : (
                            <>
                              <span className="mr-1">❌</span>
                              {t("client.cancelPayment")}
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

            {/* Cancelled Payment State */}
            {isPaymentCancelled && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-red-700">
                    <span className="mr-2">❌</span>
                    <span className="text-sm font-medium">
                      {t("client.paymentCancelled")}
                    </span>
                  </div>
                  <button
                    onClick={() => handleCompletePayment(property._id)}
                    disabled={isProcessing}
                    className="text-sm bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg transition duration-200"
                  >
                    {isProcessing
                      ? t("client.processing")
                      : t("client.tryAgain")}
                  </button>
                </div>
                <p className="text-xs text-red-600 mt-1">
                  {t("client.paymentCancelledDesc")}
                </p>
              </div>
            )}

            {/* Order Now Button for Available Properties */}
            {!showPaymentButton &&
              canOrder &&
              !hasPendingPayment &&
              !isPaymentCancelled && (
                <button
                  onClick={(e) => handleQuickOrder(property._id, e)}
                  className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white text-center py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  {t("client.orderNow")}
                </button>
              )}
          </div>

          {/* Order/Payment Information */}
          <div className="mt-3 space-y-1">
            {property.orderInfo && (
              <div className="text-xs text-gray-500">
                {t("client.orderedOn")}:{" "}
                {new Date(property.orderInfo.orderDate).toLocaleDateString()}
              </div>
            )}

            {(property.paymentInfo || property.orderInfo) &&
              !isPaymentCancelled && (
                <div className="text-xs">
                  {isPaymentCompleted ? (
                    <span className="text-green-600">
                      ✅ {t("client.paymentCompletedOn")}{" "}
                      {new Date(
                        property.paymentInfo?.paymentDate ||
                          property.orderInfo?.paymentDate ||
                          new Date()
                      ).toLocaleDateString()}
                    </span>
                  ) : (
                    <span className="text-yellow-600">
                      ⏳ {t("client.paymentPendingMessage")}
                    </span>
                  )}
                </div>
              )}

            {isPaymentCancelled && (
              <div className="text-xs text-red-600">
                ❌ {t("client.paymentCancelledOn")}{" "}
                {new Date(
                  property.paymentInfo?.updatedAt || new Date()
                ).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Pending Payment Card Component
  const PendingPaymentCard = ({ property }) => {
    const payment =
      property.pendingPayment || property.paymentInfo || property.orderInfo;
    const isProcessing = processingPayments[property._id];
    const isCancelling = cancellingPayments[payment?.paymentId || payment?._id];
    const hasExistingPaymentUrl = payment?.paymentUrl;
    const isPaymentCompleted = payment?.paymentStatus === "Completed";
    const isPaymentCancelled = payment?.paymentStatus === "Cancelled";

    return (
      <div
        className={`bg-white rounded-xl shadow-lg border ${
          isPaymentCancelled ? "border-red-200 bg-red-50" : "border-yellow-200"
        } p-6 transition-all duration-300 hover:shadow-xl`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div className="flex items-center space-x-4 mb-4 md:mb-0">
            {property.images && property.images.length > 0 ? (
              <img
                src={property.images[0]}
                alt={property.title}
                className="w-16 h-16 object-cover rounded-lg"
              />
            ) : (
              <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                <span className="text-2xl">
                  {property.propertyType === "Home"
                    ? "🏠"
                    : property.propertyType === "Car"
                    ? "🚗"
                    : "💻"}
                </span>
              </div>
            )}
            <div>
              <h3 className="font-semibold text-gray-900">{property.title}</h3>
              <p className="text-sm text-gray-600">
                {property.propertyType} • {property.purpose}
              </p>
              <p className="text-lg font-bold text-blue-600 mt-1">
                {formatPrice(payment?.amount || property.price)}
              </p>
              <div className="flex items-center space-x-2 mt-1">
                <p
                  className={`text-sm px-2 py-1 rounded-full ${
                    isPaymentCancelled
                      ? "bg-red-100 text-red-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {getStatusText(property)}
                </p>
                {isPaymentCancelled && (
                  <span className="text-xs text-red-500">
                    ❌ {t("client.cancelled")}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col space-y-3">
            <div className="text-sm text-gray-600">
              <span className="font-medium">{t("client.dueDate")}:</span>{" "}
              {payment?.dueDate
                ? new Date(payment.dueDate).toLocaleDateString()
                : "N/A"}
            </div>

            {/* Action Buttons */}
            {!isPaymentCompleted && !isPaymentCancelled && (
              <div className="flex space-x-2">
                {hasExistingPaymentUrl ? (
                  <>
                    <button
                      onClick={() =>
                        handlePayWithExistingUrl(payment.paymentUrl)
                      }
                      className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-4 py-2 rounded-lg text-sm font-semibold text-center transition duration-200 shadow-md hover:shadow-lg"
                    >
                      {t("client.completePayment")}
                    </button>
                    <button
                      onClick={() =>
                        handleCancelPayment(
                          payment._id || payment.paymentId,
                          property._id
                        )
                      }
                      disabled={isCancelling}
                      className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold text-center transition duration-200 shadow-md hover:shadow-lg"
                    >
                      {isCancelling ? (
                        <span className="flex items-center justify-center">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          {t("client.cancelling")}
                        </span>
                      ) : (
                        <>
                          <span className="mr-1">❌</span>
                          {t("client.cancelPayment")}
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleCompletePayment(property._id)}
                      disabled={isProcessing}
                      className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-semibold text-center transition duration-200 shadow-md hover:shadow-lg"
                    >
                      {isProcessing ? (
                        <span className="flex items-center justify-center">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          {t("client.processing")}
                        </span>
                      ) : (
                        t("client.initializePayment")
                      )}
                    </button>
                    {payment?._id || payment?.paymentId ? (
                      <button
                        onClick={() =>
                          handleCancelPayment(
                            payment._id || payment.paymentId,
                            property._id
                          )
                        }
                        disabled={isCancelling}
                        className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold text-center transition duration-200 shadow-md hover:shadow-lg"
                      >
                        {isCancelling ? (
                          <span className="flex items-center justify-center">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                            {t("client.cancelling")}
                          </span>
                        ) : (
                          <>
                            <span className="mr-1">❌</span>
                            {t("client.cancelPayment")}
                          </>
                        )}
                      </button>
                    ) : null}
                  </>
                )}
              </div>
            )}

            {/* Cancelled Payment State */}
            {isPaymentCancelled && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-red-700">
                    <span className="mr-2">❌</span>
                    <span className="text-sm font-medium">
                      {t("client.paymentCancelled")}
                    </span>
                  </div>
                  <button
                    onClick={() => handleCompletePayment(property._id)}
                    disabled={isProcessing}
                    className="text-sm bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg transition duration-200"
                  >
                    {isProcessing
                      ? t("client.processing")
                      : t("client.tryAgain")}
                  </button>
                </div>
                <p className="text-xs text-red-600 mt-1">
                  {t("client.paymentCancelledDesc")}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const OwnerEarningsTab = () => {
    const [selectedProperty, setSelectedProperty] = useState(null);

    if (!ownerEarnings) {
      return (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">💰</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {t("client.noEarningsYet")}
          </h3>
          <p className="text-gray-600">{t("client.earningsWillAppear")}</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-xl mr-4">
                <span className="text-2xl">💰</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {t("client.totalEarnings")}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatPrice(ownerEarnings.earningsSummary.totalEarnings)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {t("client.grossAmountBeforeCommission")}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-xl mr-4">
                <span className="text-2xl">🏠</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {t("client.propertiesSoldRented")}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {ownerEarnings.earningsSummary.totalPropertiesSoldRented}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-xl mr-4">
                <span className="text-2xl">💸</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {t("client.commissionPaid")}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatPrice(
                    ownerEarnings.earningsSummary.totalCommissionPaid
                  )}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {t("client.platformCommission")}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-xl mr-4">
                <span className="text-2xl">📈</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {t("client.netEarnings")}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatPrice(ownerEarnings.earningsSummary.netEarnings)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {t("client.afterCommissionDeduction")}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {t("client.soldRentedProperties")}
          </h2>
          {ownerEarnings.properties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ownerEarnings.properties.map((property) => (
                <div
                  key={property._id}
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition duration-300"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">
                      {property.title}
                    </h3>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        property.status === "Sold"
                          ? "bg-green-100 text-green-800"
                          : "bg-purple-100 text-purple-800"
                      }`}
                    >
                      {property.status}
                    </span>
                  </div>

                  {property.images && property.images.length > 0 && (
                    <img
                      src={property.images[0]}
                      alt={property.title}
                      className="w-full h-32 object-cover rounded-lg mb-4"
                    />
                  )}

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{t("client.type")}:</span>
                      <span className="font-medium">
                        {property.propertyType}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {t("client.purpose")}:
                      </span>
                      <span className="font-medium">{property.purpose}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {t("client.location")}:
                      </span>
                      <span className="font-medium">{property.city}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {t("client.soldRentedDate")}:
                      </span>
                      <span className="font-medium">
                        {new Date(property.soldRentedDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {t("client.salePrice")}:
                      </span>
                      <span className="font-semibold">
                        {formatPrice(property.price)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {t("client.commissionPaid")}:
                      </span>
                      <span className="font-semibold text-red-600">
                        -{formatPrice(property.totalCommissionReceived)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm font-bold border-t pt-2">
                      <span>{t("client.netReceived")}:</span>
                      <span className="text-green-600">
                        {formatPrice(property.netAmountReceived)}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedProperty(property)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition duration-300"
                  >
                    {t("client.viewEarningsDetails")}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 text-6xl mb-4">🏠</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {t("client.noPropertiesSoldRentedYet")}
              </h3>
              <p className="text-gray-600">
                {t("client.earningsWillAppearWhenSold")}
              </p>
            </div>
          )}
        </div>

        {ownerEarnings.payments && ownerEarnings.payments.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {t("client.recentPayments")}
            </h2>
            <div className="space-y-4">
              {ownerEarnings.payments.slice(0, 5).map((payment) => (
                <div
                  key={payment._id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 text-lg">💰</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {payment.property?.title || t("client.propertyPayment")}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {payment.paymentType === "broker_commission"
                          ? t("client.commissionPayment")
                          : t("client.propertySale")}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(payment.paymentDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-lg font-semibold ${
                        payment.paymentType === "broker_commission"
                          ? "text-green-600"
                          : "text-blue-600"
                      }`}
                    >
                      {formatPrice(payment.amount)}
                    </p>
                    <p className="text-sm text-gray-600 capitalize">
                      {payment.paymentType.replace("_", " ")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* UPDATED: Property Earnings Modal */}
        {selectedProperty && (
          <PropertyEarningsModal
            property={selectedProperty}
            onClose={() => setSelectedProperty(null)}
          />
        )}
      </div>
    );
  };

  // UPDATED: Property Earnings Modal Component with proper data display
  const PropertyEarningsModal = ({ property, onClose }) => {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {t("client.earningsDetails")} - {property.title}
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              {/* Property Information */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {t("client.propertyInformation")}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">
                      {t("client.propertyTitle")}
                    </p>
                    <p className="font-semibold">{property.title}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">{t("client.type")}</p>
                    <p className="font-semibold">{property.propertyType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">
                      {t("client.purpose")}
                    </p>
                    <p className="font-semibold">{property.purpose}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">
                      {t("client.location")}
                    </p>
                    <p className="font-semibold">{property.city}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">
                      {t("client.status")}
                    </p>
                    <p className="font-semibold">{property.status}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">
                      {t("client.soldRentedDate")}
                    </p>
                    <p className="font-semibold">
                      {new Date(property.soldRentedDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Financial Breakdown */}
              <div className="bg-green-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {t("client.financialBreakdown")}
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600">
                      {t("client.originalSalePrice")}:
                    </span>
                    <span className="font-semibold text-lg">
                      {formatPrice(property.price)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-t border-green-200">
                    <div>
                      <span className="text-gray-600">
                        {t("client.platformCommission")}
                      </span>
                      <p className="text-xs text-gray-500">
                        ({property.commissionRate * 100}%{" "}
                        {t("client.ofSalePrice")})
                      </p>
                    </div>
                    <span className="font-semibold text-red-600 text-lg">
                      -{formatPrice(property.totalCommissionReceived)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-t border-green-200 font-bold text-lg">
                    <span>{t("client.netAmountReceived")}:</span>
                    <span className="text-green-600">
                      {formatPrice(property.netAmountReceived)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Transaction Details */}
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {t("client.transactionDetails")}
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      {t("client.transactionDate")}:
                    </span>
                    <span className="font-medium">
                      {new Date(property.soldRentedDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      {t("client.commissionRate")}:
                    </span>
                    <span className="font-medium">
                      {(property.commissionRate * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      {t("client.paymentStatus")}:
                    </span>
                    <span className="font-medium text-green-600">
                      {t("client.completed")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="bg-purple-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {t("client.additionalInformation")}
                </h3>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    <strong>{t("client.note")}:</strong>{" "}
                    {t("client.commissionNote")}
                  </p>
                  <p className="text-sm text-gray-600">
                    {t("client.netEarningsProcessed")}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={onClose}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition duration-200"
              >
                {t("client.closeDetails")}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">
            {t("client.loadingDashboard")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {t("client.welcomeBack")}, {user?.fname}! 👋
            </h1>
            <p className="text-xl opacity-90 max-w-2xl mx-auto">
              {t("client.discoverManageProperties")}
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder={t("client.searchPlaceholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-6 py-4 rounded-2xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-blue-300 shadow-2xl"
              />
              <button
                type="submit"
                className="absolute right-2 top-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl font-semibold transition duration-200"
              >
                {t("client.search")}
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 -mt-8">
        {/* Stats Cards - FIXED Total Properties & Available Properties */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-xl mr-4">
                <span className="text-2xl">🏠</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {t("client.totalProperties")}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalProperties}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {t("client.allPropertiesInSystem")}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-xl mr-4">
                <span className="text-2xl">✅</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {t("client.availableNow")}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.availableProperties}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {t("client.propertiesAvailableStatus")}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-xl mr-4">
                <span className="text-2xl">📦</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {t("client.myListings")}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.myPropertiesCount}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-xl mr-4">
                <span className="text-2xl">🛒</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {t("client.myOrders")}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.orderedProperties}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-xl mr-4">
                <span className="text-2xl">💰</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {t("client.pendingPayments")}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.pendingPaymentsCount}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-indigo-100 rounded-xl mr-4">
                <span className="text-2xl">💳</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {t("client.totalSpent")}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatPrice(paymentSummary.totalSpent)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab("browse")}
                className={`py-4 px-1 border-b-2 font-semibold text-sm transition duration-200 ${
                  activeTab === "browse"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                🔍 {t("client.browseProperties")}
              </button>
              <button
                onClick={() => setActiveTab("ordered")}
                className={`py-4 px-1 border-b-2 font-semibold text-sm transition duration-200 ${
                  activeTab === "ordered"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                🛒 {t("client.myOrders")} ({stats.orderedProperties})
              </button>
              <button
                onClick={() => setActiveTab("myProperties")}
                className={`py-4 px-1 border-b-2 font-semibold text-sm transition duration-200 ${
                  activeTab === "myProperties"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                📋 {t("client.myProperties")} ({stats.myPropertiesCount})
              </button>
              <button
                onClick={() => setActiveTab("payments")}
                className={`py-4 px-1 border-b-2 font-semibold text-sm transition duration-200 ${
                  activeTab === "payments"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                💰 {t("client.pendingPayments")} ({stats.pendingPaymentsCount})
              </button>
              {stats.soldProperties > 0 && (
                <button
                  onClick={() => setActiveTab("earnings")}
                  className={`py-4 px-1 border-b-2 font-semibold text-sm transition duration-200 ${
                    activeTab === "earnings"
                      ? "border-green-500 text-green-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  💰 {t("client.myEarnings")} ({stats.soldProperties})
                </button>
              )}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === "browse" && (
              <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {t("client.availableProperties")}
                    </h2>
                    <p className="text-gray-600 mt-1">
                      {t("client.availablePropertiesDescription")}
                    </p>
                  </div>
                  <Link
                    to="/properties"
                    className="mt-4 sm:mt-0 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl font-semibold transition duration-200 shadow-md hover:shadow-lg"
                  >
                    {t("client.browseAllProperties")}
                  </Link>
                </div>

                {properties.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {properties
                      .filter(
                        (property) =>
                          property.status === "Available" ||
                          (property.status === "Ordered" &&
                            (property.orderInfo?.paymentStatus === "Pending" ||
                              property.paymentStatus === "Pending"))
                      )
                      .map((property) => (
                        <PropertyCard key={property._id} property={property} />
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-2xl">
                    <div className="text-6xl mb-4">🔍</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {t("client.noPropertiesFound")}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {searchTerm
                        ? t("client.tryAdjustingSearch")
                        : t("client.noPropertiesAvailable")}
                    </p>
                    <Link
                      to="/properties"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition duration-200"
                    >
                      {t("client.browseAllProperties")}
                    </Link>
                  </div>
                )}
              </div>
            )}

            {activeTab === "ordered" && (
              <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {t("client.myOrderedProperties")}
                    </h2>
                    <p className="text-gray-600 mt-1">
                      {t("client.orderedPropertiesDescription")}
                    </p>
                  </div>
                  <div className="mt-4 sm:mt-0 text-sm text-gray-500">
                    {stats.orderedProperties} {t("client.totalOrders")}
                  </div>
                </div>

                {orderedProperties.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {orderedProperties.map((property) => (
                      <PropertyCard
                        key={property._id}
                        property={property}
                        showOrderInfo={true}
                        showPaymentButton={true}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-2xl">
                    <div className="text-6xl mb-4">🛒</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {t("client.noOrdersYet")}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {t("client.noOrdersDescription")}
                    </p>
                    <button
                      onClick={() => setActiveTab("browse")}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition duration-200"
                    >
                      {t("client.browseProperties")}
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === "myProperties" && (
              <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {t("client.myProperties")}
                    </h2>
                    <p className="text-gray-600 mt-1">
                      {t("client.myPropertiesDescription")}
                    </p>
                  </div>
                  <Link
                    to="/add-property"
                    className="mt-4 sm:mt-0 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-3 rounded-xl font-semibold transition duration-200 shadow-md hover:shadow-lg"
                  >
                    + {t("client.addNewProperty")}
                  </Link>
                </div>

                {myProperties.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {myProperties.map((property) => (
                      <PropertyCard
                        key={property._id}
                        property={property}
                        showStatus={true}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-2xl">
                    <div className="text-6xl mb-4">📋</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {t("client.noPropertiesListed")}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {t("client.noPropertiesListedDescription")}
                    </p>
                    <Link
                      to="/add-property"
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold transition duration-200"
                    >
                      {t("client.addFirstProperty")}
                    </Link>
                  </div>
                )}
              </div>
            )}

            {activeTab === "payments" && (
              <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {t("client.pendingPayments")}
                    </h2>
                    <p className="text-gray-600 mt-1">
                      {t("client.pendingPaymentsDescription")}
                    </p>
                  </div>
                  <div className="mt-4 sm:mt-0 text-sm text-gray-500">
                    {stats.pendingPaymentsCount}{" "}
                    {t("client.pendingPaymentsCount")}
                  </div>
                </div>

                {pendingPayments.length > 0 ? (
                  <div className="space-y-4">
                    {pendingPayments.map((property) => (
                      <PendingPaymentCard
                        key={property._id}
                        property={property}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-2xl">
                    <div className="text-6xl mb-4">💰</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {t("client.noPendingPayments")}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {t("client.noPendingPaymentsDescription")}
                    </p>
                    <button
                      onClick={() => setActiveTab("ordered")}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition duration-200"
                    >
                      {t("client.viewMyOrders")}
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === "earnings" && (
              <div>
                <OwnerEarningsTab />
              </div>
            )}
          </div>
        </div>

        {paymentSummary.totalSpent > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {t("client.paymentSummary")}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {formatPrice(paymentSummary.totalSpent)}
                </div>
                <p className="text-gray-600 text-sm mt-2">
                  {t("client.totalSpent")}
                </p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {paymentSummary.propertiesPurchased}
                </div>
                <p className="text-gray-600 text-sm mt-2">
                  {t("client.propertiesOwned")}
                </p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">
                  {formatPrice(paymentSummary.averagePayment)}
                </div>
                <p className="text-gray-600 text-sm mt-2">
                  {t("client.averagePayment")}
                </p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600">
                  {paymentSummary.successRate?.toFixed(1)}%
                </div>
                <p className="text-gray-600 text-sm mt-2">
                  {t("client.successRate")}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientDashboard;
