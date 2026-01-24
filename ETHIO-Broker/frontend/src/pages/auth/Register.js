import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Register = () => {
  const [formData, setFormData] = useState({
    fname: "",
    lname: "",
    email: "",
    phone: "",
    city: "",
    finNumber: "",
    fanNumber: "",
    idPhotoFront: null,
    idPhotoBack: null,
    selfiePhoto: null,
    password: "",
    confirmPassword: "",
    agreedToTerms: false,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [idPhotoFrontPreview, setIdPhotoFrontPreview] = useState(null);
  const [idPhotoBackPreview, setIdPhotoBackPreview] = useState(null);
  const [selfiePhotoPreview, setSelfiePhotoPreview] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const { register } = useAuth();
  const navigate = useNavigate();

  // Cleanup camera stream on component unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  // Camera functions
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user' // Front-facing camera for selfies
        }
      });
      setCameraStream(stream);
      setShowCamera(true);
      
      // Wait for video element to be ready
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (error) {
      console.error('Error accessing camera:', error);
      setErrors({ ...errors, selfiePhoto: 'Camera access denied. Please allow camera permission or upload a photo instead.' });
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw the video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert canvas to blob
      canvas.toBlob((blob) => {
        if (blob) {
          // Create a File object from the blob
          const file = new File([blob], 'selfie-capture.jpg', { type: 'image/jpeg' });
          
          // Update form data
          setFormData({ ...formData, selfiePhoto: file });
          
          // Create preview
          const reader = new FileReader();
          reader.onloadend = () => {
            setSelfiePhotoPreview(reader.result);
          };
          reader.readAsDataURL(file);
          
          // Clear any errors
          if (errors.selfiePhoto) {
            setErrors({ ...errors, selfiePhoto: "" });
          }
          
          // Stop camera
          stopCamera();
        }
      }, 'image/jpeg', 0.8);
    }
  };

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 10) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    return strength;
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.fname.trim()) newErrors.fname = "First name is required";
    if (!formData.lname.trim()) newErrors.lname = "Last name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Email is invalid";
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    else if (!/^(\+2519|09)\d{8}$/.test(formData.phone)) {
      newErrors.phone = "Phone must start with +2519 or 09 followed by 8 digits";
    }
    if (!formData.city.trim()) newErrors.city = "City is required";
    if (!formData.finNumber.trim()) newErrors.finNumber = "FIN number is required";
    else if (!/^\d{12}$/.test(formData.finNumber)) newErrors.finNumber = "FIN must be exactly 12 digits";
    if (!formData.fanNumber.trim()) newErrors.fanNumber = "Fan number is required";
    else if (!/^\d{16}$/.test(formData.fanNumber)) newErrors.fanNumber = "Fan must be exactly 16 digits";
    if (!formData.idPhotoFront) newErrors.idPhotoFront = "ID front photo is required";
    if (!formData.idPhotoBack) newErrors.idPhotoBack = "ID back photo is required";
    if (!formData.selfiePhoto) newErrors.selfiePhoto = "Selfie photo is required";
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 6) newErrors.password = "Password must be at least 6 characters";
    if (!formData.confirmPassword) newErrors.confirmPassword = "Please confirm your password";
    else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match";
    if (!formData.agreedToTerms) newErrors.agreedToTerms = "You must agree to the terms and conditions";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    if (type === "file") {
      const file = files[0];
      if (file) {
        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
          setErrors({ ...errors, [name]: "File size must be less than 5MB" });
          return;
        }
        // Validate file type
        if (!file.type.startsWith("image/")) {
          setErrors({ ...errors, [name]: "Only image files are allowed" });
          return;
        }
        
        setFormData({ ...formData, [name]: file });
        
        // Create preview based on file type
        const reader = new FileReader();
        reader.onloadend = () => {
          if (name === "idPhotoFront") {
            setIdPhotoFrontPreview(reader.result);
          } else if (name === "idPhotoBack") {
            setIdPhotoBackPreview(reader.result);
          } else if (name === "selfiePhoto") {
            setSelfiePhotoPreview(reader.result);
          }
        };
        reader.readAsDataURL(file);
        
        if (errors[name]) {
          setErrors({ ...errors, [name]: "" });
        }
      }
    } else {
      let newValue = value;
      
      // Filter input for phone number (allow digits and + for Ethiopian format)
      if (name === "phone") {
        // Allow +2519 or 09 format
        if (value.startsWith('+251')) {
          newValue = value.replace(/[^\d+]/g, ''); // Keep only digits and +
          if (newValue.length > 13) newValue = newValue.substring(0, 13); // +2519XXXXXXXX = 13 chars
        } else if (value.startsWith('09') || value.startsWith('0')) {
          newValue = value.replace(/\D/g, ''); // Keep only digits
          if (newValue.length > 10) newValue = newValue.substring(0, 10); // 09XXXXXXXX = 10 chars
        } else {
          newValue = value.replace(/[^\d+]/g, ''); // Allow typing + at start
        }
      }
      // Filter numeric input for FIN and Fan numbers
      else if (name === "finNumber" || name === "fanNumber") {
        newValue = value.replace(/\D/g, ''); // Remove all non-digit characters
      }
      
      setFormData({
        ...formData,
        [name]: type === "checkbox" ? checked : newValue,
      });
      if (name === "password") {
        setPasswordStrength(calculatePasswordStrength(value));
      }
      if (errors[name]) {
        setErrors({ ...errors, [name]: "" });
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      // Create FormData for file upload
      const submitData = new FormData();
      submitData.append("fname", formData.fname);
      submitData.append("lname", formData.lname);
      submitData.append("email", formData.email);
      submitData.append("phone", formData.phone);
      submitData.append("city", formData.city);
      submitData.append("nationalId", formData.finNumber);
      submitData.append("tinNumber", formData.fanNumber);
      submitData.append("idPhotoFront", formData.idPhotoFront);
      submitData.append("idPhotoBack", formData.idPhotoBack);
      submitData.append("selfiePhoto", formData.selfiePhoto);
      submitData.append("password", formData.password);
      submitData.append("confirmPassword", formData.confirmPassword);

      console.log("📝 Submitting registration with data:", {
        fname: formData.fname,
        lname: formData.lname,
        email: formData.email,
        phone: formData.phone,
        city: formData.city,
        finNumber: formData.finNumber,
        fanNumber: formData.fanNumber,
        hasIdPhotoFront: !!formData.idPhotoFront,
        hasIdPhotoBack: !!formData.idPhotoBack,
        hasSelfiePhoto: !!formData.selfiePhoto,
      });

      const result = await register(submitData);

      console.log("📬 Registration result:", result);

      if (result.success) {
        console.log("✅ Registration successful, navigating to verify-email");
        navigate("/verify-email");
      } else {
        console.error("❌ Registration failed:", result.message);
        setErrors({ submit: result.message || "Registration failed. Please try again." });
      }
    } catch (error) {
      console.error("❌ Registration error:", error);
      setErrors({ submit: error.message || "Registration failed. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    const step1Errors = {};
    if (!formData.fname.trim()) step1Errors.fname = "Required";
    if (!formData.lname.trim()) step1Errors.lname = "Required";
    if (!formData.email.trim()) step1Errors.email = "Required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) step1Errors.email = "Invalid email";

    if (Object.keys(step1Errors).length === 0) {
      setCurrentStep(2);
      setErrors({});
    } else {
      setErrors(step1Errors);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 py-12 px-4">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in-down">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-full bg-white/10 backdrop-blur-sm shadow-2xl transform hover:scale-110 transition-transform duration-300 border border-white/20">
            <img
              src="/m4sbrokerlogo.png"
              alt="M4S Broker Logo"
              className="w-12 h-12 object-contain"
            />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Create Your Account
          </h1>
          <p className="text-indigo-200">
            Join us and start your journey today
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8 space-x-4">
          <div
            className={`flex items-center ${currentStep >= 1 ? "text-white" : "text-indigo-400"}`}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${currentStep >= 1 ? "bg-gradient-to-r from-purple-500 to-indigo-600" : "bg-white/10"} transition-all duration-300`}
            >
              {currentStep > 1 ? "✓" : "1"}
            </div>
            <span className="ml-2 text-sm font-medium hidden sm:inline">
              Personal Info
            </span>
          </div>
          <div className="w-12 h-1 bg-white/20 rounded-full">
            <div
              className={`h-full bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full transition-all duration-500 ${currentStep >= 2 ? "w-full" : "w-0"}`}
            ></div>
          </div>
          <div
            className={`flex items-center ${currentStep >= 2 ? "text-white" : "text-indigo-400"}`}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${currentStep >= 2 ? "bg-gradient-to-r from-purple-500 to-indigo-600" : "bg-white/10"} transition-all duration-300`}
            >
              {currentStep > 2 ? "✓" : "2"}
            </div>
            <span className="ml-2 text-sm font-medium hidden sm:inline">
              ID & Contact
            </span>
          </div>
          <div className="w-12 h-1 bg-white/20 rounded-full">
            <div
              className={`h-full bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full transition-all duration-500 ${currentStep >= 3 ? "w-full" : "w-0"}`}
            ></div>
          </div>
          <div
            className={`flex items-center ${currentStep >= 3 ? "text-white" : "text-indigo-400"}`}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${currentStep >= 3 ? "bg-gradient-to-r from-purple-500 to-indigo-600" : "bg-white/10"} transition-all duration-300`}
            >
              3
            </div>
            <span className="ml-2 text-sm font-medium hidden sm:inline">
              Security
            </span>
          </div>
        </div>

        {/* Form Card */}
        <div className="backdrop-blur-xl bg-white/10 rounded-3xl shadow-2xl border border-white/20 p-8 animate-fade-in-up">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <div className="space-y-5 animate-slide-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* First Name */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-white">
                      First Name
                    </label>
                    <input
                      name="fname"
                      type="text"
                      required
                      className={`w-full px-4 py-3.5 bg-white/10 border ${errors.fname ? "border-red-400" : "border-white/20"} rounded-xl text-white placeholder-indigo-200 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all backdrop-blur-sm`}
                      placeholder="John"
                      value={formData.fname}
                      onChange={handleChange}
                    />
                    {errors.fname && (
                      <p className="text-xs text-red-300 flex items-center">
                        <svg
                          className="w-4 h-4 mr-1"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {errors.fname}
                      </p>
                    )}
                  </div>

                  {/* Last Name */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-white">
                      Last Name
                    </label>
                    <input
                      name="lname"
                      type="text"
                      required
                      className={`w-full px-4 py-3.5 bg-white/10 border ${errors.lname ? "border-red-400" : "border-white/20"} rounded-xl text-white placeholder-indigo-200 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all backdrop-blur-sm`}
                      placeholder="Doe"
                      value={formData.lname}
                      onChange={handleChange}
                    />
                    {errors.lname && (
                      <p className="text-xs text-red-300 flex items-center">
                        <svg
                          className="w-4 h-4 mr-1"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {errors.lname}
                      </p>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-white">
                    Email Address
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg
                        className="h-5 w-5 text-indigo-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                        />
                      </svg>
                    </div>
                    <input
                      name="email"
                      type="email"
                      required
                      className={`w-full pl-12 pr-4 py-3.5 bg-white/10 border ${errors.email ? "border-red-400" : "border-white/20"} rounded-xl text-white placeholder-indigo-200 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all backdrop-blur-sm`}
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-red-300 flex items-center">
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {errors.email}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={nextStep}
                  className="w-full py-4 px-6 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg transform hover:scale-[1.02] transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  <span>Continue</span>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </button>
              </div>
            )}

            {/* Step 2: ID & Contact Information */}
            {currentStep === 2 && (
              <div className="space-y-5 animate-slide-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* FIN Number */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-white">
                      FIN Number *
                    </label>
                    <input
                      name="finNumber"
                      type="text"
                      inputMode="numeric"
                      pattern="\d{12}"
                      maxLength="12"
                      required
                      className={`w-full px-4 py-3.5 bg-white/10 border ${errors.finNumber ? "border-red-400" : "border-white/20"} rounded-xl text-white placeholder-indigo-200 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all backdrop-blur-sm`}
                      placeholder="Enter your 12-digit FIN number"
                      value={formData.finNumber}
                      onChange={handleChange}
                    />
                    {errors.finNumber && (
                      <p className="text-xs text-red-300">{errors.finNumber}</p>
                    )}
                  </div>

                  {/* Fan Number */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-white">
                      Fan Number *
                    </label>
                    <input
                      name="fanNumber"
                      type="text"
                      inputMode="numeric"
                      pattern="\d{16}"
                      maxLength="16"
                      required
                      className={`w-full px-4 py-3.5 bg-white/10 border ${errors.fanNumber ? "border-red-400" : "border-white/20"} rounded-xl text-white placeholder-indigo-200 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all backdrop-blur-sm`}
                      placeholder="Enter your 16-digit Fan number"
                      value={formData.fanNumber}
                      onChange={handleChange}
                    />
                    {errors.fanNumber && (
                      <p className="text-xs text-red-300">{errors.fanNumber}</p>
                    )}
                  </div>
                </div>

                {/* ID Photos Upload */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Identity Verification Photos
                  </h3>

                  {/* ID Front Photo */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-white">
                      Government ID - Front Side *
                    </label>
                    <div
                      className={`relative border-2 border-dashed ${errors.idPhotoFront ? "border-red-400" : "border-white/20"} rounded-xl p-6 bg-white/5 hover:bg-white/10 transition-all`}
                    >
                      <input
                        name="idPhotoFront"
                        type="file"
                        accept="image/*"
                        required
                        onChange={handleChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="text-center">
                        {idPhotoFrontPreview ? (
                          <div className="space-y-3">
                            <img
                              src={idPhotoFrontPreview}
                              alt="ID Front Preview"
                              className="mx-auto h-32 w-auto rounded-lg shadow-lg"
                            />
                            <p className="text-sm text-green-300">
                              ✓ Front photo uploaded successfully
                            </p>
                            <p className="text-xs text-indigo-200">
                              Click to change photo
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <svg
                              className="mx-auto h-12 w-12 text-indigo-300"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                            <div>
                              <p className="text-sm text-white font-medium">
                                Click to upload ID front photo
                              </p>
                              <p className="text-xs text-indigo-200 mt-1">
                                PNG, JPG up to 5MB
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    {errors.idPhotoFront && (
                      <p className="text-xs text-red-300">
                        {errors.idPhotoFront}
                      </p>
                    )}
                  </div>

                  {/* ID Back Photo */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-white">
                      Government ID - Back Side *
                    </label>
                    <div
                      className={`relative border-2 border-dashed ${errors.idPhotoBack ? "border-red-400" : "border-white/20"} rounded-xl p-6 bg-white/5 hover:bg-white/10 transition-all`}
                    >
                      <input
                        name="idPhotoBack"
                        type="file"
                        accept="image/*"
                        required
                        onChange={handleChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="text-center">
                        {idPhotoBackPreview ? (
                          <div className="space-y-3">
                            <img
                              src={idPhotoBackPreview}
                              alt="ID Back Preview"
                              className="mx-auto h-32 w-auto rounded-lg shadow-lg"
                            />
                            <p className="text-sm text-green-300">
                              ✓ Back photo uploaded successfully
                            </p>
                            <p className="text-xs text-indigo-200">
                              Click to change photo
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <svg
                              className="mx-auto h-12 w-12 text-indigo-300"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                            <div>
                              <p className="text-sm text-white font-medium">
                                Click to upload ID back photo
                              </p>
                              <p className="text-xs text-indigo-200 mt-1">
                                PNG, JPG up to 5MB
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    {errors.idPhotoBack && (
                      <p className="text-xs text-red-300">
                        {errors.idPhotoBack}
                      </p>
                    )}
                  </div>

                  {/* Selfie Photo */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-white">
                      Selfie Photo *
                    </label>
                    <div
                      className={`relative border-2 border-dashed ${errors.selfiePhoto ? "border-red-400" : "border-white/20"} rounded-xl p-6 bg-white/5 hover:bg-white/10 transition-all`}
                    >
                      {!showCamera ? (
                        <div className="text-center">
                          {selfiePhotoPreview ? (
                            <div className="space-y-3">
                              <img
                                src={selfiePhotoPreview}
                                alt="Selfie Preview"
                                className="mx-auto h-32 w-auto rounded-lg shadow-lg"
                              />
                              <p className="text-sm text-green-300">
                                ✓ Selfie captured successfully
                              </p>
                              <div className="flex justify-center space-x-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelfiePhotoPreview(null);
                                    setFormData({
                                      ...formData,
                                      selfiePhoto: null,
                                    });
                                  }}
                                  className="text-xs text-indigo-200 hover:text-white underline"
                                >
                                  Retake Photo
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <svg
                                className="mx-auto h-12 w-12 text-indigo-300"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                />
                              </svg>
                              <div>
                                <p className="text-sm text-white font-medium mb-3">
                                  Take a selfie or upload a photo
                                </p>
                                <div className="flex justify-center space-x-3 mb-3">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      startCamera();
                                    }}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition duration-200 flex items-center space-x-2"
                                  >
                                    <svg
                                      className="w-4 h-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                                      />
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                                      />
                                    </svg>
                                    <span>Take Selfie</span>
                                  </button>
                                </div>
                                <div className="relative">
                                  <input
                                    name="selfiePhoto"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    id="selfieFileInput"
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      document
                                        .getElementById("selfieFileInput")
                                        .click()
                                    }
                                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition duration-200 flex items-center space-x-2 mx-auto"
                                  >
                                    <svg
                                      className="w-4 h-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                      />
                                    </svg>
                                    <span>Upload from Device</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center space-y-4">
                          <div className="relative inline-block">
                            <video
                              ref={videoRef}
                              autoPlay
                              playsInline
                              muted
                              className="w-80 h-60 object-cover rounded-lg border-2 border-white/30"
                            />
                            {/* Face detection overlay */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <div className="w-48 h-48 border-2 border-green-400 rounded-full animate-pulse"></div>
                            </div>
                          </div>
                          <p className="text-sm text-white font-medium">
                            Position your face in the circle
                          </p>
                          <div className="flex justify-center space-x-3">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                capturePhoto();
                              }}
                              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition duration-200 flex items-center space-x-2"
                            >
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                              </svg>
                              <span>Capture</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                stopCamera();
                              }}
                              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition duration-200"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    {errors.selfiePhoto && (
                      <p className="text-xs text-red-300">
                        {errors.selfiePhoto}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Phone */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-white">
                      Phone Number *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg
                          className="h-5 w-5 text-indigo-300"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                          />
                        </svg>
                      </div>
                      <input
                        name="phone"
                        type="tel"
                        required
                        maxLength="13"
                        className={`w-full pl-12 pr-4 py-3.5 bg-white/10 border ${errors.phone ? "border-red-400" : "border-white/20"} rounded-xl text-white placeholder-indigo-200 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all backdrop-blur-sm`}
                        placeholder="+2519XXXXXXXX or 09XXXXXXXX"
                        value={formData.phone}
                        onChange={handleChange}
                      />
                    </div>
                    {errors.phone && (
                      <p className="text-xs text-red-300">{errors.phone}</p>
                    )}
                  </div>

                  {/* City */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-white">
                      City *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg
                          className="h-5 w-5 text-indigo-300"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                      </div>
                      <input
                        name="city"
                        type="text"
                        required
                        className={`w-full pl-12 pr-4 py-3.5 bg-white/10 border ${errors.city ? "border-red-400" : "border-white/20"} rounded-xl text-white placeholder-indigo-200 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all backdrop-blur-sm`}
                        placeholder="Addis Ababa"
                        value={formData.city}
                        onChange={handleChange}
                      />
                    </div>
                    {errors.city && (
                      <p className="text-xs text-red-300">{errors.city}</p>
                    )}
                  </div>
                </div>

                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="flex-1 py-4 px-6 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl border border-white/20 transform hover:scale-[1.02] transition-all"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const step2Errors = {};
                      if (!formData.finNumber.trim())
                        step2Errors.finNumber = "Required";
                      else if (!/^\d{12}$/.test(formData.finNumber))
                        step2Errors.finNumber = "Must be 12 digits";
                      if (!formData.fanNumber.trim())
                        step2Errors.fanNumber = "Required";
                      else if (!/^\d{16}$/.test(formData.fanNumber))
                        step2Errors.fanNumber = "Must be 16 digits";
                      if (!formData.idPhotoFront)
                        step2Errors.idPhotoFront = "Required";
                      if (!formData.idPhotoBack)
                        step2Errors.idPhotoBack = "Required";
                      if (!formData.selfiePhoto)
                        step2Errors.selfiePhoto = "Required";
                      if (!formData.phone.trim())
                        step2Errors.phone = "Required";
                      if (!formData.city.trim()) step2Errors.city = "Required";

                      if (Object.keys(step2Errors).length === 0) {
                        setCurrentStep(3);
                        setErrors({});
                      } else {
                        setErrors(step2Errors);
                      }
                    }}
                    className="flex-1 py-4 px-6 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg transform hover:scale-[1.02] transition-all flex items-center justify-center space-x-2"
                  >
                    <span>Continue</span>
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Contact & Security */}
            {currentStep === 3 && (
              <div className="space-y-5 animate-slide-in">
                {/* Password */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-white">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg
                        className="h-5 w-5 text-indigo-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    </div>
                    <input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      className={`w-full pl-12 pr-12 py-3.5 bg-white/10 border ${errors.password ? "border-red-400" : "border-white/20"} rounded-xl text-white placeholder-indigo-200 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all backdrop-blur-sm`}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-indigo-300 hover:text-white"
                    >
                      {showPassword ? (
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                  {formData.password && (
                    <div className="mt-2">
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${passwordStrength <= 1 ? "bg-red-500 w-1/5" : passwordStrength === 2 ? "bg-orange-500 w-2/5" : passwordStrength === 3 ? "bg-yellow-500 w-3/5" : passwordStrength === 4 ? "bg-blue-500 w-4/5" : "bg-green-500 w-full"}`}
                          ></div>
                        </div>
                        <span
                          className={`text-xs font-medium ${passwordStrength <= 1 ? "text-red-300" : passwordStrength === 2 ? "text-orange-300" : passwordStrength === 3 ? "text-yellow-300" : passwordStrength === 4 ? "text-blue-300" : "text-green-300"}`}
                        >
                          {passwordStrength <= 1
                            ? "Weak"
                            : passwordStrength === 2
                              ? "Fair"
                              : passwordStrength === 3
                                ? "Good"
                                : passwordStrength === 4
                                  ? "Strong"
                                  : "Very Strong"}
                        </span>
                      </div>
                    </div>
                  )}
                  {errors.password && (
                    <p className="text-xs text-red-300">{errors.password}</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-white">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg
                        className="h-5 w-5 text-indigo-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        />
                      </svg>
                    </div>
                    <input
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      className={`w-full pl-12 pr-12 py-3.5 bg-white/10 border ${errors.confirmPassword ? "border-red-400" : "border-white/20"} rounded-xl text-white placeholder-indigo-200 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all backdrop-blur-sm`}
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-indigo-300 hover:text-white"
                    >
                      {showConfirmPassword ? (
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-xs text-red-300">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>

                {/* Terms */}
                <div className="flex items-start">
                  <input
                    name="agreedToTerms"
                    type="checkbox"
                    className="w-4 h-4 mt-1 text-purple-500 bg-white/10 border-white/20 rounded focus:ring-2 focus:ring-purple-400"
                    checked={formData.agreedToTerms}
                    onChange={handleChange}
                  />
                  <label className="ml-3 text-sm text-indigo-200">
                    I agree to the{" "}
                    <a
                      href="/terms"
                      className="font-medium text-white hover:text-indigo-200 underline"
                    >
                      Terms and Conditions
                    </a>
                  </label>
                </div>
                {errors.agreedToTerms && (
                  <p className="text-xs text-red-300">{errors.agreedToTerms}</p>
                )}

                {errors.submit && (
                  <div className="rounded-xl bg-red-500/20 border border-red-400/30 p-4 backdrop-blur-sm">
                    <p className="text-sm text-red-200">{errors.submit}</p>
                  </div>
                )}

                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="flex-1 py-4 px-6 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl border border-white/20 transform hover:scale-[1.02] transition-all"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-4 px-6 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg transform hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <svg
                          className="animate-spin h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        <span>Creating...</span>
                      </>
                    ) : (
                      <span>Create Account</span>
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/20"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-transparent text-indigo-200">
                Already have an account?
              </span>
            </div>
          </div>

          <Link
            to="/login"
            className="block w-full py-3 px-6 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl border border-white/20 text-center transform hover:scale-[1.02] transition-all"
          >
            Sign In
          </Link>
        </div>
      </div>

      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} style={{ display: "none" }} />

      <style>{`
        @keyframes blob { 0%, 100% { transform: translate(0, 0) scale(1); } 33% { transform: translate(30px, -50px) scale(1.1); } 66% { transform: translate(-20px, 20px) scale(0.9); } }
        @keyframes fade-in-down { 0% { opacity: 0; transform: translateY(-20px); } 100% { opacity: 1; transform: translateY(0); } }
        @keyframes fade-in-up { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }
        @keyframes slide-in { 0% { opacity: 0; transform: translateX(-20px); } 100% { opacity: 1; transform: translateX(0); } }
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
        .animate-fade-in-down { animation: fade-in-down 0.6s ease-out; }
        .animate-fade-in-up { animation: fade-in-up 0.6s ease-out 0.2s both; }
        .animate-slide-in { animation: slide-in 0.4s ease-out; }
      `}</style>
    </div>
  );
};

export default Register;
