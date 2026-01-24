


import React from "react";
import { useTranslation } from "react-i18next";

const ReceiptModal = ({ commission, isOpen, onClose }) => {
  const { t } = useTranslation();

  if (!isOpen || !commission) return null;

  const formatPrice = (price) => {
    if (!price) return "ETB 0";
    return new Intl.NumberFormat("en-ET", {
      style: "currency",
      currency: "ETB",
    }).format(price);
  };

  const formatDate = (dateString) => {
    if (!dateString) return t("receiptModal.unknownDate");
    return new Date(dateString).toLocaleDateString("en-ET", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPropertyTitle = (item) => {
    if (!item) return t("receiptModal.unknownProperty");

    // Check multiple possible paths for property title
    const possiblePaths = [
      item.property?.title,
      item.title,
      item.propertyTitle,
      item.metadata?.propertyTitle,
      item.property?.propertyTitle,
      item.property?.name,
    ];

    const title = possiblePaths.find(
      (path) => path && typeof path === "string" && path.trim() !== ""
    );
    return title || t("receiptModal.unknownProperty");
  };

  const getPropertyType = (item) => {
    if (!item) return "N/A";

    const possiblePaths = [
      item.property?.propertyType,
      item.propertyType,
      item.metadata?.propertyType,
      item.property?.type,
    ];

    const type = possiblePaths.find(
      (path) => path && typeof path === "string" && path.trim() !== ""
    );
    return type || "N/A";
  };

  const getPropertyPurpose = (item) => {
    if (!item) return "N/A";

    const possiblePaths = [
      item.property?.purpose,
      item.purpose,
      item.metadata?.purpose,
      item.transactionType,
    ];

    const purpose = possiblePaths.find(
      (path) => path && typeof path === "string" && path.trim() !== ""
    );
    return purpose || "N/A";
  };

  const getPropertyPrice = (item) => {
    if (!item) return 0;

    const possiblePaths = [
      item.property?.price,
      item.price,
      item.metadata?.propertyPrice,
      item.baseAmount,
    ];

    const price = possiblePaths.find(
      (path) => path && typeof path === "number" && path > 0
    );
    return price || 0;
  };

  const getClientName = (item) => {
    if (!item) return t("receiptModal.unknownClient");

    if (item.user && (item.user.fname || item.user.lname)) {
      return `${item.user.fname || ""} ${item.user.lname || ""}`.trim();
    }

    // Fallback to metadata
    if (item.metadata) {
      const possibleNames = [
        item.metadata.orderedByName,
        item.metadata.propertyOwnerName,
        item.metadata.clientName,
      ];

      const name = possibleNames.find(
        (path) => path && typeof path === "string" && path.trim() !== ""
      );
      return name || t("receiptModal.unknownClient");
    }

    return t("receiptModal.unknownClient");
  };

  const getClientEmail = (item) => {
    if (!item) return "N/A";

    if (item.user?.email) {
      return item.user.email;
    }

    if (item.metadata) {
      const possibleEmails = [
        item.metadata.clientEmail,
        item.metadata.userEmail,
      ];

      const email = possibleEmails.find(
        (path) => path && typeof path === "string" && path.trim() !== ""
      );
      return email || "N/A";
    }

    return "N/A";
  };

  const getClientPhone = (item) => {
    if (!item) return "N/A";

    if (item.user?.phone) {
      return item.user.phone;
    }

    return "N/A";
  };

  const getReference = (item) => {
    if (!item) return "N/A";

    const possibleRefs = [
      item.chapaReference,
      item.reference,
      item.transactionId,
      item._id,
    ];

    const ref = possibleRefs.find(
      (path) => path && typeof path === "string" && path.trim() !== ""
    );
    return ref || "N/A";
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");

    // Get all the data using our helper functions
    const propertyTitle = getPropertyTitle(commission);
    const propertyType = getPropertyType(commission);
    const propertyPurpose = getPropertyPurpose(commission);
    const propertyPrice = getPropertyPrice(commission);
    const clientName = getClientName(commission);
    const clientEmail = getClientEmail(commission);
    const clientPhone = getClientPhone(commission);
    const reference = getReference(commission);

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${t("receiptModal.commissionReceipt")} - ${
      commission._id
    }</title>
          <style>
            body { 
              font-family: 'Arial', sans-serif; 
              margin: 0; 
              padding: 20px; 
              color: #333;
              background: white;
            }
            .receipt-container { 
              max-width: 500px; 
              margin: 0 auto; 
              border: 2px solid #000; 
              padding: 25px; 
              background: white;
            }
            .header { 
              text-align: center; 
              border-bottom: 2px solid #000; 
              padding-bottom: 15px; 
              margin-bottom: 20px; 
            }
            .company-name { 
              font-size: 24px; 
              font-weight: bold; 
              margin-bottom: 5px; 
              color: #1f2937;
            }
            .receipt-title { 
              font-size: 18px; 
              margin-bottom: 10px; 
              font-weight: bold;
            }
            .section { 
              margin-bottom: 20px; 
            }
            .section-title { 
              font-weight: bold; 
              border-bottom: 1px solid #ccc; 
              padding-bottom: 5px; 
              margin-bottom: 10px; 
              font-size: 14px;
              color: #374151;
            }
            .detail-row { 
              display: flex; 
              justify-content: space-between; 
              margin-bottom: 8px; 
              font-size: 14px;
            }
            .detail-row .label {
              color: #6b7280;
              font-weight: 500;
            }
            .detail-row .value {
              font-weight: 500;
              text-align: right;
            }
            .total-row { 
              border-top: 2px solid #000; 
              padding-top: 12px; 
              font-weight: bold; 
              font-size: 16px; 
              margin-top: 10px;
            }
            .footer { 
              text-align: center; 
              margin-top: 25px; 
              padding-top: 15px; 
              border-top: 1px solid #ccc; 
              font-size: 12px; 
              color: #6b7280; 
            }
            .status-completed {
              color: #059669;
              font-weight: bold;
            }
            .amount-total {
              color: #059669;
            }
            @media print {
              body { 
                margin: 0; 
                padding: 0;
              }
              .receipt-container {
                border: none;
                box-shadow: none;
                max-width: 100%;
              }
            }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <div class="header">
              <div class="company-name">ETHIO BROKER</div>
              <div class="receipt-title">${t(
                "receiptModal.commissionReceipt"
              ).toUpperCase()}</div>
              <div style="font-size: 14px; margin-top: 5px;">${t(
                "receiptModal.transactionId"
              )}: ${commission._id}</div>
            </div>

            <div class="section">
              <div class="section-title">${t(
                "receiptModal.transactionDetails"
              ).toUpperCase()}</div>
              <div class="detail-row">
                <span class="label">${t("receiptModal.dateTime")}:</span>
                <span class="value">${formatDate(
                  commission.paymentDate || commission.createdAt
                )}</span>
              </div>
              <div class="detail-row">
                <span class="label">${t(
                  "receiptModal.paymentReference"
                )}:</span>
                <span class="value">${reference}</span>
              </div>
              <div class="detail-row">
                <span class="label">${t("common.status")}:</span>
                <span class="value status-completed">${
                  commission.paymentStatus
                }</span>
              </div>
              <div class="detail-row">
                <span class="label">${t("receiptModal.transactionType")}:</span>
                <span class="value">${t("receiptModal.brokerCommission")}</span>
              </div>
            </div>

            <div class="section">
              <div class="section-title">${t(
                "receiptModal.propertyInformation"
              ).toUpperCase()}</div>
              <div class="detail-row">
                <span class="label">${t("properties.form.title")}:</span>
                <span class="value">${propertyTitle}</span>
              </div>
              <div class="detail-row">
                <span class="label">${t("properties.type")}:</span>
                <span class="value">${propertyType}</span>
              </div>
              <div class="detail-row">
                <span class="label">${t(
                  "receiptModal.transactionPurpose"
                )}:</span>
                <span class="value">${propertyPurpose}</span>
              </div>
              ${
                propertyPrice > 0
                  ? `
              <div class="detail-row">
                <span class="label">${t("properties.price")}:</span>
                <span class="value">${formatPrice(propertyPrice)}</span>
              </div>
              `
                  : ""
              }
            </div>

            <div class="section">
              <div class="section-title">${t(
                "receiptModal.clientInformation"
              ).toUpperCase()}</div>
              <div class="detail-row">
                <span class="label">${t("receiptModal.clientName")}:</span>
                <span class="value">${clientName}</span>
              </div>
              <div class="detail-row">
                <span class="label">${t("receiptModal.clientRole")}:</span>
                <span class="value">
                  ${
                    commission.metadata?.role === "buyer_renter"
                      ? t("receiptModal.buyerRenter")
                      : commission.metadata?.role === "property_owner"
                      ? t("receiptModal.propertyOwner")
                      : commission.metadata?.role || t("receiptModal.client")
                  }
                </span>
              </div>
              <div class="detail-row">
                <span class="label">${t("receiptModal.clientEmail")}:</span>
                <span class="value">${clientEmail}</span>
              </div>
              ${
                clientPhone !== "N/A"
                  ? `
              <div class="detail-row">
                <span class="label">${t("receiptModal.clientPhone")}:</span>
                <span class="value">${clientPhone}</span>
              </div>
              `
                  : ""
              }
            </div>

            <div class="section">
              <div class="section-title">${t(
                "receiptModal.commissionBreakdown"
              ).toUpperCase()}</div>
              ${
                commission.buyerCommission > 0
                  ? `
              <div class="detail-row">
                <span class="label">${t("receiptModal.buyerCommission")}:</span>
                <span class="value">${formatPrice(
                  commission.buyerCommission
                )}</span>
              </div>
              `
                  : ""
              }
              ${
                commission.sellerCommission > 0
                  ? `
              <div class="detail-row">
                <span class="label">${t(
                  "receiptModal.sellerCommission"
                )}:</span>
                <span class="value">${formatPrice(
                  commission.sellerCommission
                )}</span>
              </div>
              `
                  : ""
              }
              ${
                commission.commissionAmount > 0 &&
                !commission.buyerCommission &&
                !commission.sellerCommission
                  ? `
              <div class="detail-row">
                <span class="label">${t(
                  "receiptModal.commissionAmount"
                )}:</span>
                <span class="value">${formatPrice(
                  commission.commissionAmount
                )}</span>
              </div>
              `
                  : ""
              }
              <div class="detail-row total-row">
                <span class="label">${t(
                  "receiptModal.totalCommissionEarned"
                )}:</span>
                <span class="value amount-total">${formatPrice(
                  commission.amount
                )}</span>
              </div>
            </div>

            <div class="section">
              <div class="section-title">${t(
                "receiptModal.brokerInformation"
              ).toUpperCase()}</div>
              <div class="detail-row">
                <span class="label">${t("receiptModal.brokerName")}:</span>
                <span class="value">${
                  commission.broker?.fname ||
                  commission.assignedBroker?.fname ||
                  t("common.you")
                } ${
      commission.broker?.lname || commission.assignedBroker?.lname || ""
    }</span>
              </div>
              <div class="detail-row">
                <span class="label">${t("receiptModal.assignmentType")}:</span>
                <span class="value">${
                  commission.metadata?.assignmentType === "admin_assigned"
                    ? t("receiptModal.adminAssigned")
                    : t("receiptModal.regularAssignment")
                }</span>
              </div>
            </div>

            <div class="footer">
              <div style="margin-bottom: 8px; font-weight: 500;">${t(
                "receiptModal.thankYou"
              )}</div>
              <div>${t("receiptModal.companyInfo")}</div>
              <div>${t("receiptModal.contactInfo")}</div>
              <div style="margin-top: 8px; font-style: italic;">${t(
                "receiptModal.automatedReceipt"
              )}</div>
              <div style="margin-top: 5px; font-size: 11px;">${t(
                "receiptModal.generatedOn"
              )}: ${new Date().toLocaleDateString("en-ET", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })}</div>
            </div>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();

    // Wait for content to load before printing
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 500);
  };

  // Use helper functions to get data for modal display
  const propertyTitle = getPropertyTitle(commission);
  const propertyType = getPropertyType(commission);
  const propertyPurpose = getPropertyPurpose(commission);
  const propertyPrice = getPropertyPrice(commission);
  const clientName = getClientName(commission);
  const clientEmail = getClientEmail(commission);
  const clientPhone = getClientPhone(commission);
  const reference = getReference(commission);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b bg-gray-50">
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              {t("receiptModal.commissionReceipt")}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {t("receiptModal.transactionId")}: {commission._id}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors"
          >
            ×
          </button>
        </div>

        {/* Receipt Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Transaction Details */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 text-lg mb-3">
                {t("receiptModal.transactionDetails")}
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-sm text-blue-700 font-medium">
                    {t("receiptModal.dateTime")}:
                  </span>
                  <p className="text-blue-900">
                    {formatDate(commission.paymentDate || commission.createdAt)}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-blue-700 font-medium">
                    {t("receiptModal.paymentReference")}:
                  </span>
                  <p className="text-blue-900 font-mono">{reference}</p>
                </div>
                <div>
                  <span className="text-sm text-blue-700 font-medium">
                    {t("common.status")}:
                  </span>
                  <p className="text-green-600 font-semibold">
                    {commission.paymentStatus}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-blue-700 font-medium">
                    {t("receiptModal.transactionType")}:
                  </span>
                  <p className="text-blue-900">
                    {t("receiptModal.brokerCommission")}
                  </p>
                </div>
              </div>
            </div>

            {/* Property Information */}
            <div>
              <h4 className="font-semibold text-gray-900 text-lg mb-3 border-b pb-2">
                {t("receiptModal.propertyInformation")}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-600">
                    {t("properties.form.title")}:
                  </span>
                  <p className="font-medium text-gray-900">{propertyTitle}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">
                    {t("properties.type")}:
                  </span>
                  <p className="font-medium text-gray-900">{propertyType}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">
                    {t("receiptModal.transactionPurpose")}:
                  </span>
                  <p className="font-medium text-gray-900 capitalize">
                    {propertyPurpose}
                  </p>
                </div>
                {propertyPrice > 0 && (
                  <div>
                    <span className="text-sm text-gray-600">
                      {t("properties.price")}:
                    </span>
                    <p className="font-medium text-gray-900">
                      {formatPrice(propertyPrice)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Client Information */}
            <div>
              <h4 className="font-semibold text-gray-900 text-lg mb-3 border-b pb-2">
                {t("receiptModal.clientInformation")}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-600">
                    {t("receiptModal.clientName")}:
                  </span>
                  <p className="font-medium text-gray-900">{clientName}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">
                    {t("receiptModal.clientRole")}:
                  </span>
                  <p className="font-medium text-gray-900 capitalize">
                    {commission.metadata?.role === "buyer_renter"
                      ? t("receiptModal.buyerRenter")
                      : commission.metadata?.role === "property_owner"
                      ? t("receiptModal.propertyOwner")
                      : commission.metadata?.role || t("receiptModal.client")}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">
                    {t("receiptModal.clientEmail")}:
                  </span>
                  <p className="font-medium text-gray-900">{clientEmail}</p>
                </div>
                {clientPhone !== "N/A" && (
                  <div>
                    <span className="text-sm text-gray-600">
                      {t("receiptModal.clientPhone")}:
                    </span>
                    <p className="font-medium text-gray-900">{clientPhone}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Commission Breakdown */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 text-lg mb-3">
                {t("receiptModal.commissionBreakdown")}
              </h4>
              <div className="space-y-2">
                {commission.buyerCommission > 0 && (
                  <div className="flex justify-between">
                    <span className="text-green-700">
                      {t("receiptModal.buyerCommission")}:
                    </span>
                    <span className="font-medium text-green-900">
                      {formatPrice(commission.buyerCommission)}
                    </span>
                  </div>
                )}
                {commission.sellerCommission > 0 && (
                  <div className="flex justify-between">
                    <span className="text-green-700">
                      {t("receiptModal.sellerCommission")}:
                    </span>
                    <span className="font-medium text-green-900">
                      {formatPrice(commission.sellerCommission)}
                    </span>
                  </div>
                )}
                {commission.commissionAmount > 0 &&
                  !commission.buyerCommission &&
                  !commission.sellerCommission && (
                    <div className="flex justify-between">
                      <span className="text-green-700">
                        {t("receiptModal.commissionAmount")}:
                      </span>
                      <span className="font-medium text-green-900">
                        {formatPrice(commission.commissionAmount)}
                      </span>
                    </div>
                  )}
                <div className="border-t border-green-300 pt-2 mt-2 flex justify-between text-lg font-bold">
                  <span className="text-green-900">
                    {t("receiptModal.totalCommissionEarned")}:
                  </span>
                  <span className="text-green-700">
                    {formatPrice(commission.amount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Broker Information */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="font-semibold text-purple-900 text-lg mb-3">
                {t("receiptModal.brokerInformation")}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-purple-700">
                    {t("receiptModal.brokerName")}:
                  </span>
                  <p className="font-medium text-purple-900">
                    {commission.broker?.fname ||
                      commission.assignedBroker?.fname ||
                      t("common.you")}{" "}
                    {commission.broker?.lname ||
                      commission.assignedBroker?.lname ||
                      ""}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-purple-700">
                    {t("receiptModal.assignmentType")}:
                  </span>
                  <p className="font-medium text-purple-900 capitalize">
                    {commission.metadata?.assignmentType === "admin_assigned"
                      ? t("receiptModal.adminAssigned")
                      : t("receiptModal.regularAssignment")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between items-center p-6 border-t bg-gray-50">
          <div className="text-sm text-gray-600">
            {t("receiptModal.automatedReceipt")}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition-colors"
            >
              {t("common.close")}
            </button>
            <button
              onClick={handlePrint}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors flex items-center space-x-2"
            >
              <span>🖨️</span>
              <span>{t("receiptModal.printReceipt")}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptModal;