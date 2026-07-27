import React, { useState } from "react";

const Services = () => {
  const [activeCategory, setActiveCategory] = useState("all");

  const categories = [
    { id: "all", name: "All Services", icon: "🌟" },
    { id: "homes", name: "Real Estate", icon: "🏠" },
    { id: "cars", name: "Automotive", icon: "🚗" },
    { id: "electronics", name: "Electronics", icon: "📱" },
  ];

  const services = [
    // Real Estate Services
    {
      category: "homes",
      icon: "🏠",
      title: "Property Sales & Purchases",
      description:
        "Complete real estate transaction services for residential and commercial properties.",
      features: [
        "Property valuation and market analysis",
        "Professional property photography",
        "Multi-channel marketing campaigns",
        "Buyer and seller matching",
        "Legal documentation support",
        "Closing coordination and support",
      ],
      commission: "2% commission on successful transactions",
    },
    {
      category: "homes",
      icon: "🏢",
      title: "Property Rental Services",
      description:
        "Comprehensive rental management for landlords and tenant placement services.",
      features: [
        "Tenant screening and verification",
        "Lease agreement preparation",
        "Rent collection management",
        "Property maintenance coordination",
        "Regular property inspections",
        "Dispute resolution support",
      ],
      commission: "Monthly management fees apply",
    },
    {
      category: "homes",
      icon: "🏗️",
      title: "Commercial Real Estate",
      description:
        "Specialized services for commercial properties and business real estate needs.",
      features: [
        "Office space leasing",
        "Retail location sourcing",
        "Warehouse and industrial properties",
        "Investment property analysis",
        "Commercial property management",
        "Market research and analysis",
      ],
      commission: "Competitive commercial rates",
    },

    // Automotive Services
    {
      category: "cars",
      icon: "🚗",
      title: "Vehicle Sales & Trading",
      description:
        "Professional automotive brokerage for buying, selling, and trading vehicles.",
      features: [
        "Vehicle inspection and valuation",
        "Market price analysis",
        "Buyer and seller matching",
        "Vehicle history verification",
        "Documentation and registration",
        "Financing assistance coordination",
      ],
      commission: "2% commission on vehicle sales",
    },
    {
      category: "cars",
      icon: "🔧",
      title: "Auto Consultation Services",
      description:
        "Expert advice and consultation for automotive purchases and investments.",
      features: [
        "Pre-purchase vehicle inspections",
        "Market trend analysis",
        "Investment vehicle recommendations",
        "Import/export consultation",
        "Insurance guidance",
        "Maintenance planning advice",
      ],
      commission: "Consultation fees apply",
    },
    {
      category: "cars",
      icon: "🚙",
      title: "Fleet Management",
      description:
        "Comprehensive fleet management services for businesses and organizations.",
      features: [
        "Fleet acquisition planning",
        "Vehicle lifecycle management",
        "Maintenance scheduling",
        "Driver management systems",
        "Cost optimization strategies",
        "Fleet disposal services",
      ],
      commission: "Monthly management packages",
    },

    // Electronics Services
    {
      category: "electronics",
      icon: "📱",
      title: "Electronics Trading",
      description:
        "Professional brokerage for consumer electronics, gadgets, and tech equipment.",
      features: [
        "Device authentication and testing",
        "Market value assessment",
        "Buyer and seller matching",
        "Warranty verification",
        "Secure transaction processing",
        "Technical support coordination",
      ],
      commission: "2% commission on electronics sales",
    },
    {
      category: "electronics",
      icon: "💻",
      title: "Tech Equipment Brokerage",
      description:
        "Specialized services for business technology and professional equipment.",
      features: [
        "Enterprise equipment sourcing",
        "Bulk purchase negotiations",
        "Equipment leasing arrangements",
        "Technology lifecycle management",
        "Upgrade planning services",
        "Disposal and recycling coordination",
      ],
      commission: "Volume-based pricing",
    },
    {
      category: "electronics",
      icon: "🔌",
      title: "Smart Home Solutions",
      description:
        "Complete smart home and IoT device integration and management services.",
      features: [
        "Smart device consultation",
        "Home automation planning",
        "Device compatibility analysis",
        "Installation coordination",
        "System integration support",
        "Ongoing technical support",
      ],
      commission: "Project-based pricing",
    },
  ];

  const process = [
    {
      step: "01",
      title: "Initial Consultation",
      description:
        "We discuss your specific needs, budget, and preferences across our service categories.",
      icon: "💬",
    },
    {
      step: "02",
      title: "Market Research",
      description:
        "Our experts conduct thorough market analysis to identify the best opportunities.",
      icon: "📊",
    },
    {
      step: "03",
      title: "Matching & Sourcing",
      description:
        "We connect buyers and sellers or source the perfect items from our network.",
      icon: "🔍",
    },
    {
      step: "04",
      title: "Verification & Inspection",
      description:
        "Comprehensive verification and quality inspection of all items and parties.",
      icon: "✅",
    },
    {
      step: "05",
      title: "Negotiation & Terms",
      description:
        "Professional negotiation to secure the best terms and pricing for all parties.",
      icon: "🤝",
    },
    {
      step: "06",
      title: "Transaction Completion",
      description:
        "Secure transaction processing with full documentation and legal support.",
      icon: "📋",
    },
  ];

  const filteredServices =
    activeCategory === "all"
      ? services
      : services.filter((service) => service.category === activeCategory);

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
            M4S Broker Services
          </h1>
          <p className="text-xl text-blue-100 max-w-4xl mx-auto leading-relaxed">
            Your trusted multi-category brokerage platform. We connect buyers
            and sellers across real estate, automotive, and electronics markets
            with professional expertise and secure transactions since 2025.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`flex items-center space-x-2 px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                activeCategory === category.id
                  ? "bg-blue-600 text-white shadow-lg transform scale-105"
                  : "bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 shadow-md"
              }`}
            >
              <span className="text-lg">{category.icon}</span>
              <span>{category.name}</span>
            </button>
          ))}
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {filteredServices.map((service, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100"
            >
              <div className="p-8">
                <div className="flex items-center mb-6">
                  <div className="text-4xl mr-4">{service.icon}</div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      {service.title}
                    </h3>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        service.category === "homes"
                          ? "bg-green-100 text-green-800"
                          : service.category === "cars"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-purple-100 text-purple-800"
                      }`}
                    >
                      {
                        categories.find((cat) => cat.id === service.category)
                          ?.name
                      }
                    </span>
                  </div>
                </div>

                <p className="text-gray-600 mb-6 leading-relaxed">
                  {service.description}
                </p>

                <div className="space-y-3 mb-6">
                  {service.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-start">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <span className="text-sm text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-blue-800">
                    {service.commission}
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 px-8 py-4">
                <button className="text-blue-600 hover:text-blue-700 font-medium transition duration-300 flex items-center">
                  Get Started
                  <svg
                    className="w-4 h-4 ml-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Process Section */}
        <div className="bg-white rounded-3xl shadow-xl p-12 mb-16">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How M4S Broker Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our streamlined process ensures secure, efficient, and
              professional transactions across all categories.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {process.map((step, index) => (
              <div key={index} className="text-center group">
                <div className="relative mb-6">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-all duration-300">
                    <span className="text-2xl">{step.icon}</span>
                  </div>
                  <div className="absolute -top-2 -right-2 bg-white w-8 h-8 rounded-full flex items-center justify-center shadow-md">
                    <span className="text-sm font-bold text-blue-600">
                      {step.step}
                    </span>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl shadow-xl p-12 text-white mb-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">500+</div>
              <div className="text-blue-100">Successful Transactions</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">3</div>
              <div className="text-blue-100">Service Categories</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">24/7</div>
              <div className="text-blue-100">Customer Support</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">2025</div>
              <div className="text-blue-100">Established</div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-gray-900 to-blue-900 rounded-3xl shadow-2xl p-12 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Start Your Journey?
          </h2>
          <p className="text-blue-100 text-xl mb-8 max-w-3xl mx-auto leading-relaxed">
            Join thousands of satisfied clients who trust M4S Broker for their
            real estate, automotive, and electronics needs. Let's make your next
            transaction seamless and successful.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold hover:bg-blue-50 transition duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
              Contact Us Today
            </button>
            <button className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold hover:bg-white hover:text-blue-600 transition duration-300">
              Browse Categories
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Services;
