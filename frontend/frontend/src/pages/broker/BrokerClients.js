import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "../../api/axios";
import { useTranslation } from "react-i18next";

const BrokerClients = () => {
  const { t } = useTranslation();
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedClient, setSelectedClient] = useState(null);
  const [showContactModal, setShowContactModal] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    filterClients();
  }, [clients, searchTerm, roleFilter]);

  const fetchClients = async () => {
    try {
      const propertiesResponse = await axios.get(
        "/api/property/broker/assigned?limit=1000"
      );
      const properties =
        propertiesResponse.data.properties || propertiesResponse.data;

      const clientMap = new Map();

      properties.forEach((property) => {
        if (property.owner && property.owner._id) {
          if (!clientMap.has(property.owner._id)) {
            clientMap.set(property.owner._id, {
              ...property.owner,
              role: "Property Owner",
              properties: [property],
              totalProperties: 1,
              activeProperties:
                property.status === "Available" || property.status === "Ordered"
                  ? 1
                  : 0,
              completedProperties:
                property.status === "Sold" || property.status === "Rented"
                  ? 1
                  : 0,
            });
          } else {
            const existingClient = clientMap.get(property.owner._id);
            existingClient.properties.push(property);
            existingClient.totalProperties++;
            if (
              property.status === "Available" ||
              property.status === "Ordered"
            ) {
              existingClient.activeProperties++;
            }
            if (property.status === "Sold" || property.status === "Rented") {
              existingClient.completedProperties++;
            }
          }
        }

        if (property.currentBuyer && property.currentBuyer._id) {
          if (!clientMap.has(property.currentBuyer._id)) {
            clientMap.set(property.currentBuyer._id, {
              ...property.currentBuyer,
              role: "Buyer",
              properties: [property],
              totalProperties: 1,
              activeProperties: property.status === "Ordered" ? 1 : 0,
              completedProperties: property.status === "Sold" ? 1 : 0,
            });
          } else {
            const existingClient = clientMap.get(property.currentBuyer._id);
            existingClient.properties.push(property);
            existingClient.totalProperties++;
            if (property.status === "Ordered") {
              existingClient.activeProperties++;
            }
            if (property.status === "Sold") {
              existingClient.completedProperties++;
            }
          }
        }

        if (property.currentRenter && property.currentRenter._id) {
          if (!clientMap.has(property.currentRenter._id)) {
            clientMap.set(property.currentRenter._id, {
              ...property.currentRenter,
              role: "Renter",
              properties: [property],
              totalProperties: 1,
              activeProperties: property.status === "Ordered" ? 1 : 0,
              completedProperties: property.status === "Rented" ? 1 : 0,
            });
          } else {
            const existingClient = clientMap.get(property.currentRenter._id);
            existingClient.properties.push(property);
            existingClient.totalProperties++;
            if (property.status === "Ordered") {
              existingClient.activeProperties++;
            }
            if (property.status === "Rented") {
              existingClient.completedProperties++;
            }
          }
        }
      });

      const clientsArray = Array.from(clientMap.values());
      setClients(clientsArray);
      setFilteredClients(clientsArray);
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterClients = () => {
    let filtered = clients;

    if (searchTerm) {
      filtered = filtered.filter(
        (client) =>
          client.fname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.lname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.phone?.includes(searchTerm)
      );
    }

    if (roleFilter !== "all") {
      filtered = filtered.filter((client) => client.role === roleFilter);
    }

    setFilteredClients(filtered);
  };

  const getRoleBadge = (role) => {
    const roleConfig = {
      "Property Owner": {
        color: "bg-blue-100 text-blue-800",
        text: t("broker.owner"),
      },
      Buyer: { color: "bg-green-100 text-green-800", text: t("broker.buyer") },
      Renter: {
        color: "bg-purple-100 text-purple-800",
        text: t("broker.renter"),
      },
    };

    const config = roleConfig[role] || {
      color: "bg-gray-100 text-gray-800",
      text: role,
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
      >
        {config.text}
      </span>
    );
  };

  const sendMessage = async (message) => {
    try {
      console.log(
        "Sending message to:",
        selectedClient.email,
        "Message:",
        message
      );
      alert(t("broker.messageSent"));
      setShowContactModal(false);
    } catch (error) {
      console.error("Error sending message:", error);
      alert(t("broker.messageFailed"));
    }
  };

  const getClientStats = () => {
    const totalClients = clients.length;
    const owners = clients.filter((c) => c.role === "Property Owner").length;
    const buyers = clients.filter((c) => c.role === "Buyer").length;
    const renters = clients.filter((c) => c.role === "Renter").length;

    return { totalClients, owners, buyers, renters };
  };

  const stats = getClientStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {t("broker.myClients")}
              </h1>
              <p className="text-gray-600 mt-2">
                {t("broker.manageAndCommunicate")}
              </p>
            </div>
            <Link
              to="/broker/dashboard"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition duration-200"
            >
              {t("broker.backToDashboard")}
            </Link>
          </div>
        </div>

        {/* Client Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg mr-4">
                <span className="text-2xl text-blue-600">👥</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {t("broker.totalClients")}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalClients}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg mr-4">
                <span className="text-2xl text-green-600">🏠</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {t("broker.propertyOwners")}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.owners}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg mr-4">
                <span className="text-2xl text-purple-600">💰</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {t("broker.buyers")}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.buyers}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-lg mr-4">
                <span className="text-2xl text-orange-600">🔑</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {t("broker.renters")}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.renters}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("broker.searchClients")}
              </label>
              <input
                type="text"
                placeholder={t("broker.searchPlaceholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("broker.filterByRole")}
              </label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">{t("broker.allRoles")}</option>
                <option value="Property Owner">
                  {t("broker.propertyOwners")}
                </option>
                <option value="Buyer">{t("broker.buyers")}</option>
                <option value="Renter">{t("broker.renters")}</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm("");
                  setRoleFilter("all");
                }}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md font-semibold transition duration-200"
              >
                {t("broker.clearFilters")}
              </button>
            </div>
          </div>
        </div>

        {/* Clients Grid */}
        {filteredClients.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClients.map((client) => (
              <div
                key={client._id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition duration-300"
              >
                <div className="p-6">
                  {/* Client Header */}
                  <div className="flex items-center mb-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-xl">
                        {client.fname?.charAt(0)?.toUpperCase()}
                        {client.lname?.charAt(0)?.toUpperCase()}
                      </span>
                    </div>
                    <div className="ml-4 flex-1">
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {client.fname} {client.lname}
                      </h3>
                      <p className="text-sm text-gray-500 truncate">
                        {client.email}
                      </p>
                      <div className="mt-1">{getRoleBadge(client.role)}</div>
                    </div>
                  </div>

                  {/* Client Info */}
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t("auth.phone")}:</span>
                      <span className="font-medium">
                        {client.phone || t("broker.notProvided")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        {t("broker.totalProperties")}:
                      </span>
                      <span className="font-medium">
                        {client.totalProperties || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        {t("broker.active")}:
                      </span>
                      <span className="font-medium text-green-600">
                        {client.activeProperties || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        {t("broker.completed")}:
                      </span>
                      <span className="font-medium text-blue-600">
                        {client.completedProperties || 0}
                      </span>
                    </div>
                  </div>

                  {/* Properties Preview */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">
                      {t("broker.recentProperties")}:
                    </h4>
                    <div className="space-y-2">
                      {client.properties?.slice(0, 2).map((property) => (
                        <div
                          key={property._id}
                          className="flex justify-between items-center text-xs"
                        >
                          <span className="text-gray-600 truncate flex-1">
                            {property.title}
                          </span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              property.status === "Sold" ||
                              property.status === "Rented"
                                ? "bg-green-100 text-green-800"
                                : property.status === "Ordered"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {t(
                              `properties.status.${property.status.toLowerCase()}`
                            )}
                          </span>
                        </div>
                      ))}
                      {client.properties?.length > 2 && (
                        <p className="text-xs text-gray-500 text-center">
                          +{client.properties.length - 2}{" "}
                          {t("broker.moreProperties")}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-6 flex space-x-2">
                    <button
                      onClick={() => {
                        setSelectedClient(client);
                        setShowContactModal(true);
                      }}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-lg text-sm font-medium transition duration-300"
                    >
                      {t("communication.messages")}
                    </button>
                    <Link
                      to={`/broker/clients/${client._id}`}
                      className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-3 rounded-lg text-sm font-medium text-center transition duration-300"
                    >
                      {t("common.view")} {t("common.details")}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-gray-400 text-6xl mb-4">👥</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {clients.length === 0
                ? t("broker.noClientsFound")
                : t("broker.noClientsMatch")}
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              {clients.length === 0
                ? t("broker.clientsWillAppear")
                : t("broker.adjustSearchTerms")}
            </p>
          </div>
        )}

        {/* Contact Modal */}
        {showContactModal && selectedClient && (
          <ContactModal
            client={selectedClient}
            onClose={() => setShowContactModal(false)}
            onSend={sendMessage}
            t={t}
          />
        )}
      </div>
    </div>
  );
};

// Contact Modal Component
const ContactModal = ({ client, onClose, onSend, t }) => {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    setSending(true);
    await onSend(message);
    setSending(false);
    setMessage("");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {t("broker.contact")} {client.fname} {client.lname}
        </h3>

        <div className="space-y-3 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">{t("auth.email")}:</span>
            <span className="font-medium">{client.email}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">{t("auth.phone")}:</span>
            <span className="font-medium">
              {client.phone || t("broker.notProvided")}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("communication.messages")}
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows="4"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={t("broker.typeMessageHere")}
              required
            />
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-md font-medium transition duration-200"
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              disabled={sending || !message.trim()}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2 px-4 rounded-md font-medium transition duration-200"
            >
              {sending ? t("broker.sending") : t("broker.sendMessage")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BrokerClients;
