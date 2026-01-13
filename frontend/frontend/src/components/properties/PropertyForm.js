// import React, { useState, useEffect } from "react";
// import { uploadMultipleToCloudinary } from "../../utils/cloudinary";
// import { useTranslation } from "react-i18next";

// const PropertyForm = ({
//   onSubmit,
//   onCancel,
//   loading,
//   submitButtonText = "Submit",
//   initialData = null,
//   isEdit = false,
// }) => {
//   const { t } = useTranslation();

//   const [formData, setFormData] = useState({
//     title: "",
//     description: "",
//     propertyType: "Home",
//     purpose: "Sell",
//     price: "",
//     currency: "ETB",
//     city: "",
//     location: "",
//     images: [],
//     homeDetails: {
//       size: "",
//       bedrooms: "",
//       bathrooms: "",
//       floors: "",
//       yearBuilt: "",
//       amenities: "",
//       condition: "Good",
//     },
//     carDetails: {
//       brand: "",
//       model: "",
//       year: "",
//       mileage: "",
//       fuelType: "Petrol",
//       transmission: "Manual",
//     },
//     electronicsDetails: {
//       category: "",
//       brand: "",
//       model: "",
//       specifications: "",
//       condition: "New",
//       warranty: false,
//       warrantyPeriod: "",
//     },
//   });

//   const [uploading, setUploading] = useState(false);
//   const [uploadProgress, setUploadProgress] = useState(0);

//   // Initialize form with existing data when editing
//   useEffect(() => {
//     if (initialData && isEdit) {
//       setFormData({
//         title: initialData.title || "",
//         description: initialData.description || "",
//         propertyType: initialData.propertyType || "Home",
//         purpose: initialData.purpose || "Sell",
//         price: initialData.price || "",
//         currency: initialData.currency || "ETB",
//         city: initialData.city || "",
//         location: initialData.location || "",
//         images: initialData.images || [],
//         homeDetails: initialData.homeDetails || {
//           size: "",
//           bedrooms: "",
//           bathrooms: "",
//           floors: "",
//           yearBuilt: "",
//           amenities: "",
//           condition: "Good",
//         },
//         carDetails: initialData.carDetails || {
//           brand: "",
//           model: "",
//           year: "",
//           mileage: "",
//           fuelType: "Petrol",
//           transmission: "Manual",
//         },
//         electronicsDetails: initialData.electronicsDetails || {
//           category: "",
//           brand: "",
//           model: "",
//           specifications: "",
//           condition: "New",
//           warranty: false,
//           warrantyPeriod: "",
//         },
//       });
//     }
//   }, [initialData, isEdit]);

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({
//       ...prev,
//       [name]: value,
//     }));
//   };

//   const handleNestedChange = (section, field, value) => {
//     setFormData((prev) => ({
//       ...prev,
//       [section]: {
//         ...prev[section],
//         [field]: value,
//       },
//     }));
//   };

//   const handleImageUpload = async (e) => {
//     const files = Array.from(e.target.files);

//     if (files.length === 0) return;

//     setUploading(true);
//     setUploadProgress(0);

//     try {
//       // Create temporary local URLs for preview
//       const tempUrls = files.map((file) => URL.createObjectURL(file));

//       // Update form with temporary images first
//       setFormData((prev) => ({
//         ...prev,
//         images: [
//           ...prev.images,
//           ...tempUrls.map((url) => ({ tempUrl: url, isUploading: true })),
//         ],
//       }));

//       // Upload to Cloudinary
//       const cloudinaryUrls = await uploadMultipleToCloudinary(files);

//       // Replace temporary URLs with Cloudinary URLs
//       setFormData((prev) => {
//         const newImages = [...prev.images];
//         const tempImageCount = tempUrls.length;

//         // Replace the last N temporary images (the ones we just added)
//         const startIndex = newImages.length - tempImageCount;
//         cloudinaryUrls.forEach((url, index) => {
//           newImages[startIndex + index] = url;
//         });

//         return {
//           ...prev,
//           images: newImages,
//         };
//       });

//       setUploadProgress(100);
//     } catch (error) {
//       console.error("Error uploading images:", error);
//       // Remove the temporary images if upload fails
//       setFormData((prev) => ({
//         ...prev,
//         images: prev.images.filter((img) => !img.isUploading),
//       }));
//       alert(t("properties.form.imageUploadError"));
//     } finally {
//       setUploading(false);
//       setUploadProgress(0);
//     }
//   };

//   const removeImage = (index) => {
//     setFormData((prev) => ({
//       ...prev,
//       images: prev.images.filter((_, i) => i !== index),
//     }));
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();

//     // Filter out any temporary objects and ensure we only send strings
//     const finalFormData = {
//       ...formData,
//       images: formData.images
//         .filter((img) => typeof img === "string" || img.url)
//         .map((img) => (typeof img === "string" ? img : img.url)),
//     };

//     onSubmit(finalFormData);
//   };

//   const renderPropertySpecificFields = () => {
//     switch (formData.propertyType) {
//       case "Home":
//         return (
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 {t("properties.form.home.size")} *
//               </label>
//               <input
//                 type="number"
//                 value={formData.homeDetails.size}
//                 onChange={(e) =>
//                   handleNestedChange("homeDetails", "size", e.target.value)
//                 }
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
//                 required
//                 min="1"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 {t("properties.form.home.bedrooms")} *
//               </label>
//               <input
//                 type="number"
//                 value={formData.homeDetails.bedrooms}
//                 onChange={(e) =>
//                   handleNestedChange("homeDetails", "bedrooms", e.target.value)
//                 }
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
//                 required
//                 min="1"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 {t("properties.form.home.bathrooms")} *
//               </label>
//               <input
//                 type="number"
//                 value={formData.homeDetails.bathrooms}
//                 onChange={(e) =>
//                   handleNestedChange("homeDetails", "bathrooms", e.target.value)
//                 }
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
//                 required
//                 min="1"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 {t("properties.form.home.floors")} *
//               </label>
//               <input
//                 type="number"
//                 value={formData.homeDetails.floors}
//                 onChange={(e) =>
//                   handleNestedChange("homeDetails", "floors", e.target.value)
//                 }
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
//                 required
//                 min="1"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 {t("properties.form.home.yearBuilt")} *
//               </label>
//               <input
//                 type="number"
//                 value={formData.homeDetails.yearBuilt}
//                 onChange={(e) =>
//                   handleNestedChange("homeDetails", "yearBuilt", e.target.value)
//                 }
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
//                 required
//                 min="1900"
//                 max={new Date().getFullYear()}
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 {t("properties.form.home.condition")} *
//               </label>
//               <select
//                 value={formData.homeDetails.condition}
//                 onChange={(e) =>
//                   handleNestedChange("homeDetails", "condition", e.target.value)
//                 }
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
//                 required
//               >
//                 <option value="Excellent">
//                   {t("properties.form.conditions.excellent")}
//                 </option>
//                 <option value="Good">
//                   {t("properties.form.conditions.good")}
//                 </option>
//                 <option value="Fair">
//                   {t("properties.form.conditions.fair")}
//                 </option>
//                 <option value="Needs Repair">
//                   {t("properties.form.conditions.needsRepair")}
//                 </option>
//               </select>
//             </div>
//             <div className="md:col-span-2">
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 {t("properties.form.home.amenities")} *
//               </label>
//               <textarea
//                 value={formData.homeDetails.amenities}
//                 onChange={(e) =>
//                   handleNestedChange("homeDetails", "amenities", e.target.value)
//                 }
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
//                 placeholder={t("properties.form.home.amenitiesPlaceholder")}
//                 required
//                 rows="3"
//               />
//             </div>
//           </div>
//         );

//       case "Car":
//         return (
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 {t("properties.form.car.brand")} *
//               </label>
//               <input
//                 type="text"
//                 value={formData.carDetails.brand}
//                 onChange={(e) =>
//                   handleNestedChange("carDetails", "brand", e.target.value)
//                 }
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
//                 placeholder={t("properties.form.car.brandPlaceholder")}
//                 required
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 {t("properties.form.car.model")} *
//               </label>
//               <input
//                 type="text"
//                 value={formData.carDetails.model}
//                 onChange={(e) =>
//                   handleNestedChange("carDetails", "model", e.target.value)
//                 }
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
//                 placeholder={t("properties.form.car.modelPlaceholder")}
//                 required
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 {t("properties.form.car.year")} *
//               </label>
//               <input
//                 type="number"
//                 value={formData.carDetails.year}
//                 onChange={(e) =>
//                   handleNestedChange("carDetails", "year", e.target.value)
//                 }
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
//                 required
//                 min="1900"
//                 max={new Date().getFullYear()}
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 {t("properties.form.car.mileage")} *
//               </label>
//               <input
//                 type="number"
//                 value={formData.carDetails.mileage}
//                 onChange={(e) =>
//                   handleNestedChange("carDetails", "mileage", e.target.value)
//                 }
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
//                 required
//                 min="0"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 {t("properties.form.car.fuelType")} *
//               </label>
//               <select
//                 value={formData.carDetails.fuelType}
//                 onChange={(e) =>
//                   handleNestedChange("carDetails", "fuelType", e.target.value)
//                 }
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
//                 required
//               >
//                 <option value="Petrol">
//                   {t("properties.form.car.fuelTypes.petrol")}
//                 </option>
//                 <option value="Diesel">
//                   {t("properties.form.car.fuelTypes.diesel")}
//                 </option>
//                 <option value="Electric">
//                   {t("properties.form.car.fuelTypes.electric")}
//                 </option>
//                 <option value="Hybrid">
//                   {t("properties.form.car.fuelTypes.hybrid")}
//                 </option>
//               </select>
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 {t("properties.form.car.transmission")} *
//               </label>
//               <select
//                 value={formData.carDetails.transmission}
//                 onChange={(e) =>
//                   handleNestedChange(
//                     "carDetails",
//                     "transmission",
//                     e.target.value
//                   )
//                 }
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
//                 required
//               >
//                 <option value="Manual">
//                   {t("properties.form.car.transmissions.manual")}
//                 </option>
//                 <option value="Automatic">
//                   {t("properties.form.car.transmissions.automatic")}
//                 </option>
//               </select>
//             </div>
//           </div>
//         );

//       case "Electronics":
//         return (
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 {t("properties.form.electronics.category")} *
//               </label>
//               <input
//                 type="text"
//                 value={formData.electronicsDetails.category}
//                 onChange={(e) =>
//                   handleNestedChange(
//                     "electronicsDetails",
//                     "category",
//                     e.target.value
//                   )
//                 }
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
//                 placeholder={t(
//                   "properties.form.electronics.categoryPlaceholder"
//                 )}
//                 required
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 {t("properties.form.electronics.brand")} *
//               </label>
//               <input
//                 type="text"
//                 value={formData.electronicsDetails.brand}
//                 onChange={(e) =>
//                   handleNestedChange(
//                     "electronicsDetails",
//                     "brand",
//                     e.target.value
//                   )
//                 }
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
//                 placeholder={t("properties.form.electronics.brandPlaceholder")}
//                 required
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 {t("properties.form.electronics.model")} *
//               </label>
//               <input
//                 type="text"
//                 value={formData.electronicsDetails.model}
//                 onChange={(e) =>
//                   handleNestedChange(
//                     "electronicsDetails",
//                     "model",
//                     e.target.value
//                   )
//                 }
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
//                 placeholder={t("properties.form.electronics.modelPlaceholder")}
//                 required
//               />
//             </div>

//             <div className="md:col-span-2">
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 {t("properties.form.electronics.specifications")} *
//               </label>
//               <textarea
//                 value={formData.electronicsDetails.specifications}
//                 onChange={(e) =>
//                   handleNestedChange(
//                     "electronicsDetails",
//                     "specifications",
//                     e.target.value
//                   )
//                 }
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
//                 placeholder={t(
//                   "properties.form.electronics.specificationsPlaceholder"
//                 )}
//                 required
//                 rows="4"
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 {t("properties.form.electronics.condition")} *
//               </label>
//               <select
//                 value={formData.electronicsDetails.condition}
//                 onChange={(e) =>
//                   handleNestedChange(
//                     "electronicsDetails",
//                     "condition",
//                     e.target.value
//                   )
//                 }
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
//                 required
//               >
//                 <option value="New">
//                   {t("properties.form.conditions.new")}
//                 </option>
//                 <option value="Used">
//                   {t("properties.form.conditions.used")}
//                 </option>
//                 <option value="Refurbished">
//                   {t("properties.form.conditions.refurbished")}
//                 </option>
//               </select>
//             </div>

//             <div className="flex items-center space-x-2">
//               <input
//                 type="checkbox"
//                 checked={formData.electronicsDetails.warranty}
//                 onChange={(e) =>
//                   handleNestedChange(
//                     "electronicsDetails",
//                     "warranty",
//                     e.target.checked
//                   )
//                 }
//                 className="w-5 h-5 text-blue-600 border-gray-300 rounded"
//               />
//               <label className="text-gray-700">
//                 {t("properties.form.electronics.hasWarranty")}
//               </label>
//             </div>

//             {formData.electronicsDetails.warranty && (
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   {t("properties.form.electronics.warrantyPeriod")}
//                 </label>
//                 <input
//                   type="text"
//                   value={formData.electronicsDetails.warrantyPeriod}
//                   onChange={(e) =>
//                     handleNestedChange(
//                       "electronicsDetails",
//                       "warrantyPeriod",
//                       e.target.value
//                     )
//                   }
//                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
//                   placeholder={t(
//                     "properties.form.electronics.warrantyPlaceholder"
//                   )}
//                 />
//               </div>
//             )}
//           </div>
//         );

//       default:
//         return null;
//     }
//   };

//   return (
//     <div className="bg-white rounded-lg shadow-lg p-6">
//       {isEdit && (
//         <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
//           <div className="flex items-center">
//             <svg
//               className="w-5 h-5 text-yellow-600 mr-2"
//               fill="currentColor"
//               viewBox="0 0 20 20"
//             >
//               <path
//                 fillRule="evenodd"
//                 d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
//                 clipRule="evenodd"
//               />
//             </svg>
//             <p className="text-yellow-700 text-sm">
//               <strong>{t("properties.form.editNote.title")}:</strong>{" "}
//               {t("properties.form.editNote.description")}
//             </p>
//           </div>
//         </div>
//       )}

//       <form onSubmit={handleSubmit} className="space-y-6">
//         {/* Basic Information */}
//         <div>
//           <h3 className="text-lg font-semibold mb-4 text-gray-900">
//             {t("properties.form.sections.basicInfo")}
//           </h3>
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 {t("properties.form.propertyType")} *
//               </label>
//               <select
//                 name="propertyType"
//                 value={formData.propertyType}
//                 onChange={handleInputChange}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
//                 required
//                 disabled={isEdit} // Cannot change property type when editing
//               >
//                 <option value="Home">
//                   {t("properties.propertyTypes.home")}
//                 </option>
//                 <option value="Car">{t("properties.propertyTypes.car")}</option>
//                 <option value="Electronics">
//                   {t("properties.propertyTypes.electronics")}
//                 </option>
//               </select>
//               {isEdit && (
//                 <p className="text-xs text-gray-500 mt-1">
//                   {t("properties.form.cannotChangeType")}
//                 </p>
//               )}
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 {t("properties.form.purpose")} *
//               </label>
//               <select
//                 name="purpose"
//                 value={formData.purpose}
//                 onChange={handleInputChange}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
//                 required
//                 disabled={isEdit} // Cannot change purpose when editing
//               >
//                 <option value="Sell">{t("properties.purposes.sell")}</option>
//                 <option value="Rent">{t("properties.purposes.rent")}</option>
//               </select>
//               {isEdit && (
//                 <p className="text-xs text-gray-500 mt-1">
//                   {t("properties.form.cannotChangePurpose")}
//                 </p>
//               )}
//             </div>
//             <div className="md:col-span-2">
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 {t("properties.form.title")} *
//               </label>
//               <input
//                 type="text"
//                 name="title"
//                 value={formData.title}
//                 onChange={handleInputChange}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
//                 placeholder={t("properties.form.titlePlaceholder")}
//                 required
//               />
//             </div>
//             <div className="md:col-span-2">
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 {t("properties.form.description")} *
//               </label>
//               <textarea
//                 name="description"
//                 value={formData.description}
//                 onChange={handleInputChange}
//                 rows="4"
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
//                 placeholder={t("properties.form.descriptionPlaceholder")}
//                 required
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 {t("properties.form.price")} *
//               </label>
//               <input
//                 type="number"
//                 name="price"
//                 value={formData.price}
//                 onChange={handleInputChange}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
//                 required
//                 min="1"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 {t("properties.form.city")} *
//               </label>
//               <input
//                 type="text"
//                 name="city"
//                 value={formData.city}
//                 onChange={handleInputChange}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
//                 required
//               />
//             </div>
//             <div className="md:col-span-2">
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 {t("properties.form.location")} *
//               </label>
//               <input
//                 type="text"
//                 name="location"
//                 value={formData.location}
//                 onChange={handleInputChange}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
//                 placeholder={t("properties.form.locationPlaceholder")}
//                 required
//               />
//             </div>
//           </div>
//         </div>

//         {/* Property Specific Details */}
//         <div>
//           <h3 className="text-lg font-semibold mb-4 text-gray-900">
//             {t(
//               `properties.propertyTypes.${formData.propertyType.toLowerCase()}`
//             )}{" "}
//             {t("properties.form.sections.details")}
//           </h3>
//           {renderPropertySpecificFields()}
//         </div>

//         {/* Image Upload */}
//         <div>
//           <h3 className="text-lg font-semibold mb-4 text-gray-900">
//             {t("properties.form.sections.images")}
//           </h3>

//           {/* Upload Progress */}
//           {uploading && (
//             <div className="mb-4">
//               <div className="flex justify-between text-sm text-gray-600 mb-1">
//                 <span>{t("properties.form.uploadingImages")}</span>
//                 <span>{uploadProgress}%</span>
//               </div>
//               <div className="w-full bg-gray-200 rounded-full h-2">
//                 <div
//                   className="bg-blue-600 h-2 rounded-full transition-all duration-300"
//                   style={{ width: `${uploadProgress}%` }}
//                 ></div>
//               </div>
//             </div>
//           )}

//           <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
//             <input
//               type="file"
//               multiple
//               accept="image/*"
//               onChange={handleImageUpload}
//               className="hidden"
//               id="image-upload"
//               disabled={uploading}
//             />
//             <label
//               htmlFor="image-upload"
//               className={`cursor-pointer px-6 py-3 rounded-lg font-semibold inline-block transition duration-200 ${
//                 uploading
//                   ? "bg-gray-400 text-gray-200 cursor-not-allowed"
//                   : "bg-blue-600 hover:bg-blue-700 text-white"
//               }`}
//             >
//               {uploading
//                 ? t("properties.form.uploading")
//                 : t("properties.form.addImages")}
//             </label>
//             <p className="text-sm text-gray-500 mt-2">
//               {t("properties.form.imageUploadHint")}
//             </p>
//           </div>

//           {/* Image Preview */}
//           {formData.images.length > 0 && (
//             <div className="mt-4">
//               <p className="text-sm text-gray-600 mb-2">
//                 {formData.images.length}{" "}
//                 {t("properties.form.imagesSelected", {
//                   count: formData.images.length,
//                 })}
//               </p>
//               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//                 {formData.images.map((image, index) => (
//                   <div key={index} className="relative">
//                     <img
//                       src={image.tempUrl || image}
//                       alt={`${t("properties.form.property")} ${index + 1}`}
//                       className={`w-full h-24 object-cover rounded-lg ${
//                         image.isUploading ? "opacity-50" : ""
//                       }`}
//                     />
//                     {image.isUploading && (
//                       <div className="absolute inset-0 flex items-center justify-center">
//                         <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
//                       </div>
//                     )}
//                     <button
//                       type="button"
//                       onClick={() => removeImage(index)}
//                       disabled={uploading}
//                       className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 disabled:bg-gray-400"
//                     >
//                       ×
//                     </button>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           )}
//         </div>

//         {/* Submit Buttons */}
//         <div className="flex justify-end space-x-4 pt-6 border-t">
//           <button
//             type="button"
//             onClick={onCancel}
//             disabled={uploading}
//             className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition duration-200 disabled:opacity-50"
//           >
//             {t("common.cancel")}
//           </button>
//           <button
//             type="submit"
//             disabled={loading || uploading}
//             className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-8 py-3 rounded-lg font-semibold transition duration-200"
//           >
//             {loading ? (
//               <span className="flex items-center">
//                 <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
//                 {isEdit
//                   ? t("properties.form.updating")
//                   : t("properties.form.creating")}
//               </span>
//             ) : (
//               submitButtonText
//             )}
//           </button>
//         </div>
//       </form>
//     </div>
//   );
// };

// export default PropertyForm;

import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  AiOutlineUpload,
  AiOutlineCamera,
  AiOutlineVideoCamera,
  AiOutlineDelete,
  AiOutlineRight,
  AiOutlineHome,
  AiOutlineCar,
  AiOutlineMobile,
} from "react-icons/ai";
import { uploadMultipleToCloudinary } from "../../utils/cloudinary";

const PropertyForm = ({
  onSubmit,
  onCancel,
  loading,
  submitButtonText = "Submit",
  initialData = null,
  isEdit = false,
}) => {
  const { t } = useTranslation();
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    propertyType: "Home",
    purpose: "Sell",
    price: "",
    currency: "ETB",
    city: "",
    location: "",
    images: [],
    videos: [],
    homeDetails: {
      size: "",
      bedrooms: "",
      bathrooms: "",
      floors: "",
      yearBuilt: "",
      amenities: "",
      condition: "Good",
    },
    carDetails: {
      brand: "",
      model: "",
      year: "",
      mileage: "",
      fuelType: "Petrol",
      transmission: "Manual",
    },
    electronicsDetails: {
      category: "",
      brand: "",
      model: "",
      specifications: "",
      condition: "New",
      warranty: false,
      warrantyPeriod: "",
    },
  });

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [activeStep, setActiveStep] = useState(1);
  const [isDragging, setIsDragging] = useState(false);

  // Initialize form with existing data when editing
  useEffect(() => {
    if (initialData && isEdit) {
      setFormData({
        title: initialData.title || "",
        description: initialData.description || "",
        propertyType: initialData.propertyType || "Home",
        purpose: initialData.purpose || "Sell",
        price: initialData.price || "",
        currency: initialData.currency || "ETB",
        city: initialData.city || "",
        location: initialData.location || "",
        images: initialData.images || [],
        videos: initialData.videos || [],
        homeDetails: initialData.homeDetails || {
          size: "",
          bedrooms: "",
          bathrooms: "",
          floors: "",
          yearBuilt: "",
          amenities: "",
          condition: "Good",
        },
        carDetails: initialData.carDetails || {
          brand: "",
          model: "",
          year: "",
          mileage: "",
          fuelType: "Petrol",
          transmission: "Manual",
        },
        electronicsDetails: initialData.electronicsDetails || {
          category: "",
          brand: "",
          model: "",
          specifications: "",
          condition: "New",
          warranty: false,
          warrantyPeriod: "",
        },
      });
    }
  }, [initialData, isEdit]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNestedChange = (section, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e, type = "images") => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    await handleFileUpload(files, type);
  };

  const handleFileUpload = async (files, type = "images") => {
    const validFiles = files.filter((file) => {
      if (type === "images") {
        return file.type.startsWith("image/");
      } else {
        return file.type.startsWith("video/");
      }
    });

    if (validFiles.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      // Create temporary URLs for preview
      const tempUrls = validFiles.map((file) => ({
        tempUrl: URL.createObjectURL(file),
        isUploading: true,
        name: file.name,
        type: file.type,
        size: file.size,
      }));

      // Update form with temporary files
      setFormData((prev) => ({
        ...prev,
        [type]: [...prev[type], ...tempUrls],
      }));

      // Upload to Cloudinary
      const cloudinaryUrls = await uploadMultipleToCloudinary(validFiles);

      // Replace temporary URLs with Cloudinary URLs
      setFormData((prev) => {
        const newFiles = [...prev[type]];
        const startIndex = newFiles.length - validFiles.length;

        cloudinaryUrls.forEach((url, index) => {
          newFiles[startIndex + index] = url;
        });

        return {
          ...prev,
          [type]: newFiles,
        };
      });

      setUploadProgress(100);
    } catch (error) {
      console.error(`Error uploading ${type}:`, error);
      // Remove temporary files if upload fails
      setFormData((prev) => ({
        ...prev,
        [type]: prev[type].filter((file) => !file.isUploading),
      }));
      alert(t(`properties.form.${type}UploadError`));
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    await handleFileUpload(files, "images");
  };

  const handleVideoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    await handleFileUpload(files, "videos");
  };

  const removeFile = (type, index) => {
    setFormData((prev) => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Filter out any temporary objects and ensure we only send strings
    const finalFormData = {
      ...formData,
      images: formData.images
        .filter((img) => typeof img === "string" || img.url)
        .map((img) => (typeof img === "string" ? img : img.url)),
      videos: formData.videos
        .filter((video) => typeof video === "string" || video.url)
        .map((video) => (typeof video === "string" ? video : video.url)),
    };

    onSubmit(finalFormData);
  };

  const renderPropertySpecificFields = () => {
    switch (formData.propertyType) {
      case "Home":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("properties.form.home.size")} *
              </label>
              <input
                type="number"
                value={formData.homeDetails.size}
                onChange={(e) =>
                  handleNestedChange("homeDetails", "size", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF4747]"
                required
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("properties.form.home.bedrooms")} *
              </label>
              <input
                type="number"
                value={formData.homeDetails.bedrooms}
                onChange={(e) =>
                  handleNestedChange("homeDetails", "bedrooms", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF4747]"
                required
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("properties.form.home.bathrooms")} *
              </label>
              <input
                type="number"
                value={formData.homeDetails.bathrooms}
                onChange={(e) =>
                  handleNestedChange("homeDetails", "bathrooms", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF4747]"
                required
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("properties.form.home.floors")} *
              </label>
              <input
                type="number"
                value={formData.homeDetails.floors}
                onChange={(e) =>
                  handleNestedChange("homeDetails", "floors", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF4747]"
                required
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("properties.form.home.yearBuilt")} *
              </label>
              <input
                type="number"
                value={formData.homeDetails.yearBuilt}
                onChange={(e) =>
                  handleNestedChange("homeDetails", "yearBuilt", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF4747]"
                required
                min="1900"
                max={new Date().getFullYear()}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("properties.form.home.condition")} *
              </label>
              <select
                value={formData.homeDetails.condition}
                onChange={(e) =>
                  handleNestedChange("homeDetails", "condition", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF4747]"
                required
              >
                <option value="Excellent">
                  {t("properties.form.conditions.excellent")}
                </option>
                <option value="Good">
                  {t("properties.form.conditions.good")}
                </option>
                <option value="Fair">
                  {t("properties.form.conditions.fair")}
                </option>
                <option value="Needs Repair">
                  {t("properties.form.conditions.needsRepair")}
                </option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("properties.form.home.amenities")} *
              </label>
              <textarea
                value={formData.homeDetails.amenities}
                onChange={(e) =>
                  handleNestedChange("homeDetails", "amenities", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF4747]"
                placeholder={t("properties.form.home.amenitiesPlaceholder")}
                required
                rows="3"
              />
            </div>
          </div>
        );

      case "Car":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("properties.form.car.brand")} *
              </label>
              <input
                type="text"
                value={formData.carDetails.brand}
                onChange={(e) =>
                  handleNestedChange("carDetails", "brand", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF4747]"
                placeholder={t("properties.form.car.brandPlaceholder")}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("properties.form.car.model")} *
              </label>
              <input
                type="text"
                value={formData.carDetails.model}
                onChange={(e) =>
                  handleNestedChange("carDetails", "model", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF4747]"
                placeholder={t("properties.form.car.modelPlaceholder")}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("properties.form.car.year")} *
              </label>
              <input
                type="number"
                value={formData.carDetails.year}
                onChange={(e) =>
                  handleNestedChange("carDetails", "year", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF4747]"
                required
                min="1900"
                max={new Date().getFullYear()}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("properties.form.car.mileage")} *
              </label>
              <input
                type="number"
                value={formData.carDetails.mileage}
                onChange={(e) =>
                  handleNestedChange("carDetails", "mileage", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF4747]"
                required
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("properties.form.car.fuelType")} *
              </label>
              <select
                value={formData.carDetails.fuelType}
                onChange={(e) =>
                  handleNestedChange("carDetails", "fuelType", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF4747]"
                required
              >
                <option value="Petrol">
                  {t("properties.form.car.fuelTypes.petrol")}
                </option>
                <option value="Diesel">
                  {t("properties.form.car.fuelTypes.diesel")}
                </option>
                <option value="Electric">
                  {t("properties.form.car.fuelTypes.electric")}
                </option>
                <option value="Hybrid">
                  {t("properties.form.car.fuelTypes.hybrid")}
                </option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("properties.form.car.transmission")} *
              </label>
              <select
                value={formData.carDetails.transmission}
                onChange={(e) =>
                  handleNestedChange(
                    "carDetails",
                    "transmission",
                    e.target.value
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF4747]"
                required
              >
                <option value="Manual">
                  {t("properties.form.car.transmissions.manual")}
                </option>
                <option value="Automatic">
                  {t("properties.form.car.transmissions.automatic")}
                </option>
              </select>
            </div>
          </div>
        );

      case "Electronics":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("properties.form.electronics.category")} *
              </label>
              <input
                type="text"
                value={formData.electronicsDetails.category}
                onChange={(e) =>
                  handleNestedChange(
                    "electronicsDetails",
                    "category",
                    e.target.value
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF4747]"
                placeholder={t(
                  "properties.form.electronics.categoryPlaceholder"
                )}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("properties.form.electronics.brand")} *
              </label>
              <input
                type="text"
                value={formData.electronicsDetails.brand}
                onChange={(e) =>
                  handleNestedChange(
                    "electronicsDetails",
                    "brand",
                    e.target.value
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF4747]"
                placeholder={t("properties.form.electronics.brandPlaceholder")}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("properties.form.electronics.model")} *
              </label>
              <input
                type="text"
                value={formData.electronicsDetails.model}
                onChange={(e) =>
                  handleNestedChange(
                    "electronicsDetails",
                    "model",
                    e.target.value
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF4747]"
                placeholder={t("properties.form.electronics.modelPlaceholder")}
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("properties.form.electronics.specifications")} *
              </label>
              <textarea
                value={formData.electronicsDetails.specifications}
                onChange={(e) =>
                  handleNestedChange(
                    "electronicsDetails",
                    "specifications",
                    e.target.value
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF4747]"
                placeholder={t(
                  "properties.form.electronics.specificationsPlaceholder"
                )}
                required
                rows="4"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("properties.form.electronics.condition")} *
              </label>
              <select
                value={formData.electronicsDetails.condition}
                onChange={(e) =>
                  handleNestedChange(
                    "electronicsDetails",
                    "condition",
                    e.target.value
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF4747]"
                required
              >
                <option value="New">
                  {t("properties.form.conditions.new")}
                </option>
                <option value="Used">
                  {t("properties.form.conditions.used")}
                </option>
                <option value="Refurbished">
                  {t("properties.form.conditions.refurbished")}
                </option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.electronicsDetails.warranty}
                onChange={(e) =>
                  handleNestedChange(
                    "electronicsDetails",
                    "warranty",
                    e.target.checked
                  )
                }
                className="w-5 h-5 text-[#FF4747] border-gray-300 rounded"
              />
              <label className="text-gray-700">
                {t("properties.form.electronics.hasWarranty")}
              </label>
            </div>

            {formData.electronicsDetails.warranty && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("properties.form.electronics.warrantyPeriod")}
                </label>
                <input
                  type="text"
                  value={formData.electronicsDetails.warrantyPeriod}
                  onChange={(e) =>
                    handleNestedChange(
                      "electronicsDetails",
                      "warrantyPeriod",
                      e.target.value
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF4747]"
                  placeholder={t(
                    "properties.form.electronics.warrantyPlaceholder"
                  )}
                />
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {[1, 2, 3].map((step) => (
              <React.Fragment key={step}>
                <div
                  className={`flex flex-col items-center ${
                    activeStep >= step ? "text-[#FF4747]" : "text-gray-400"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                      activeStep >= step
                        ? "bg-[#FF4747] border-[#FF4747] text-white"
                        : "border-gray-300"
                    }`}
                  >
                    {step}
                  </div>
                  <span className="text-sm mt-2">
                    {step === 1
                      ? t("properties.form.sections.basicInfo")
                      : step === 2
                      ? t("properties.form.sections.details")
                      : t("properties.form.sections.images")}
                  </span>
                </div>
                {step < 3 && (
                  <AiOutlineRight
                    className={`w-6 h-6 ${
                      activeStep > step ? "text-[#FF4747]" : "text-gray-300"
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Form Header */}
          <div className="bg-gradient-to-r from-[#FF4747] to-orange-500 px-8 py-6">
            <h1 className="text-2xl font-bold text-white">
              {isEdit
                ? t("properties.form.editProperty")
                : t("client.createNewProperty")}
            </h1>
            <p className="text-white/90 mt-1">
              {isEdit
                ? t("properties.form.updatePropertyDetails")
                : t("client.listPropertyForSaleRent")}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-8">
            {/* Property Type Selection */}
            <div className="mb-10">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">
                {t("properties.form.whatListing")}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  {
                    value: "Home",
                    icon: AiOutlineHome,
                    label: t("properties.propertyTypes.home"),
                    color: "bg-blue-100 text-blue-600",
                  },
                  {
                    value: "Car",
                    icon: AiOutlineCar,
                    label: t("properties.propertyTypes.car"),
                    color: "bg-green-100 text-green-600",
                  },
                  {
                    value: "Electronics",
                    icon: AiOutlineMobile,
                    label: t("properties.propertyTypes.electronics"),
                    color: "bg-purple-100 text-purple-600",
                  },
                ].map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        propertyType: type.value,
                      }));
                      setActiveStep(2);
                    }}
                    className={`p-6 rounded-xl border-2 transition-all duration-200 ${
                      formData.propertyType === type.value
                        ? `${type.color} border-current scale-[1.02] shadow-md`
                        : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                    }`}
                  >
                    <type.icon className="w-12 h-12 mx-auto mb-3" />
                    <div className="font-semibold">{type.label}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      {type.value === "Home"
                        ? t("properties.form.home.types")
                        : type.value === "Car"
                        ? t("properties.form.car.types")
                        : t("properties.form.electronics.types")}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Basic Information Form */}
            <div className="mb-10">
              <h3 className="text-lg font-semibold mb-6 text-gray-900 border-b pb-2">
                {t("properties.form.sections.basicInfo")}
              </h3>
              <div className="space-y-6">
                {/* Property Type and Purpose */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("properties.form.propertyType")} *
                    </label>
                    <select
                      name="propertyType"
                      value={formData.propertyType}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF4747] focus:border-transparent"
                      required
                      disabled={isEdit}
                    >
                      <option value="Home">
                        {t("properties.propertyTypes.home")}
                      </option>
                      <option value="Car">
                        {t("properties.propertyTypes.car")}
                      </option>
                      <option value="Electronics">
                        {t("properties.propertyTypes.electronics")}
                      </option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("properties.form.purpose")} *
                    </label>
                    <select
                      name="purpose"
                      value={formData.purpose}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF4747] focus:border-transparent"
                      required
                      disabled={isEdit}
                    >
                      <option value="Sell">
                        {t("properties.purposes.sell")}
                      </option>
                      <option value="Rent">
                        {t("properties.purposes.rent")}
                      </option>
                    </select>
                  </div>
                </div>

                {/* Title and Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("properties.form.title")} *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF4747] focus:border-transparent"
                    placeholder={t("properties.form.titlePlaceholder")}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("properties.form.description")} *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="4"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF4747] focus:border-transparent"
                    placeholder={t("properties.form.descriptionPlaceholder")}
                    required
                  />
                </div>

                {/* Price, City, Location */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("properties.form.price")} *
                    </label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 py-2 border border-r-0 border-gray-300 bg-gray-50 text-gray-500 rounded-l-md">
                        {formData.currency}
                      </span>
                      <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-r-md focus:ring-2 focus:ring-[#FF4747] focus:border-transparent"
                        required
                        min="1"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("properties.form.city")} *
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF4747] focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("properties.form.location")} *
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF4747] focus:border-transparent"
                      placeholder={t("properties.form.locationPlaceholder")}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Property Specific Details */}
            <div className="mb-10">
              <h3 className="text-lg font-semibold mb-6 text-gray-900 border-b pb-2">
                {t(
                  `properties.propertyTypes.${formData.propertyType.toLowerCase()}`
                )}{" "}
                {t("properties.form.sections.details")}
              </h3>
              {renderPropertySpecificFields()}
            </div>

            {/* Enhanced Media Upload Section */}
            <div className="mb-10">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">
                {t("properties.form.sections.images")}
              </h3>

              {/* Drag & Drop Area */}
              <div
                className={`border-3 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
                  isDragging
                    ? "border-[#FF4747] bg-red-50 scale-[1.01]"
                    : "border-gray-300 hover:border-[#FF4747] hover:bg-gray-50"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, "images")}
              >
                <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-[#FF4747] to-orange-500 rounded-full flex items-center justify-center">
                  <AiOutlineUpload className="w-10 h-10 text-white" />
                </div>

                <h4 className="text-xl font-semibold text-gray-800 mb-2">
                  {t("properties.form.dragDrop")}
                </h4>
                <p className="text-gray-500 mb-6">
                  {t("properties.form.uploadPhotosVideos")}
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-3 bg-[#FF4747] hover:bg-[#ff3333] text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <AiOutlineCamera className="w-5 h-5" />
                    {t("properties.form.uploadPhotos")}
                  </button>

                  <button
                    type="button"
                    onClick={() => videoInputRef.current?.click()}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <AiOutlineVideoCamera className="w-5 h-5" />
                    {t("properties.form.uploadVideos")}
                  </button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploading}
                />

                <input
                  ref={videoInputRef}
                  type="file"
                  multiple
                  accept="video/*"
                  onChange={handleVideoUpload}
                  className="hidden"
                  disabled={uploading}
                />

                <p className="text-sm text-gray-400 mt-6">
                  {t("properties.form.supportedFormats")}
                </p>
              </div>

              {/* Upload Progress */}
              {uploading && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <div className="flex justify-between text-sm font-medium text-blue-800 mb-2">
                    <span>{t("properties.form.uploadingFiles")}</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div
                      className="bg-[#FF4747] h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Media Preview */}
              {(formData.images.length > 0 || formData.videos.length > 0) && (
                <div className="mt-8">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-800">
                      {t("properties.form.mediaPreview")} (
                      {formData.images.length + formData.videos.length}{" "}
                      {t("properties.form.files")})
                    </h4>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          images: [],
                          videos: [],
                        }));
                      }}
                      className="text-sm text-red-600 hover:text-red-800 flex items-center gap-1"
                    >
                      <AiOutlineDelete className="w-4 h-4" />
                      {t("properties.form.clearAll")}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {/* Image Previews */}
                    {formData.images.map((image, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                          <img
                            src={image.tempUrl || image.url || image}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                          {image.isUploading && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile("images", index)}
                          className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                          disabled={uploading}
                        >
                          ×
                        </button>
                      </div>
                    ))}

                    {/* Video Previews */}
                    {formData.videos.map((video, index) => (
                      <div key={`video-${index}`} className="relative group">
                        <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 relative">
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-blue-900/10 flex items-center justify-center">
                            <AiOutlineVideoCamera className="w-12 h-12 text-white/80" />
                          </div>
                          {video.thumbnail && (
                            <img
                              src={video.thumbnail}
                              alt={`Video thumbnail ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          )}
                          <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                            {t("properties.form.video")}
                          </div>
                          {video.isUploading && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            </div>
                          )}
                        </div>
                        <div className="mt-2 text-xs text-gray-600 truncate">
                          {video.name ||
                            `${t("properties.form.video")} ${index + 1}`}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile("videos", index)}
                          className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                          disabled={uploading}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="border-t pt-8">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-sm text-gray-500">
                  <p className="flex items-center gap-1 mb-1">
                    <span className="text-green-500">✓</span>
                    {t("properties.form.secureUpload")}
                  </p>
                  <p className="flex items-center gap-1 mb-1">
                    <span className="text-green-500">✓</span>
                    {t("properties.form.previewBeforeSubmit")}
                  </p>
                  <p className="flex items-center gap-1">
                    <span className="text-green-500">✓</span>
                    {t("properties.form.multipleFormats")}
                  </p>
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={onCancel}
                    disabled={uploading}
                    className="px-8 py-3 border-2 border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 rounded-xl font-semibold transition-colors disabled:opacity-50"
                  >
                    {t("common.cancel")}
                  </button>
                  <button
                    type="submit"
                    disabled={loading || uploading}
                    className="px-8 py-3 bg-gradient-to-r from-[#FF4747] to-orange-500 hover:from-[#ff3333] hover:to-orange-600 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        {isEdit
                          ? t("properties.form.updating")
                          : t("properties.form.creating")}
                      </>
                    ) : (
                      <>
                        <AiOutlineUpload className="w-5 h-5" />
                        {submitButtonText}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PropertyForm;
