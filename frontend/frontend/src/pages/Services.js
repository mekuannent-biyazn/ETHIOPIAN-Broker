// src/pages/Services.js
import React from "react";

const Services = () => {
  const services = [
    {
      icon: "🏠",
      title: "Property Buying",
      description:
        "Find your dream home with our extensive property listings and expert guidance throughout the buying process.",
      features: [
        "Property search and selection",
        "Site visits and inspections",
        "Price negotiation",
        "Legal documentation support",
        "Post-purchase assistance",
      ],
    },
    {
      icon: "💰",
      title: "Property Selling",
      description:
        "Maximize your property's value with our professional marketing and sales strategies.",
      features: [
        "Property valuation",
        "Professional photography",
        "Multi-channel marketing",
        "Buyer screening",
        "Closing coordination",
      ],
    },
    {
      icon: "📝",
      title: "Property Rental",
      description:
        "Streamline your rental process with our comprehensive property management services.",
      features: [
        "Tenant screening",
        "Lease agreement preparation",
        "Rent collection",
        "Property maintenance coordination",
        "Regular inspections",
      ],
    },
    {
      icon: "🏢",
      title: "Commercial Properties",
      description:
        "Find the perfect commercial space for your business with our specialized commercial real estate services.",
      features: [
        "Office space leasing",
        "Retail location finding",
        "Warehouse and industrial",
        "Investment properties",
        "Market analysis",
      ],
    },
    {
      icon: "⚖️",
      title: "Legal Support",
      description:
        "Navigate the legal aspects of real estate transactions with our expert legal assistance.",
      features: [
        "Contract review",
        "Title verification",
        "Registration support",
        "Legal consultation",
        "Document preparation",
      ],
    },
    {
      icon: "📊",
      title: "Property Valuation",
      description:
        "Get accurate property valuations for buying, selling, or investment purposes.",
      features: [
        "Market analysis",
        "Comparative pricing",
        "Investment potential assessment",
        "Detailed valuation reports",
        "Consultation services",
      ],
    },
  ];

  const process = [
    {
      step: "01",
      title: "Consultation",
      description:
        "We discuss your needs, preferences, and budget to understand your requirements.",
    },
    {
      step: "02",
      title: "Property Search",
      description:
        "Our team searches for properties that match your criteria from our extensive database.",
    },
    {
      step: "03",
      title: "Site Visits",
      description:
        "We arrange and accompany you on property visits to ensure you make informed decisions.",
    },
    {
      step: "04",
      title: "Negotiation",
      description:
        "We handle price negotiations and terms on your behalf to get the best deal.",
    },
    {
      step: "05",
      title: "Documentation",
      description:
        "We assist with all legal paperwork and ensure a smooth transaction process.",
    },
    {
      step: "06",
      title: "Closing",
      description:
        "We coordinate the final steps and ensure successful property transfer.",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Our Services
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Comprehensive real estate solutions tailored to meet your unique
            needs. From buying your first home to managing investment
            properties.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {services.map((service, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition duration-300"
            >
              <div className="p-6">
                <div className="text-4xl mb-4">{service.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {service.title}
                </h3>
                <p className="text-gray-600 mb-4">{service.description}</p>
                <ul className="space-y-2">
                  {service.features.map((feature, featureIndex) => (
                    <li
                      key={featureIndex}
                      className="flex items-center text-sm text-gray-600"
                    >
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-gray-50 px-6 py-4">
                <button className="text-blue-600 hover:text-blue-700 font-medium transition duration-300">
                  Learn More →
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Process Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Our Process
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {process.map((step, index) => (
              <div key={index} className="text-center">
                <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-blue-600">
                    {step.step}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-blue-600 rounded-lg shadow-lg p-12 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-blue-100 text-xl mb-8 max-w-2xl mx-auto">
            Let us help you find your perfect property or maximize your real
            estate investment.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-medium hover:bg-blue-50 transition duration-300">
              Contact Us Today
            </button>
            <button className="border-2 border-white text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition duration-300">
              View Properties
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Services;
