import React, { useState, useEffect } from "react";
import axios from "../../api/axios";
import { useTranslation } from "react-i18next";

const ContactMessages = () => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filters, setFilters] = useState({
    status: "",
    subject: "",
    priority: "",
    search: "",
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalMessages: 0,
  });
  const [stats, setStats] = useState({
    new: 0,
    read: 0,
    replied: 0,
    resolved: 0,
  });

  const statusColors = {
    new: "bg-blue-100 text-blue-800",
    read: "bg-yellow-100 text-yellow-800",
    replied: "bg-green-100 text-green-800",
    resolved: "bg-gray-100 text-gray-800",
  };

  const priorityColors = {
    low: "bg-gray-100 text-gray-800",
    medium: "bg-blue-100 text-blue-800",
    high: "bg-orange-100 text-orange-800",
    urgent: "bg-red-100 text-red-800",
  };

  const subjectLabels = {
    "real-estate-inquiry": t(
      "admin.contactMessages.subjects.realEstateInquiry",
      "Real Estate Inquiry",
    ),
    "automotive-inquiry": t(
      "admin.contactMessages.subjects.automotiveInquiry",
      "Automotive Inquiry",
    ),
    "electronics-inquiry": t(
      "admin.contactMessages.subjects.electronicsInquiry",
      "Electronics Inquiry",
    ),
    "list-property": t(
      "admin.contactMessages.subjects.listProperty",
      "List a Property",
    ),
    "sell-vehicle": t(
      "admin.contactMessages.subjects.sellVehicle",
      "Sell a Vehicle",
    ),
    "sell-electronics": t(
      "admin.contactMessages.subjects.sellElectronics",
      "Sell Electronics",
    ),
    "general-question": t(
      "admin.contactMessages.subjects.generalQuestion",
      "General Question",
    ),
    support: t("admin.contactMessages.subjects.support", "Support"),
    feedback: t("admin.contactMessages.subjects.feedback", "Feedback"),
  };

  const statusDisplay = {
    new: t("admin.contactMessages.status.new", "New"),
    read: t("admin.contactMessages.status.read", "Read"),
    replied: t("admin.contactMessages.status.replied", "Replied"),
    resolved: t("admin.contactMessages.status.resolved", "Resolved"),
  };

  const priorityDisplay = {
    low: t("admin.contactMessages.priority.low", "Low"),
    medium: t("admin.contactMessages.priority.medium", "Medium"),
    high: t("admin.contactMessages.priority.high", "High"),
    urgent: t("admin.contactMessages.priority.urgent", "Urgent"),
  };

  useEffect(() => {
    fetchMessages();
  }, [filters, pagination.currentPage]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.status) params.append("status", filters.status);
      if (filters.subject) params.append("subject", filters.subject);
      if (filters.priority) params.append("priority", filters.priority);
      if (filters.search) params.append("search", filters.search);
      params.append("page", pagination.currentPage);
      params.append("limit", 10);

      const response = await axios.get(`/api/contact/messages?${params}`);

      if (response.data.success) {
        setMessages(response.data.messages);
        setPagination(response.data.pagination);
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      setError(
        t(
          "admin.contactMessages.errors.fetchFailed",
          "Failed to fetch contact messages",
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const viewMessage = async (messageId) => {
    try {
      const response = await axios.get(`/api/contact/messages/${messageId}`);
      if (response.data.success) {
        setSelectedMessage(response.data.message);
        setShowModal(true);
        // Refresh the list to update read status
        fetchMessages();
      }
    } catch (error) {
      console.error("Error fetching message:", error);
      setError(
        t(
          "admin.contactMessages.errors.fetchMessageFailed",
          "Failed to fetch message details",
        ),
      );
    }
  };

  const updateMessageStatus = async (
    messageId,
    status,
    priority,
    adminNotes,
  ) => {
    try {
      const response = await axios.put(`/api/contact/messages/${messageId}`, {
        status,
        priority,
        adminNotes,
      });

      if (response.data.success) {
        setSelectedMessage(response.data.data);
        fetchMessages(); // Refresh the list
      }
    } catch (error) {
      console.error("Error updating message:", error);
      setError(
        t(
          "admin.contactMessages.errors.updateFailed",
          "Failed to update message",
        ),
      );
    }
  };

  const deleteMessage = async (messageId) => {
    if (
      !window.confirm(
        t(
          "admin.contactMessages.confirmDelete",
          "Are you sure you want to delete this message?",
        ),
      )
    ) {
      return;
    }

    try {
      const response = await axios.delete(`/api/contact/messages/${messageId}`);
      if (response.data.success) {
        setShowModal(false);
        fetchMessages();
      }
    } catch (error) {
      console.error("Error deleting message:", error);
      setError(
        t(
          "admin.contactMessages.errors.deleteFailed",
          "Failed to delete message",
        ),
      );
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("am-ET", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading && messages.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t("admin.contactMessages.title", "Contact Messages")}
          </h1>
          <p className="text-gray-600">
            {t(
              "admin.contactMessages.subtitle",
              "Manage and respond to customer inquiries",
            )}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <span className="text-2xl">📩</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  {t("admin.contactMessages.stats.new", "New Messages")}
                </p>
                <p className="text-2xl font-bold text-gray-900">{stats.new}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <span className="text-2xl">👁️</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  {t("admin.contactMessages.stats.read", "Read")}
                </p>
                <p className="text-2xl font-bold text-gray-900">{stats.read}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <span className="text-2xl">💬</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  {t("admin.contactMessages.stats.replied", "Replied")}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.replied}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-gray-100 rounded-lg">
                <span className="text-2xl">✅</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  {t("admin.contactMessages.stats.resolved", "Resolved")}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.resolved}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("admin.contactMessages.filters.status", "Status")}
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">
                  {t(
                    "admin.contactMessages.filters.allStatuses",
                    "All Statuses",
                  )}
                </option>
                <option value="new">
                  {t("admin.contactMessages.status.new", "New")}
                </option>
                <option value="read">
                  {t("admin.contactMessages.status.read", "Read")}
                </option>
                <option value="replied">
                  {t("admin.contactMessages.status.replied", "Replied")}
                </option>
                <option value="resolved">
                  {t("admin.contactMessages.status.resolved", "Resolved")}
                </option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("admin.contactMessages.filters.subject", "Subject")}
              </label>
              <select
                value={filters.subject}
                onChange={(e) => handleFilterChange("subject", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">
                  {t(
                    "admin.contactMessages.filters.allSubjects",
                    "All Subjects",
                  )}
                </option>
                {Object.entries(subjectLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("admin.contactMessages.filters.priority", "Priority")}
              </label>
              <select
                value={filters.priority}
                onChange={(e) => handleFilterChange("priority", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">
                  {t(
                    "admin.contactMessages.filters.allPriorities",
                    "All Priorities",
                  )}
                </option>
                <option value="low">
                  {t("admin.contactMessages.priority.low", "Low")}
                </option>
                <option value="medium">
                  {t("admin.contactMessages.priority.medium", "Medium")}
                </option>
                <option value="high">
                  {t("admin.contactMessages.priority.high", "High")}
                </option>
                <option value="urgent">
                  {t("admin.contactMessages.priority.urgent", "Urgent")}
                </option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("admin.contactMessages.filters.search", "Search")}
              </label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                placeholder={t(
                  "admin.contactMessages.filters.searchPlaceholder",
                  "Search name, email, or message...",
                )}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Messages Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t(
                      "admin.contactMessages.table.contactInfo",
                      "Contact Info",
                    )}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("admin.contactMessages.table.subject", "Subject")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("admin.contactMessages.table.status", "Status")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("admin.contactMessages.table.priority", "Priority")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("admin.contactMessages.table.date", "Date")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("admin.contactMessages.table.actions", "Actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {messages.map((message) => (
                  <tr key={message._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {message.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {message.email}
                        </div>
                        {message.phone && (
                          <div className="text-sm text-gray-500">
                            {message.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {subjectLabels[message.subject]}
                      </div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {message.message.substring(0, 100)}...
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[message.status]}`}
                      >
                        {statusDisplay[message.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${priorityColors[message.priority]}`}
                      >
                        {priorityDisplay[message.priority]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(message.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => viewMessage(message._id)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        {t("admin.contactMessages.actions.view", "View")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() =>
                    setPagination((prev) => ({
                      ...prev,
                      currentPage: prev.currentPage - 1,
                    }))
                  }
                  disabled={!pagination.hasPrev}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  {t("common.previous", "Previous")}
                </button>
                <button
                  onClick={() =>
                    setPagination((prev) => ({
                      ...prev,
                      currentPage: prev.currentPage + 1,
                    }))
                  }
                  disabled={!pagination.hasNext}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  {t("common.next", "Next")}
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    {t(
                      "admin.contactMessages.pagination.showing",
                      "Showing page {{current}} of {{total}} ({{totalMessages}} total messages)",
                      {
                        current: pagination.currentPage,
                        total: pagination.totalPages,
                        totalMessages: pagination.totalMessages,
                      },
                    )}
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() =>
                        setPagination((prev) => ({
                          ...prev,
                          currentPage: prev.currentPage - 1,
                        }))
                      }
                      disabled={!pagination.hasPrev}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      {t("common.previous", "Previous")}
                    </button>
                    <button
                      onClick={() =>
                        setPagination((prev) => ({
                          ...prev,
                          currentPage: prev.currentPage + 1,
                        }))
                      }
                      disabled={!pagination.hasNext}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      {t("common.next", "Next")}
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Message Detail Modal */}
        {showModal && selectedMessage && (
          <MessageDetailModal
            message={selectedMessage}
            onClose={() => setShowModal(false)}
            onUpdate={updateMessageStatus}
            onDelete={deleteMessage}
            t={t}
          />
        )}
      </div>
    </div>
  );
};

// Message Detail Modal Component
const MessageDetailModal = ({ message, onClose, onUpdate, onDelete, t }) => {
  const [status, setStatus] = useState(message.status);
  const [priority, setPriority] = useState(message.priority);
  const [adminNotes, setAdminNotes] = useState(message.adminNotes || "");
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replySubject, setReplySubject] = useState(
    `Re: ${message.subjectDisplay}`,
  );
  const [replyMessage, setReplyMessage] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  const handleUpdate = () => {
    onUpdate(message._id, status, priority, adminNotes);
  };

  const handleSendReply = async () => {
    if (!replySubject.trim() || !replyMessage.trim()) {
      alert(
        t(
          "admin.contactMessages.reply.errors.emptyFields",
          "Please provide both subject and message for the reply.",
        ),
      );
      return;
    }

    setSendingReply(true);
    try {
      const response = await axios.post(
        `/api/contact/messages/${message._id}/reply`,
        {
          replySubject: replySubject.trim(),
          replyMessage: replyMessage.trim(),
        },
      );

      if (response.data.success) {
        alert(
          t("admin.contactMessages.reply.success", "Reply sent successfully!"),
        );
        setShowReplyForm(false);
        setReplyMessage("");
        // Update the message status to replied
        setStatus("replied");
        onUpdate(message._id, "replied", priority, adminNotes);
      }
    } catch (error) {
      console.error("Error sending reply:", error);
      alert(
        t(
          "admin.contactMessages.reply.errors.failed",
          "Failed to send reply. Please try again.",
        ),
      );
    } finally {
      setSendingReply(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("am-ET", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const statusOptions = {
    new: t("admin.contactMessages.status.new", "New"),
    read: t("admin.contactMessages.status.read", "Read"),
    replied: t("admin.contactMessages.status.replied", "Replied"),
    resolved: t("admin.contactMessages.status.resolved", "Resolved"),
  };

  const priorityOptions = {
    low: t("admin.contactMessages.priority.low", "Low"),
    medium: t("admin.contactMessages.priority.medium", "Medium"),
    high: t("admin.contactMessages.priority.high", "High"),
    urgent: t("admin.contactMessages.priority.urgent", "Urgent"),
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 xl:w-1/2 shadow-lg rounded-md bg-white max-h-screen overflow-y-auto">
        <div className="mt-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">
              {t("admin.contactMessages.modal.title", "Message Details")}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <span className="sr-only">Close</span>
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Message Content */}
          <div className="space-y-6">
            {/* Contact Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">
                {t(
                  "admin.contactMessages.modal.contactInfo",
                  "Contact Information",
                )}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">
                    {t("admin.contactMessages.modal.name", "Name")}
                  </p>
                  <p className="font-medium">{message.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">
                    {t("admin.contactMessages.modal.email", "Email")}
                  </p>
                  <p className="font-medium">
                    <a
                      href={`mailto:${message.email}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {message.email}
                    </a>
                  </p>
                </div>
                {message.phone && (
                  <div>
                    <p className="text-sm text-gray-600">
                      {t("admin.contactMessages.modal.phone", "Phone")}
                    </p>
                    <p className="font-medium">
                      <a
                        href={`tel:${message.phone}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {message.phone}
                      </a>
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600">
                    {t("admin.contactMessages.modal.subject", "Subject")}
                  </p>
                  <p className="font-medium">{message.subjectDisplay}</p>
                </div>
              </div>
            </div>

            {/* Message */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">
                {t("admin.contactMessages.modal.message", "Message")}
              </h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="whitespace-pre-wrap">{message.message}</p>
              </div>
            </div>

            {/* Reply Section */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">
                  {t(
                    "admin.contactMessages.modal.replyTitle",
                    "Reply to Customer",
                  )}
                </h4>
                {!showReplyForm && (
                  <button
                    onClick={() => setShowReplyForm(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center space-x-2"
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
                        d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    <span>
                      {t("admin.contactMessages.modal.sendReply", "Send Reply")}
                    </span>
                  </button>
                )}
              </div>

              {showReplyForm && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t(
                        "admin.contactMessages.modal.replySubject",
                        "Reply Subject",
                      )}
                    </label>
                    <input
                      type="text"
                      value={replySubject}
                      onChange={(e) => setReplySubject(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={t(
                        "admin.contactMessages.modal.replySubjectPlaceholder",
                        "Enter reply subject",
                      )}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t(
                        "admin.contactMessages.modal.replyMessage",
                        "Reply Message",
                      )}
                    </label>
                    <textarea
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      rows="6"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={t(
                        "admin.contactMessages.modal.replyMessagePlaceholder",
                        "Type your reply message here...",
                      )}
                    />
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={handleSendReply}
                      disabled={sendingReply}
                      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 flex items-center space-x-2"
                    >
                      {sendingReply ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>
                            {t(
                              "admin.contactMessages.modal.sending",
                              "Sending...",
                            )}
                          </span>
                        </>
                      ) : (
                        <>
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
                              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                            />
                          </svg>
                          <span>
                            {t(
                              "admin.contactMessages.modal.sendReplyButton",
                              "Send Reply",
                            )}
                          </span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setShowReplyForm(false);
                        setReplyMessage("");
                        setReplySubject(`Re: ${message.subjectDisplay}`);
                      }}
                      className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                      {t("common.cancel", "Cancel")}
                    </button>
                  </div>
                </div>
              )}

              {!showReplyForm && (
                <div className="text-sm text-gray-600">
                  <p>
                    💡{" "}
                    <strong>
                      {t(
                        "admin.contactMessages.modal.quickActions",
                        "Quick Actions:",
                      )}
                    </strong>
                  </p>
                  <div className="mt-2 space-x-4">
                    <a
                      href={`mailto:${message.email}?subject=Re: ${message.subjectDisplay}&body=Dear ${message.name},%0D%0A%0D%0AThank you for contacting M4S Broker.%0D%0A%0D%0A`}
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      📧{" "}
                      {t(
                        "admin.contactMessages.modal.openEmail",
                        "Open in Email Client",
                      )}
                    </a>
                    {message.phone && (
                      <a
                        href={`tel:${message.phone}`}
                        className="text-green-600 hover:text-green-800 underline"
                      >
                        📞{" "}
                        {t(
                          "admin.contactMessages.modal.callCustomer",
                          "Call Customer",
                        )}
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Metadata */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">
                {t(
                  "admin.contactMessages.modal.messageDetails",
                  "Message Details",
                )}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">
                    {t("admin.contactMessages.modal.received", "Received")}
                  </p>
                  <p className="font-medium">{formatDate(message.createdAt)}</p>
                </div>
                <div>
                  <p className="text-gray-600">
                    {t("admin.contactMessages.modal.messageId", "Message ID")}
                  </p>
                  <p className="font-medium font-mono text-xs">{message._id}</p>
                </div>
                {message.repliedAt && (
                  <div>
                    <p className="text-gray-600">
                      {t("admin.contactMessages.modal.repliedAt", "Replied At")}
                    </p>
                    <p className="font-medium">
                      {formatDate(message.repliedAt)}
                    </p>
                  </div>
                )}
                {message.repliedBy && (
                  <div>
                    <p className="text-gray-600">
                      {t("admin.contactMessages.modal.repliedBy", "Replied By")}
                    </p>
                    <p className="font-medium">
                      {message.repliedBy.fname} {message.repliedBy.lname}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Admin Controls */}
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">
                {t(
                  "admin.contactMessages.modal.adminControls",
                  "Admin Controls",
                )}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("admin.contactMessages.modal.status", "Status")}
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.entries(statusOptions).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("admin.contactMessages.modal.priority", "Priority")}
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.entries(priorityOptions).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("admin.contactMessages.modal.adminNotes", "Admin Notes")}
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t(
                    "admin.contactMessages.modal.adminNotesPlaceholder",
                    "Add internal notes about this message...",
                  )}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between">
              <button
                onClick={() => onDelete(message._id)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                {t(
                  "admin.contactMessages.modal.deleteMessage",
                  "Delete Message",
                )}
              </button>
              <div className="space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  {t("common.close", "Close")}
                </button>
                <button
                  onClick={handleUpdate}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {t(
                    "admin.contactMessages.modal.updateMessage",
                    "Update Message",
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactMessages;
