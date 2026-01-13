// src/pages/About.js
import React from "react";

const About = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            About ETHIO Broker
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Your trusted partner in Ethiopian real estate, connecting dreams
            with properties since 2024.
          </p>
        </div>

        {/* Mission & Vision */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Our Mission
            </h2>
            <p className="text-gray-600">
              To revolutionize the real estate experience in Ethiopia by
              providing transparent, reliable, and accessible property services
              that empower individuals and families to find their perfect home
              or investment opportunity.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Our Vision
            </h2>
            <p className="text-gray-600">
              To become Ethiopia's most trusted real estate platform, setting
              new standards for excellence in property brokerage and customer
              service while contributing to the nation's urban development.
            </p>
          </div>
        </div>

        {/* Our Story */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
          <div className="prose prose-lg text-gray-600">
            <p className="mb-4">
              Founded in 2024, ETHIO Broker emerged from a simple observation:
              the Ethiopian real estate market needed a modern, transparent, and
              customer-focused platform that could bridge the gap between
              property seekers and sellers.
            </p>
            <p className="mb-4">
              Our team of experienced real estate professionals, technology
              experts, and customer service specialists came together with a
              shared vision to transform how properties are bought, sold, and
              rented in Ethiopia.
            </p>
            <p>
              Today, we serve thousands of clients across Addis Ababa and major
              Ethiopian cities, helping them navigate the real estate market
              with confidence and ease.
            </p>
          </div>
        </div>

        {/* Values */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Our Values
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🏠</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Trust</h3>
              <p className="text-gray-600">
                We build lasting relationships based on transparency and
                reliability in every transaction.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⭐</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Excellence
              </h3>
              <p className="text-gray-600">
                We strive for the highest standards in service delivery and
                customer satisfaction.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🌍</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Innovation
              </h3>
              <p className="text-gray-600">
                We leverage technology to create seamless and efficient real
                estate experiences.
              </p>
            </div>
          </div>
        </div>

        {/* Team Section */}
        <div className="bg-gray-100 rounded-lg p-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
            Why Choose ETHIO Broker?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <h4 className="font-bold text-gray-900 mb-2">5000+</h4>
              <p className="text-gray-600">Properties Listed</p>
            </div>
            <div className="text-center">
              <h4 className="font-bold text-gray-900 mb-2">1000+</h4>
              <p className="text-gray-600">Happy Clients</p>
            </div>
            <div className="text-center">
              <h4 className="font-bold text-gray-900 mb-2">10+</h4>
              <p className="text-gray-600">Cities Covered</p>
            </div>
            <div className="text-center">
              <h4 className="font-bold text-gray-900 mb-2">24/7</h4>
              <p className="text-gray-600">Customer Support</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
