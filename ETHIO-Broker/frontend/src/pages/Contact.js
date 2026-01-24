import React, { useState } from "react";
import axios from "../api/axios";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Handle phone number formatting
    if (name === "phone") {
      // Allow +2519 or 09 format
      let formattedValue = value;
      if (value.startsWith('+251')) {
        formattedValue = value.replace(/[^\d+]/g, '');
        if (formattedValue.length > 13) formattedValue = formattedValue.substring(0, 13);
      } else if (value.startsWith('09') || value.startsWith('0')) {
        formattedValue = value.replace(/\D/g, '');
        if (formattedValue.length > 10) formattedValue = formattedValue.substring(0, 10);
      } else {
        formattedValue = value.replace(/[^\d+]/g, '');
      }
      setFormData({ ...formData, [name]: formattedValue });
    } else {
      setFormData({ ...formData, [name]: value });
    }

    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors({ ...fieldErrors, [name]: "" });
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = "Name is required";
    } else if (formData.name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters";
    }

    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }

    if (formData.phone && formData.phone.trim() !== "") {
      const phoneRegex = /^(\+2519|09)\d{8}$/;
      if (!phoneRegex.test(formData.phone.replace(/[\s\-]/g, ""))) {
        errors.phone = "Phone must be in Ethiopian format (+2519XXXXXXXX or 09XXXXXXXX)";
      }
    }

    if (!formData.subject) {
      errors.subject = "Please select a subject";
    }

    if (!formData.message.trim()) {
      errors.message = "Message is required";
    } else if (formData.message.trim().length < 10) {
      errors.message = "Message must be at least 10 characters";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const response = await axios.post("/api/contact/send", formData);

      if (response.data.success) {
        setSuccessMessage(response.data.message);
        setFormData({
          name: "",
          email: "",
          phone: "",
          subject: "",
          message: "",
        });
        // Scroll to success message
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setErrorMessage(
        error.response?.data?.message ||
        "Failed to send message. Please try again or contact us directly via email."
      );
      // Scroll to error message
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-full bg-white/10 backdrop-blur-sm shadow-2xl">
            <img 
              src="/m4sbrokerlogo.png" 
              alt="M4S Broker Logo" 
              className="w-12 h-12 object-contain"
            />
          </div>
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
            Contact M4S Broker
          </h1>
          <p className="text-xl text-blue-100 max-w-4xl mx-auto leading-relaxed">
            Get in touch with our expert team. We're here to help you with all your 
            real estate, automotive, and electronics brokerage needs.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Information */}
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Get In Touch
            </h2>

            <div className="space-y-6">
              <div className="flex items-start bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="bg-blue-100 p-4 rounded-xl mr-6">
                  <span className="text-blue-600 text-3xl">📧</span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg mb-2">Email</h3>
                  <a
                    href="mailto:mengistuanmut45@gmail.com"
                    className="text-blue-600 hover:text-blue-700 transition-colors font-medium"
                  >
                    mengistuanmut45@gmail.com
                  </a>
                  <p className="text-gray-600 text-sm mt-1">We typically respond within 24 hours</p>
                </div>
              </div>

              <div className="flex items-start bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="bg-green-100 p-4 rounded-xl mr-6">
                  <span className="text-green-600 text-3xl">📞</span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg mb-2">Phone</h3>
                  <a
                    href="tel:+251924328087"
                    className="text-green-600 hover:text-green-700 transition-colors font-medium"
                  >
                    +251 924 328 087
                  </a>
                  <p className="text-gray-600 text-sm mt-1">Available during business hours</p>
                </div>
              </div>

              <div className="flex items-start bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="bg-purple-100 p-4 rounded-xl mr-6">
                  <span className="text-purple-600 text-3xl">📍</span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg mb-2">Office Address</h3>
                  <p className="text-gray-600 font-medium">
                    Addis Ababa, Ethiopia
                  </p>
                  <p className="text-gray-500 text-sm mt-1">Visit us for in-person consultations</p>
                </div>
              </div>

              <div className="flex items-start bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="bg-orange-100 p-4 rounded-xl mr-6">
                  <span className="text-orange-600 text-3xl">🕒</span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg mb-2">Business Hours</h3>
                  <div className="text-gray-600 space-y-1">
                    <p className="font-medium">Monday - Friday: 8:00 AM - 6:00 PM</p>
                    <p>Saturday: 9:00 AM - 4:00 PM</p>
                    <p>Sunday: Closed</p>
                  </div>
                </div>
              </div>

              {/* Social Media Links */}
              <div className="bg-white p-6 rounded-2xl shadow-lg">
                <h3 className="font-bold text-gray-900 text-lg mb-4 flex items-center">
                  <span className="text-indigo-600 text-2xl mr-3">🌐</span>
                  Connect With Us
                </h3>
                <div className="flex gap-4">
                  <a
                    href="https://www.facebook.com/mengistu.anmut.3"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl transition duration-300 flex items-center justify-center shadow-md hover:shadow-lg transform hover:-translate-y-1"
                    title="Connect on Facebook"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </a>

                  <a
                    href="https://t.me/meng1624"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-xl transition duration-300 flex items-center justify-center shadow-md hover:shadow-lg transform hover:-translate-y-1"
                    title="Chat on Telegram"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                    </svg>
                  </a>

                  <a
                    href="https://www.linkedin.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-700 hover:bg-blue-800 text-white p-4 rounded-xl transition duration-300 flex items-center justify-center shadow-md hover:shadow-lg transform hover:-translate-y-1"
                    title="Connect on LinkedIn"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Send us a Message
            </h2>

            {/* Success Message */}
            {successMessage && (
              <div className="mb-8 bg-green-50 border border-green-200 text-green-800 px-6 py-4 rounded-xl">
                <div className="flex items-center">
                  <span className="text-3xl mr-4">✅</span>
                  <div>
                    <p className="font-semibold">Message Sent Successfully!</p>
                    <p className="text-sm text-green-700 mt-1">{successMessage}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div className="mb-8 bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-xl">
                <div className="flex items-center">
                  <span className="text-3xl mr-4">❌</span>
                  <div>
                    <p className="font-semibold">Failed to Send Message</p>
                    <p className="text-sm text-red-700 mt-1">{errorMessage}</p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-300 ${
                      fieldErrors.name ? 'border-red-400 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Your full name"
                  />
                  {fieldErrors.name && (
                    <p className="text-red-600 text-sm mt-1 flex items-center">
                      <span className="mr-1">⚠️</span>
                      {fieldErrors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-300 ${
                      fieldErrors.email ? 'border-red-400 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="your.email@example.com"
                  />
                  {fieldErrors.email && (
                    <p className="text-red-600 text-sm mt-1 flex items-center">
                      <span className="mr-1">⚠️</span>
                      {fieldErrors.email}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-300 ${
                      fieldErrors.phone ? 'border-red-400 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="+2519XXXXXXXX or 09XXXXXXXX"
                  />
                  {fieldErrors.phone && (
                    <p className="text-red-600 text-sm mt-1 flex items-center">
                      <span className="mr-1">⚠️</span>
                      {fieldErrors.phone}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="subject"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Subject *
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-300 ${
                      fieldErrors.subject ? 'border-red-400 bg-red-50' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select a subject</option>
                    <option value="real-estate-inquiry">Real Estate Inquiry</option>
                    <option value="automotive-inquiry">Automotive Inquiry</option>
                    <option value="electronics-inquiry">Electronics Inquiry</option>
                    <option value="list-property">List a Property</option>
                    <option value="sell-vehicle">Sell a Vehicle</option>
                    <option value="sell-electronics">Sell Electronics</option>
                    <option value="general-question">General Question</option>
                    <option value="support">Support</option>
                    <option value="feedback">Feedback</option>
                  </select>
                  {fieldErrors.subject && (
                    <p className="text-red-600 text-sm mt-1 flex items-center">
                      <span className="mr-1">⚠️</span>
                      {fieldErrors.subject}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows="6"
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-300 resize-none ${
                    fieldErrors.message ? 'border-red-400 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Tell us how we can help you with your real estate, automotive, or electronics needs..."
                />
                {fieldErrors.message && (
                  <p className="text-red-600 text-sm mt-1 flex items-center">
                    <span className="mr-1">⚠️</span>
                    {fieldErrors.message}
                  </p>
                )}
                <p className="text-gray-500 text-sm mt-1">
                  {formData.message.length}/500 characters (minimum 10 required)
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-xl hover:from-blue-700 hover:to-purple-700 focus:ring-4 focus:ring-blue-300 transition duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    Sending Message...
                  </>
                ) : (
                  <>
                    <span>Send Message</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
