import React, { useState, useEffect } from "react";
import axios from "../api/axios";

const About = () => {
  const [stats, setStats] = useState({
    totalItems: 0,
    totalUsers: 0,
    totalCities: 0,
    loading: true
  });

  useEffect(() => {
    fetchRealStats();
  }, []);

  const fetchRealStats = async () => {
    try {
      // Use the existing public stats endpoint
      const response = await axios.get("/api/property/public/stats");
      const data = response.data.data;
      
      setStats({
        totalItems: data.totalProperties,
        totalUsers: data.happyClients, // Verified clients
        totalCities: parseInt(data.citiesCovered.replace('+', '')), // Remove + sign for display
        loading: false
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      // Fallback to default values if API fails
      setStats({
        totalItems: 0,
        totalUsers: 0,
        totalCities: 1, // At least one city (default)
        loading: false
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <img 
              src="/m4sbrokerlogo.png" 
              alt="M4S Broker Logo" 
              className="h-20 w-auto object-contain"
            />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            About M4S Broker Platform
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            A comprehensive brokerage management platform connecting buyers and sellers across cars, homes, and electronics in Ethiopia since 2025.
          </p>
        </div>

        {/* Mission & Vision */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Our Mission
            </h2>
            <p className="text-gray-600">
              To revolutionize the brokerage experience in Ethiopia by
              providing transparent, reliable, and accessible services across
              cars, homes, and electronics that empower individuals and families to find their perfect purchase
              or investment opportunity.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Our Vision
            </h2>
            <p className="text-gray-600">
              To become Ethiopia's most trusted multi-category brokerage platform, setting
              new standards for excellence in cars, homes, and electronics brokerage and customer
              service while contributing to the nation's economic development.
            </p>
          </div>
        </div>

        {/* Our Story */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
          <div className="prose prose-lg text-gray-600">
            <p className="mb-4">
              Founded in 2025, M4S Broker emerged from a simple observation:
              the Ethiopian market needed a modern, transparent, and
              customer-focused platform that could bridge the gap between
              buyers and sellers across multiple categories - cars, homes, and electronics.
            </p>
            <p className="mb-4">
              Our team of experienced brokerage professionals, technology
              experts, and customer service specialists came together with a
              shared vision to transform how cars, homes, and electronics are bought, sold, and
              traded in Ethiopia.
            </p>
            <p>
              Today, we serve thousands of clients across Addis Ababa and major
              Ethiopian cities, helping them navigate the marketplace
              with confidence and ease across all our supported categories.
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
                reliability in every transaction across all categories.
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
                customer satisfaction across cars, homes, and electronics.
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
                We leverage technology to create seamless and efficient
                brokerage experiences across multiple product categories.
              </p>
            </div>
          </div>
        </div>

        {/* Team Section */}
        <div className="bg-gray-100 rounded-lg p-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
            Why Choose M4S Broker?
          </h2>
          {stats.loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <span className="ml-3 text-gray-600">Loading statistics...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <h4 className="font-bold text-gray-900 mb-2 text-2xl">
                  {stats.totalItems}
                </h4>
                <p className="text-gray-600">Items Listed</p>
              </div>
              <div className="text-center">
                <h4 className="font-bold text-gray-900 mb-2 text-2xl">
                  {stats.totalUsers}
                </h4>
                <p className="text-gray-600">Verified Clients</p>
              </div>
              <div className="text-center">
                <h4 className="font-bold text-gray-900 mb-2 text-2xl">
                  {stats.totalCities}
                </h4>
                <p className="text-gray-600">Cities Covered</p>
              </div>
              <div className="text-center">
                <h4 className="font-bold text-gray-900 mb-2 text-2xl">24/7</h4>
                <p className="text-gray-600">Customer Support</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default About;
