// import React, { useState, useEffect } from "react";
// import { Link } from "react-router-dom";
// import { useAuth } from "../../context/AuthContext";
// import { useTranslation } from "react-i18next";
// import axios from "../../api/axios";

// const Home = () => {
//   const { isAuthenticated, user } = useAuth();
//   const { t } = useTranslation();
//   const [featuredProperties, setFeaturedProperties] = useState([]);
//   const [stats, setStats] = useState({
//     totalProperties: "0",
//     verifiedBrokers: "0",
//     happyClients: "0",
//     citiesCovered: "0",
//   });
//   const [loading, setLoading] = useState(true);
//   const [statsLoading, setStatsLoading] = useState(true);

//   useEffect(() => {
//     fetchFeaturedProperties();
//     fetchDashboardStats();
//   }, []);

//   const fetchDashboardStats = async () => {
//     try {
//       setStatsLoading(true);

//       // Use the new public stats endpoint
//       const response = await axios.get("/api/property/public/stats");
//       const data = response.data.data;

//       console.log("📊 Public stats:", data);

//       setStats({
//         totalProperties: data.totalProperties?.toString() || "0",
//         verifiedBrokers: data.verifiedBrokers?.toString() || "0",
//         happyClients: data.happyClients?.toString() || "0",
//         citiesCovered: data.citiesCovered || "50+",
//       });
//     } catch (error) {
//       console.error("Error fetching public stats:", error);
//       // Fallback to admin endpoint or basic counts
//       try {
//         await fetchBasicStats();
//       } catch (fallbackError) {
//         console.error("Fallback stats also failed:", fallbackError);
//       }
//     } finally {
//       setStatsLoading(false);
//     }
//   };

//   const fetchBasicStats = async () => {
//     try {
//       // Fetch properties count
//       const propertiesResponse = await axios.get("/api/property?limit=1");
//       const totalProperties = propertiesResponse.data.total || "0";

//       // Fetch users count (you might need to add this endpoint)
//       const usersResponse = await axios.get("/api/users/available");
//       const allUsers = usersResponse.data.users || [];

//       const brokers = allUsers.filter((user) => user.role === "broker").length;
//       const clients = allUsers.filter((user) => user.role === "client").length;

//       setStats({
//         totalProperties: totalProperties.toString(),
//         verifiedBrokers: brokers.toString(),
//         happyClients: clients.toString(),
//         citiesCovered: "50+", // Default value
//       });
//     } catch (error) {
//       console.error("Error fetching basic stats:", error);
//       throw error;
//     }
//   };

//   const fetchFeaturedProperties = async () => {
//     try {
//       const response = await axios.get("/api/property?limit=6");
//       const properties = response.data.properties || response.data;
//       setFeaturedProperties(Array.isArray(properties) ? properties : []);
//     } catch (error) {
//       console.error("Error fetching featured properties:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const formatPrice = (price) => {
//     return new Intl.NumberFormat("en-ET", {
//       style: "currency",
//       currency: "ETB",
//     }).format(price);
//   };

//   const getStatusBadgeColor = (status, paymentStatus) => {
//     if (status === "Available") {
//       return "bg-green-100 text-green-800 border border-green-200";
//     } else if (status === "Ordered" && paymentStatus === "Pending") {
//       return "bg-yellow-100 text-yellow-800 border border-yellow-200";
//     } else {
//       return "bg-gray-100 text-gray-800 border border-gray-200";
//     }
//   };

//   const getStatusText = (property) => {
//     if (property.status === "Available") {
//       return t("client.available");
//     } else if (property.status === "Ordered") {
//       return property.orderInfo?.paymentStatus === "Pending"
//         ? t("client.orderedPaymentPending")
//         : t("client.ordered");
//     }
//     return property.status;
//   };

//   const canOrderProperty = (property) => {
//     if (!user) return false;
//     if (property.owner?._id === user._id) return false;
//     if (["admin", "broker"].includes(user?.role)) return false;

//     return (
//       property.status === "Available" ||
//       (property.status === "Ordered" &&
//         property.orderInfo?.paymentStatus === "Pending")
//     );
//   };

//   const getOrderButtonText = (property) => {
//     if (
//       property.status === "Ordered" &&
//       property.orderInfo?.paymentStatus === "Pending"
//     ) {
//       return t("client.completeOrder");
//     }
//     return property.purpose === "Sell"
//       ? t("client.buyNow")
//       : t("client.rentNow");
//   };

//   const features = [
//     {
//       icon: "🏠",
//       title: t("home.feature1"),
//       description: t("home.feature1Desc"),
//     },
//     {
//       icon: "🤝",
//       title: t("home.feature2"),
//       description: t("home.feature2Desc"),
//     },
//     {
//       icon: "💰",
//       title: t("home.feature3"),
//       description: t("home.feature3Desc"),
//     },
//     {
//       icon: "⚡",
//       title: t("home.feature4"),
//       description: t("home.feature4Desc"),
//     },
//     {
//       icon: "🔒",
//       title: t("home.feature5"),
//       description: t("home.feature5Desc"),
//     },
//     {
//       icon: "📱",
//       title: t("home.feature6"),
//       description: t("home.feature6Desc"),
//     },
//   ];

//   const PropertyCard = ({ property }) => {
//     const canOrder = canOrderProperty(property);

//     return (
//       <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition duration-300 border border-gray-100">
//         <div className="relative h-48 bg-gray-200">
//           {property.images && property.images.length > 0 ? (
//             <img
//               src={property.images[0]}
//               alt={property.title}
//               className="w-full h-full object-cover"
//             />
//           ) : (
//             <div className="w-full h-full flex items-center justify-center text-gray-400">
//               <span className="text-4xl">
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
//               className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(
//                 property.status,
//                 property.orderInfo?.paymentStatus
//               )}`}
//             >
//               {getStatusText(property)}
//             </span>
//             <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
//               {property.propertyType}
//             </span>
//           </div>
//         </div>

//         <div className="p-4">
//           <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1">
//             {property.title}
//           </h3>
//           <p className="text-gray-600 text-sm mb-2 line-clamp-2">
//             {property.description}
//           </p>

//           <div className="flex items-center justify-between mb-3">
//             <span className="text-lg font-bold text-blue-600">
//               {formatPrice(property.price)}
//             </span>
//             <span className="text-sm text-gray-500 capitalize">
//               {property.purpose}
//             </span>
//           </div>

//           <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
//             <span>📍 {property.city}</span>
//             <span
//               className={`px-2 py-1 rounded-full text-xs ${
//                 property.purpose === "Sell"
//                   ? "bg-green-100 text-green-800"
//                   : "bg-blue-100 text-blue-800"
//               }`}
//             >
//               {property.purpose}
//             </span>
//           </div>

//           <div className="flex gap-2">
//             <Link
//               to={`/property/${property._id}`}
//               className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-center py-2 px-4 rounded text-sm font-medium transition duration-200"
//             >
//               {t("client.viewDetails")}
//             </Link>
//             {canOrder && (
//               <Link
//                 to={`/property/${property._id}`}
//                 className="bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded text-sm font-medium transition duration-200 whitespace-nowrap"
//               >
//                 {getOrderButtonText(property)}
//               </Link>
//             )}
//           </div>
//         </div>
//       </div>
//     );
//   };

//   // Loading component for stats
//   const StatLoading = () => (
//     <div className="animate-pulse">
//       <div className="h-8 bg-gray-200 rounded mb-2 mx-auto w-20"></div>
//       <div className="h-4 bg-gray-200 rounded mx-auto w-24"></div>
//     </div>
//   );

//   return (
//     <div className="min-h-screen">
//       {/* Hero Section */}
//       <section className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 text-white relative overflow-hidden">
//         <div className="absolute inset-0 bg-black opacity-10"></div>
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative">
//           <div className="text-center">
//             <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
//               {t("home.heroTitle")}
//             </h1>
//             <p className="text-xl md:text-2xl mb-8 opacity-90 max-w-3xl mx-auto leading-relaxed">
//               {t("home.heroSubtitle")}
//             </p>
//             <div className="flex flex-col sm:flex-row gap-4 justify-center">
//               {isAuthenticated ? (
//                 <Link
//                   to={
//                     user?.role === "admin"
//                       ? "/admin"
//                       : user?.role === "broker"
//                       ? "/broker"
//                       : "/client"
//                   }
//                   className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition duration-300 transform hover:scale-105 shadow-lg"
//                 >
//                   {t("navigation.dashboard")}
//                 </Link>
//               ) : (
//                 <>
//                   <Link
//                     to="/register"
//                     className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition duration-300 transform hover:scale-105 shadow-lg"
//                   >
//                     {t("home.getStarted")}
//                   </Link>
//                   <Link
//                     to="/login"
//                     className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-blue-600 transition duration-300 transform hover:scale-105"
//                   >
//                     {t("auth.signIn")}
//                   </Link>
//                 </>
//               )}
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* Stats Section */}
//       <section className="bg-white py-16">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
//             {Object.entries(stats).map(([key, value], index) => (
//               <div
//                 key={key}
//                 className="p-6 transform hover:scale-105 transition duration-300"
//               >
//                 {statsLoading ? (
//                   <StatLoading />
//                 ) : (
//                   <>
//                     <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">
//                       {value}
//                       {(key === "totalProperties" ||
//                         key === "verifiedBrokers" ||
//                         key === "happyClients") &&
//                         "+"}
//                     </div>
//                     <div className="text-gray-600 font-medium">
//                       {key === "totalProperties" && t("home.totalProperties")}
//                       {key === "verifiedBrokers" && t("home.verifiedBrokers")}
//                       {key === "happyClients" && t("home.happyClients")}
//                       {key === "citiesCovered" && t("home.citiesCovered")}
//                     </div>
//                   </>
//                 )}
//               </div>
//             ))}
//           </div>

//           {/* Stats Update Info */}
//           {!statsLoading && (
//             <div className="text-center mt-6">
//               <p className="text-sm text-gray-500">{t("home.realTimeStats")}</p>
//             </div>
//           )}
//         </div>
//       </section>

//       {/* Features Section */}
//       <section className="bg-gray-50 py-16">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="text-center mb-16">
//             <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
//               {t("home.featuresTitle")}
//             </h2>
//             <p className="text-xl text-gray-600 max-w-3xl mx-auto">
//               {t("home.featuresSubtitle")}
//             </p>
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
//             {features.map((feature, index) => (
//               <div
//                 key={index}
//                 className="bg-white p-8 rounded-xl shadow-md hover:shadow-xl transition duration-300 transform hover:-translate-y-1"
//               >
//                 <div className="text-4xl mb-4">{feature.icon}</div>
//                 <h3 className="text-xl font-semibold text-gray-900 mb-4">
//                   {feature.title}
//                 </h3>
//                 <p className="text-gray-600 leading-relaxed">
//                   {feature.description}
//                 </p>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* Featured Properties Section */}
//       <section className="bg-white py-16">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="text-center mb-12">
//             <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
//               {t("home.featuredProperties")}
//             </h2>
//             <p className="text-xl text-gray-600 max-w-3xl mx-auto">
//               {t("home.featuredPropertiesDesc")}
//             </p>
//           </div>

//           {loading ? (
//             <div className="flex justify-center items-center py-12">
//               <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
//             </div>
//           ) : featuredProperties.length > 0 ? (
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
//               {featuredProperties
//                 .filter(
//                   (property) =>
//                     property.status === "Available" ||
//                     (property.status === "Ordered" &&
//                       property.orderInfo?.paymentStatus === "Pending")
//                 )
//                 .slice(0, 6)
//                 .map((property) => (
//                   <PropertyCard key={property._id} property={property} />
//                 ))}
//             </div>
//           ) : (
//             <div className="text-center py-12 bg-gray-50 rounded-lg">
//               <div className="text-4xl mb-4">🏠</div>
//               <p className="text-gray-600 mb-4">
//                 {t("home.noFeaturedProperties")}
//               </p>
//             </div>
//           )}

//           <div className="text-center">
//             <Link
//               to="/properties"
//               className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold text-lg transition duration-300 transform hover:scale-105"
//             >
//               {t("home.viewAllProperties")}
//             </Link>
//           </div>
//         </div>
//       </section>

//       {/* Property Types Section */}
//       <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-16">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="text-center mb-12">
//             <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
//               {t("home.exploreByCategory")}
//             </h2>
//             <p className="text-xl text-gray-600">
//               {t("home.exploreByCategoryDesc")}
//             </p>
//           </div>
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
//             <div className="bg-white rounded-xl p-8 text-center shadow-lg hover:shadow-xl transition duration-300 transform hover:-translate-y-2">
//               <div className="text-6xl mb-4">🏠</div>
//               <h3 className="text-2xl font-semibold mb-3">
//                 {t("home.modernHomes")}
//               </h3>
//               <p className="text-gray-600 mb-6 leading-relaxed">
//                 {t("home.modernHomesDesc")}
//               </p>
//               <Link
//                 to="/properties?propertyType=Home"
//                 className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition duration-300"
//               >
//                 {t("home.browseHomes")}
//               </Link>
//             </div>

//             <div className="bg-white rounded-xl p-8 text-center shadow-lg hover:shadow-xl transition duration-300 transform hover:-translate-y-2">
//               <div className="text-6xl mb-4">🚗</div>
//               <h3 className="text-2xl font-semibold mb-3">
//                 {t("home.qualityVehicles")}
//               </h3>
//               <p className="text-gray-600 mb-6 leading-relaxed">
//                 {t("home.qualityVehiclesDesc")}
//               </p>
//               <Link
//                 to="/properties?propertyType=Car"
//                 className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition duration-300"
//               >
//                 {t("home.browseVehicles")}
//               </Link>
//             </div>

//             <div className="bg-white rounded-xl p-8 text-center shadow-lg hover:shadow-xl transition duration-300 transform hover:-translate-y-2">
//               <div className="text-6xl mb-4">💻</div>
//               <h3 className="text-2xl font-semibold mb-3">
//                 {t("home.electronics")}
//               </h3>
//               <p className="text-gray-600 mb-6 leading-relaxed">
//                 {t("home.electronicsDesc")}
//               </p>
//               <Link
//                 to="/properties?propertyType=Electronics"
//                 className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition duration-300"
//               >
//                 {t("home.browseElectronics")}
//               </Link>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* CTA Section */}
//       <section className="bg-gradient-to-r from-blue-600 to-purple-700 text-white py-20">
//         <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
//           <h2 className="text-3xl md:text-4xl font-bold mb-6">
//             {t("home.ctaTitle")}
//           </h2>
//           <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
//             {t("home.ctaSubtitle", { happyClients: stats.happyClients })}
//           </p>
//           {!isAuthenticated && (
//             <div className="flex flex-col sm:flex-row gap-4 justify-center">
//               <Link
//                 to="/register"
//                 className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition duration-300 transform hover:scale-105"
//               >
//                 {t("auth.createAccount")}
//               </Link>
//               <Link
//                 to="/login"
//                 className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-blue-600 transition duration-300 transform hover:scale-105"
//               >
//                 {t("auth.signIn")}
//               </Link>
//             </div>
//           )}
//           {isAuthenticated && (
//             <Link
//               to="/properties"
//               className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition duration-300 transform hover:scale-105 inline-block"
//             >
//               {t("home.browseAllProperties")}
//             </Link>
//           )}
//         </div>
//       </section>
//     </div>
//   );
// };

// export default Home;

import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";
import axios from "../../api/axios";

const Home = () => {
  const { isAuthenticated, user } = useAuth();
  const { t } = useTranslation();
  const [featuredProperties, setFeaturedProperties] = useState([]);
  const [stats, setStats] = useState({
    totalProperties: "0",
    verifiedBrokers: "0",
    happyClients: "0",
    citiesCovered: "0",
  });
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [currentPropertyIndex, setCurrentPropertyIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const carouselRef = useRef(null);

  useEffect(() => {
    fetchFeaturedProperties();
    fetchDashboardStats();
  }, []);

  useEffect(() => {
    if (featuredProperties.length > 0 && !isPaused) {
      const interval = setInterval(() => {
        setCurrentPropertyIndex(
          (prev) => (prev + 1) % featuredProperties.length
        );
      }, 5000); // 5 second delay
      return () => clearInterval(interval);
    }
  }, [featuredProperties.length, isPaused]);

  const fetchDashboardStats = async () => {
    try {
      setStatsLoading(true);
      const response = await axios.get("/api/property/public/stats");
      const data = response.data.data;

      setStats({
        totalProperties: data.totalProperties?.toString() || "0",
        verifiedBrokers: data.verifiedBrokers?.toString() || "0",
        happyClients: data.happyClients?.toString() || "0",
        citiesCovered: data.citiesCovered || "50+",
      });
    } catch (error) {
      console.error("Error fetching public stats:", error);
      try {
        await fetchBasicStats();
      } catch (fallbackError) {
        console.error("Fallback stats also failed:", fallbackError);
      }
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchBasicStats = async () => {
    try {
      const propertiesResponse = await axios.get("/api/property?limit=1");
      const totalProperties = propertiesResponse.data.total || "0";

      const usersResponse = await axios.get("/api/users/available");
      const allUsers = usersResponse.data.users || [];

      const brokers = allUsers.filter((user) => user.role === "broker").length;
      const clients = allUsers.filter((user) => user.role === "client").length;

      setStats({
        totalProperties: totalProperties.toString(),
        verifiedBrokers: brokers.toString(),
        happyClients: clients.toString(),
        citiesCovered: "50+",
      });
    } catch (error) {
      console.error("Error fetching basic stats:", error);
      throw error;
    }
  };

  const fetchFeaturedProperties = async () => {
    try {
      const response = await axios.get("/api/property?limit=10");
      const properties = response.data.properties || response.data;
      // Filter only available properties
      const availableProperties = Array.isArray(properties)
        ? properties
            .filter((property) => property.status === "Available")
            .slice(0, 10)
        : [];
      setFeaturedProperties(availableProperties);
    } catch (error) {
      console.error("Error fetching featured properties:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-ET", {
      style: "currency",
      currency: "ETB",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getPropertyIcon = (type) => {
    switch (type) {
      case "Home":
        return "🏠";
      case "Car":
        return "🚗";
      case "Electronics":
        return "💻";
      default:
        return "🏠";
    }
  };

  const goToProperty = (index) => {
    setCurrentPropertyIndex(index);
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 10000); // Resume after 10 seconds
  };

  const nextProperty = () => {
    setCurrentPropertyIndex((prev) => (prev + 1) % featuredProperties.length);
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 10000);
  };

  const prevProperty = () => {
    setCurrentPropertyIndex((prev) =>
      prev === 0 ? featuredProperties.length - 1 : prev - 1
    );
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 10000);
  };

  // Progress indicator for each property
  const PropertyProgress = ({ property, index, isActive }) => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
      if (isActive && !isPaused) {
        setProgress(0);
        const interval = setInterval(() => {
          setProgress((prev) => {
            if (prev >= 100) {
              clearInterval(interval);
              return 100;
            }
            return prev + 100 / (5000 / 100); // 5 seconds total
          });
        }, 100);
        return () => clearInterval(interval);
      } else {
        setProgress(0);
      }
    }, [isActive, isPaused]);

    return (
      <button
        onClick={() => goToProperty(index)}
        className="relative flex-1 h-2 mx-1 rounded-full overflow-hidden bg-gray-200 hover:bg-gray-300 transition-colors duration-200"
      >
        <div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-100 ease-linear"
          style={{ width: `${progress}%` }}
        />
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
            {property.title.substring(0, 20)}...
          </div>
        </div>
      </button>
    );
  };

  // Property card for the main carousel
  const PropertyCard = ({ property }) => {
    return (
      <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden w-full max-w-4xl mx-auto">
        <div className="flex flex-col lg:flex-row">
          {/* Image Section */}
          <div className="lg:w-1/2 relative h-80 lg:h-auto">
            {property.images && property.images.length > 0 ? (
              <img
                src={property.images[0]}
                alt={property.title}
                className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-100">
                <div className="text-8xl opacity-50">
                  {getPropertyIcon(property.propertyType)}
                </div>
              </div>
            )}

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-transparent to-transparent" />

            {/* Property Type Badge */}
            <div className="absolute top-6 left-6">
              <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full">
                <span className="text-2xl">
                  {getPropertyIcon(property.propertyType)}
                </span>
                <span className="text-base font-semibold text-gray-800">
                  {property.propertyType}
                </span>
              </div>
            </div>

            {/* Status Badge */}
            <div className="absolute top-6 right-6">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-full shadow-lg">
                <span className="font-bold text-sm">AVAILABLE</span>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="lg:w-1/2 p-8 lg:p-12">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-gray-400">📍</span>
              <span className="text-gray-600">{property.city}</span>
            </div>

            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              {property.title}
            </h2>

            <p className="text-gray-600 text-lg mb-6 leading-relaxed">
              {property.description}
            </p>

            {/* Price Section */}
            <div className="mb-8">
              <div className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {formatPrice(property.price)}
              </div>
              <div className="text-gray-500 mt-2">
                {property.purpose === "Sell" ? "For Sale" : "For Rent"}
              </div>
            </div>

            {/* Property Details */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-gray-50 p-4 rounded-xl">
                <div className="text-sm text-gray-500 mb-1">Type</div>
                <div className="font-semibold">{property.propertyType}</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl">
                <div className="text-sm text-gray-500 mb-1">Purpose</div>
                <div
                  className={`font-semibold ${
                    property.purpose === "Sell"
                      ? "text-green-600"
                      : "text-blue-600"
                  }`}
                >
                  {property.purpose}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Link
                to={`/property/${property._id}`}
                className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-center py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-xl"
              >
                {t("client.viewDetails")}
              </Link>
              <Link
                to={`/property/${property._id}`}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-4 px-8 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-xl"
              >
                {property.purpose === "Sell"
                  ? t("client.buyNow")
                  : t("client.rentNow")}
              </Link>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full blur-3xl" />
      </div>
    );
  };

  // Add CSS animations
  const style = `
    @keyframes slideInRight {
      from {
        opacity: 0;
        transform: translateX(100px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
    
    @keyframes slideOutLeft {
      from {
        opacity: 1;
        transform: translateX(0);
      }
      to {
        opacity: 0;
        transform: translateX(-100px);
      }
    }
    
    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }
    
    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.5;
      }
    }
    
    .slide-in {
      animation: slideInRight 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }
    
    .slide-out {
      animation: slideOutLeft 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }
    
    .animate-pulse {
      animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
  `;

  const features = [
    {
      icon: "🏠",
      title: t("home.feature1"),
      description: t("home.feature1Desc"),
    },
    {
      icon: "🤝",
      title: t("home.feature2"),
      description: t("home.feature2Desc"),
    },
    {
      icon: "💰",
      title: t("home.feature3"),
      description: t("home.feature3Desc"),
    },
    {
      icon: "⚡",
      title: t("home.feature4"),
      description: t("home.feature4Desc"),
    },
    {
      icon: "🔒",
      title: t("home.feature5"),
      description: t("home.feature5Desc"),
    },
    {
      icon: "📱",
      title: t("home.feature6"),
      description: t("home.feature6Desc"),
    },
  ];

  return (
    <div className="min-h-screen">
      <style>{style}</style>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "1s" }}
          ></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              {t("home.heroTitle")}
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90 max-w-3xl mx-auto leading-relaxed">
              {t("home.heroSubtitle")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isAuthenticated ? (
                <Link
                  to={
                    user?.role === "admin"
                      ? "/admin"
                      : user?.role === "broker"
                      ? "/broker"
                      : "/client"
                  }
                  className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition duration-300 transform hover:scale-105 shadow-lg"
                >
                  {t("navigation.dashboard")}
                </Link>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition duration-300 transform hover:scale-105 shadow-lg"
                  >
                    {t("home.getStarted")}
                  </Link>
                  <Link
                    to="/login"
                    className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-blue-600 transition duration-300 transform hover:scale-105"
                  >
                    {t("auth.signIn")}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* AVAILABLE PROPERTIES CAROUSEL SECTION */}
      <section className="bg-gradient-to-b from-white to-blue-50 py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                Available Properties
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover amazing properties available for you. Slides
              automatically every 5 seconds.
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-200 rounded-full"></div>
                <div className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-600 rounded-full animate-spin border-t-transparent"></div>
              </div>
            </div>
          ) : featuredProperties.length > 0 ? (
            <>
              {/* Main Carousel */}
              <div ref={carouselRef} className="relative mb-12">
                {/* Navigation Buttons */}
                <button
                  onClick={prevProperty}
                  onMouseEnter={() => setIsPaused(true)}
                  onMouseLeave={() =>
                    setTimeout(() => setIsPaused(false), 2000)
                  }
                  className="absolute left-4 lg:left-0 top-1/2 transform -translate-y-1/2 -translate-x-4 lg:-translate-x-8 z-10 bg-white/90 backdrop-blur-sm w-12 h-12 lg:w-16 lg:h-16 rounded-full shadow-xl flex items-center justify-center hover:bg-white hover:shadow-2xl transition-all duration-300 hover:scale-110"
                >
                  <span className="text-gray-800 text-2xl">←</span>
                </button>

                <button
                  onClick={nextProperty}
                  onMouseEnter={() => setIsPaused(true)}
                  onMouseLeave={() =>
                    setTimeout(() => setIsPaused(false), 2000)
                  }
                  className="absolute right-4 lg:right-0 top-1/2 transform -translate-y-1/2 translate-x-4 lg:translate-x-8 z-10 bg-white/90 backdrop-blur-sm w-12 h-12 lg:w-16 lg:h-16 rounded-full shadow-xl flex items-center justify-center hover:bg-white hover:shadow-2xl transition-all duration-300 hover:scale-110"
                >
                  <span className="text-gray-800 text-2xl">→</span>
                </button>

                {/* Current Property Display */}
                <div className="slide-in">
                  <PropertyCard
                    property={featuredProperties[currentPropertyIndex]}
                  />
                </div>

                {/* Carousel Indicators */}
                <div className="mt-12">
                  <div className="flex items-center justify-center mb-6">
                    <div className="text-gray-600 font-medium mr-4">
                      {currentPropertyIndex + 1} / {featuredProperties.length}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsPaused(!isPaused)}
                        className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
                      >
                        {isPaused ? (
                          <span className="text-2xl">▶️</span>
                        ) : (
                          <span className="text-2xl">⏸️</span>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Progress Bars */}
                  <div className="max-w-3xl mx-auto">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">
                        Property Rotation
                      </span>
                      <span className="text-sm text-gray-600">5s each</span>
                    </div>
                    <div className="flex items-center space-x-1 group">
                      {featuredProperties.map((property, index) => (
                        <PropertyProgress
                          key={property._id}
                          property={property}
                          index={index}
                          isActive={currentPropertyIndex === index}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* View All Button */}
              <div className="text-center">
                <Link
                  to="/properties?status=Available"
                  className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-10 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl shadow-lg"
                >
                  <span>View All Available Properties</span>
                  <span className="group-hover:translate-x-2 transition-transform duration-300">
                    →
                  </span>
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-20 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl">
              <div className="text-8xl mb-6 opacity-50">🏠</div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                No Available Properties Found
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                All properties are currently occupied. Check back soon!
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {Object.entries(stats).map(([key, value], index) => (
              <div
                key={key}
                className="p-6 transform hover:scale-105 transition duration-300"
              >
                {statsLoading ? (
                  <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded mb-2 mx-auto w-20"></div>
                    <div className="h-4 bg-gray-200 rounded mx-auto w-24"></div>
                  </div>
                ) : (
                  <>
                    <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">
                      {value}
                      {(key === "totalProperties" ||
                        key === "verifiedBrokers" ||
                        key === "happyClients") &&
                        "+"}
                    </div>
                    <div className="text-gray-600 font-medium">
                      {key === "totalProperties" && t("home.totalProperties")}
                      {key === "verifiedBrokers" && t("home.verifiedBrokers")}
                      {key === "happyClients" && t("home.happyClients")}
                      {key === "citiesCovered" && t("home.citiesCovered")}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* AVAILABLE PROPERTIES CAROUSEL SECTION */}
      <section className="bg-gradient-to-b from-white to-blue-50 py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                Available Properties
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover amazing properties available for you. Slides
              automatically every 5 seconds.
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-200 rounded-full"></div>
                <div className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-600 rounded-full animate-spin border-t-transparent"></div>
              </div>
            </div>
          ) : featuredProperties.length > 0 ? (
            <>
              {/* Main Carousel */}
              <div className="relative mb-12">
                {/* Navigation Buttons */}
                <button
                  onClick={() => {}}
                  className="absolute left-4 lg:left-0 top-1/2 transform -translate-y-1/2 -translate-x-4 lg:-translate-x-8 z-10 bg-white/90 backdrop-blur-sm w-12 h-12 lg:w-16 lg:h-16 rounded-full shadow-xl flex items-center justify-center hover:bg-white hover:shadow-2xl transition-all duration-300 hover:scale-110"
                >
                  <span className="text-gray-800 text-2xl">←</span>
                </button>

                <button
                  onClick={() => {}}
                  className="absolute right-4 lg:right-0 top-1/2 transform -translate-y-1/2 translate-x-4 lg:translate-x-8 z-10 bg-white/90 backdrop-blur-sm w-12 h-12 lg:w-16 lg:h-16 rounded-full shadow-xl flex items-center justify-center hover:bg-white hover:shadow-2xl transition-all duration-300 hover:scale-110"
                >
                  <span className="text-gray-800 text-2xl">→</span>
                </button>

                {/* Current Property Display */}
                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden w-full max-w-4xl mx-auto">
                  <div className="flex flex-col lg:flex-row">
                    {/* Image Section */}
                    <div className="lg:w-1/2 relative h-80 lg:h-auto">
                      {featuredProperties[0]?.images &&
                      featuredProperties[0]?.images.length > 0 ? (
                        <img
                          src={featuredProperties[0].images[0]}
                          alt={featuredProperties[0].title}
                          className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-100">
                          <div className="text-8xl opacity-50">
                            {featuredProperties[0]?.propertyType === "Home"
                              ? "🏠"
                              : featuredProperties[0]?.propertyType === "Car"
                              ? "🚗"
                              : "💻"}
                          </div>
                        </div>
                      )}

                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-transparent to-transparent" />

                      {/* Property Type Badge */}
                      <div className="absolute top-6 left-6">
                        <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full">
                          <span className="text-2xl">
                            {featuredProperties[0]?.propertyType === "Home"
                              ? "🏠"
                              : featuredProperties[0]?.propertyType === "Car"
                              ? "🚗"
                              : "💻"}
                          </span>
                          <span className="text-base font-semibold text-gray-800">
                            {featuredProperties[0]?.propertyType}
                          </span>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="absolute top-6 right-6">
                        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-full shadow-lg">
                          <span className="font-bold text-sm">AVAILABLE</span>
                        </div>
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="lg:w-1/2 p-8 lg:p-12">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-gray-400">📍</span>
                        <span className="text-gray-600">
                          {featuredProperties[0]?.city}
                        </span>
                      </div>

                      <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                        {featuredProperties[0]?.title}
                      </h2>

                      <p className="text-gray-600 text-lg mb-6 leading-relaxed">
                        {featuredProperties[0]?.description}
                      </p>

                      {/* Price Section */}
                      <div className="mb-8">
                        <div className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                          {formatPrice(featuredProperties[0]?.price)}
                        </div>
                        <div className="text-gray-500 mt-2">
                          {featuredProperties[0]?.purpose === "Sell"
                            ? "For Sale"
                            : "For Rent"}
                        </div>
                      </div>

                      {/* Property Details */}
                      <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-gray-50 p-4 rounded-xl">
                          <div className="text-sm text-gray-500 mb-1">Type</div>
                          <div className="font-semibold">
                            {featuredProperties[0]?.propertyType}
                          </div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-xl">
                          <div className="text-sm text-gray-500 mb-1">
                            Purpose
                          </div>
                          <div
                            className={`font-semibold ${
                              featuredProperties[0]?.purpose === "Sell"
                                ? "text-green-600"
                                : "text-blue-600"
                            }`}
                          >
                            {featuredProperties[0]?.purpose}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-4">
                        <Link
                          to={`/property/${featuredProperties[0]?._id}`}
                          className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-center py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-xl"
                        >
                          {t("client.viewDetails")}
                        </Link>
                        <Link
                          to={`/property/${featuredProperties[0]?._id}`}
                          className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-4 px-8 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-xl"
                        >
                          {featuredProperties[0]?.purpose === "Sell"
                            ? t("client.buyNow")
                            : t("client.rentNow")}
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Decorative Elements */}
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-3xl" />
                  <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full blur-3xl" />
                </div>

                {/* Carousel Indicators */}
                <div className="mt-12">
                  <div className="flex items-center justify-center mb-6">
                    <div className="text-gray-600 font-medium mr-4">
                      1 / {featuredProperties.length}
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200">
                        <span className="text-2xl">⏸️</span>
                      </button>
                    </div>
                  </div>

                  {/* Progress Bars */}
                  <div className="max-w-3xl mx-auto">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">
                        Property Rotation
                      </span>
                      <span className="text-sm text-gray-600">5s each</span>
                    </div>
                    <div className="flex items-center space-x-1 group">
                      {featuredProperties.slice(0, 5).map((property, index) => (
                        <button
                          key={property._id}
                          className="relative flex-1 h-2 mx-1 rounded-full overflow-hidden bg-gray-200 hover:bg-gray-300 transition-colors duration-200"
                        >
                          <div
                            className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-purple-500"
                            style={{ width: index === 0 ? "30%" : "0%" }}
                          />
                          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <div className="bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                              {property.title.substring(0, 20)}...
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* View All Button */}
              <div className="text-center">
                <Link
                  to="/properties?status=Available"
                  className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-10 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl shadow-lg"
                >
                  <span>View All Available Properties</span>
                  <span className="group-hover:translate-x-2 transition-transform duration-300">
                    →
                  </span>
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-20 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl">
              <div className="text-8xl mb-6 opacity-50">🏠</div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                No Available Properties Found
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                All properties are currently occupied. Check back soon!
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t("home.featuresTitle")}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t("home.featuresSubtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white p-8 rounded-xl shadow-md hover:shadow-xl transition duration-300 transform hover:-translate-y-1"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Property Types Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t("home.exploreByCategory")}
            </h2>
            <p className="text-xl text-gray-600">
              {t("home.exploreByCategoryDesc")}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-8 text-center shadow-lg hover:shadow-xl transition duration-300 transform hover:-translate-y-2">
              <div className="text-6xl mb-4">🏠</div>
              <h3 className="text-2xl font-semibold mb-3">
                {t("home.modernHomes")}
              </h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                {t("home.modernHomesDesc")}
              </p>
              <Link
                to="/properties?propertyType=Home"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition duration-300"
              >
                {t("home.browseHomes")}
              </Link>
            </div>

            <div className="bg-white rounded-xl p-8 text-center shadow-lg hover:shadow-xl transition duration-300 transform hover:-translate-y-2">
              <div className="text-6xl mb-4">🚗</div>
              <h3 className="text-2xl font-semibold mb-3">
                {t("home.qualityVehicles")}
              </h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                {t("home.qualityVehiclesDesc")}
              </p>
              <Link
                to="/properties?propertyType=Car"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition duration-300"
              >
                {t("home.browseVehicles")}
              </Link>
            </div>

            <div className="bg-white rounded-xl p-8 text-center shadow-lg hover:shadow-xl transition duration-300 transform hover:-translate-y-2">
              <div className="text-6xl mb-4">💻</div>
              <h3 className="text-2xl font-semibold mb-3">
                {t("home.electronics")}
              </h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                {t("home.electronicsDesc")}
              </p>
              <Link
                to="/properties?propertyType=Electronics"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition duration-300"
              >
                {t("home.browseElectronics")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-700 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            {t("home.ctaTitle")}
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            {t("home.ctaSubtitle", { happyClients: stats.happyClients })}
          </p>
          {!isAuthenticated && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition duration-300 transform hover:scale-105"
              >
                {t("auth.createAccount")}
              </Link>
              <Link
                to="/login"
                className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-blue-600 transition duration-300 transform hover:scale-105"
              >
                {t("auth.signIn")}
              </Link>
            </div>
          )}
          {isAuthenticated && (
            <Link
              to="/properties"
              className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition duration-300 transform hover:scale-105 inline-block"
            >
              {t("home.browseAllProperties")}
            </Link>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
