import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const TermsAndConditions = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-700 px-6 py-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">{t("terms.title")}</h1>
              <p className="text-blue-100 mt-2">
                {t("terms.lastUpdated")}: {new Date().toLocaleDateString()}
              </p>
            </div>
            <Link
              to="/register"
              className="bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition duration-200"
            >
              ← {t("terms.backToRegister")}
            </Link>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-8">
          <div className="prose max-w-none">
            {/* Introduction */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                1. {t("terms.introduction.title")}
              </h2>
              <p className="text-gray-700 mb-4">
                {t("terms.introduction.content")}
              </p>
            </section>

            {/* Account Registration */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                2. {t("terms.accountRegistration.title")}
              </h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  <strong>
                    2.1 {t("terms.accountRegistration.eligibility")}:
                  </strong>{" "}
                  {t("terms.accountRegistration.eligibilityContent")}
                </p>
                <p>
                  <strong>
                    2.2 {t("terms.accountRegistration.accurateInfo")}:
                  </strong>{" "}
                  {t("terms.accountRegistration.accurateInfoContent")}
                </p>
                <p>
                  <strong>
                    2.3 {t("terms.accountRegistration.accountSecurity")}:
                  </strong>{" "}
                  {t("terms.accountRegistration.accountSecurityContent")}
                </p>
                <p>
                  <strong>
                    2.4 {t("terms.accountRegistration.verification")}:
                  </strong>{" "}
                  {t("terms.accountRegistration.verificationContent")}
                </p>
              </div>
            </section>

            {/* User Responsibilities */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                3. {t("terms.userResponsibilities.title")}
              </h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  <strong>
                    3.1 {t("terms.userResponsibilities.propertyListings")}:
                  </strong>{" "}
                  {t("terms.userResponsibilities.propertyListingsContent")}
                </p>
                <p>
                  <strong>
                    3.2 {t("terms.userResponsibilities.legalCompliance")}:
                  </strong>{" "}
                  {t("terms.userResponsibilities.legalComplianceContent")}
                </p>
                <p>
                  <strong>
                    3.3 {t("terms.userResponsibilities.prohibitedActivities")}:
                  </strong>{" "}
                  {t("terms.userResponsibilities.prohibitedActivitiesContent")}
                </p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>{t("terms.userResponsibilities.prohibited1")}</li>
                  <li>{t("terms.userResponsibilities.prohibited2")}</li>
                  <li>{t("terms.userResponsibilities.prohibited3")}</li>
                  <li>{t("terms.userResponsibilities.prohibited4")}</li>
                  <li>{t("terms.userResponsibilities.prohibited5")}</li>
                </ul>
              </div>
            </section>

            {/* Property Transactions */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                4. {t("terms.propertyTransactions.title")}
              </h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  <strong>
                    4.1 {t("terms.propertyTransactions.brokerServices")}:
                  </strong>{" "}
                  {t("terms.propertyTransactions.brokerServicesContent")}
                </p>
                <p>
                  <strong>
                    4.2 {t("terms.propertyTransactions.dueDiligence")}:
                  </strong>{" "}
                  {t("terms.propertyTransactions.dueDiligenceContent")}
                </p>
                <p>
                  <strong>
                    4.3 {t("terms.propertyTransactions.paymentProcessing")}:
                  </strong>{" "}
                  {t("terms.propertyTransactions.paymentProcessingContent")}
                </p>
              </div>
            </section>

            {/* Fees and Payments */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                5. {t("terms.feesAndPayments.title")}
              </h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  <strong>5.1 {t("terms.feesAndPayments.serviceFees")}:</strong>{" "}
                  {t("terms.feesAndPayments.serviceFeesContent")}
                </p>
                <p>
                  <strong>5.2 {t("terms.feesAndPayments.commission")}:</strong>{" "}
                  {t("terms.feesAndPayments.commissionContent")}
                </p>
                <p>
                  <strong>
                    5.3 {t("terms.feesAndPayments.paymentMethods")}:
                  </strong>{" "}
                  {t("terms.feesAndPayments.paymentMethodsContent")}
                </p>
              </div>
            </section>

            {/* Privacy and Data */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                6. {t("terms.privacyAndData.title")}
              </h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  {t("terms.privacyAndData.content1")}{" "}
                  <Link
                    to="/privacy"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {t("terms.privacyAndData.privacyPolicy")}
                  </Link>{" "}
                  {t("terms.privacyAndData.content2")}
                </p>
                <p>{t("terms.privacyAndData.content3")}</p>
              </div>
            </section>

            {/* Intellectual Property */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                7. {t("terms.intellectualProperty.title")}
              </h2>
              <div className="space-y-3 text-gray-700">
                <p>{t("terms.intellectualProperty.content")}</p>
              </div>
            </section>

            {/* Limitation of Liability */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                8. {t("terms.limitationOfLiability.title")}
              </h2>
              <div className="space-y-3 text-gray-700">
                <p>{t("terms.limitationOfLiability.content")}</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>{t("terms.limitationOfLiability.liability1")}</li>
                  <li>{t("terms.limitationOfLiability.liability2")}</li>
                  <li>{t("terms.limitationOfLiability.liability3")}</li>
                  <li>{t("terms.limitationOfLiability.liability4")}</li>
                </ul>
              </div>
            </section>

            {/* Termination */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                9. {t("terms.termination.title")}
              </h2>
              <div className="space-y-3 text-gray-700">
                <p>{t("terms.termination.content")}</p>
              </div>
            </section>

            {/* Changes to Terms */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                10. {t("terms.changesToTerms.title")}
              </h2>
              <div className="space-y-3 text-gray-700">
                <p>{t("terms.changesToTerms.content")}</p>
              </div>
            </section>

            {/* Governing Law */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                11. {t("terms.governingLaw.title")}
              </h2>
              <div className="space-y-3 text-gray-700">
                <p>{t("terms.governingLaw.content")}</p>
              </div>
            </section>

            {/* Contact Information */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                12. {t("terms.contactInformation.title")}
              </h2>
              <div className="space-y-3 text-gray-700">
                <p>{t("terms.contactInformation.content")}</p>
                <ul className="list-none space-y-2">
                  <li>
                    📧 {t("terms.contactInformation.email")}:
                    legal@ethiobroker.com
                  </li>
                  <li>
                    📞 {t("terms.contactInformation.phone")}: +251-11-123-4567
                  </li>
                  <li>
                    📍 {t("terms.contactInformation.address")}: Addis Ababa,
                    Ethiopia
                  </li>
                </ul>
              </div>
            </section>

            {/* Acceptance */}
            <section className="bg-blue-50 p-6 rounded-lg border border-blue-200">
              <h3 className="text-xl font-semibold text-blue-900 mb-3">
                {t("terms.acceptance.title")}
              </h3>
              <p className="text-blue-800">{t("terms.acceptance.content")}</p>
            </section>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-100 px-6 py-4 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <p className="text-gray-600 text-sm">
              © {new Date().getFullYear()} ETHIO Broker.{" "}
              {t("terms.allRightsReserved")}
            </p>
            <Link
              to="/register"
              className="mt-2 sm:mt-0 bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition duration-200"
            >
              {t("terms.understandAndReturn")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;
