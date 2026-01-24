import React from "react";
import { useTranslation } from "react-i18next";

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-gray-800 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-lg font-bold mb-4">
              {t("footer.companyName")}
            </h3>
            <p className="text-gray-300">{t("footer.companyDescription")}</p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-4">{t("footer.quickLinks")}</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="/"
                  className="text-gray-300 hover:text-white transition duration-300"
                >
                  {t("navigation.home")}
                </a>
              </li>
              <li>
                <a
                  href="/about"
                  className="text-gray-300 hover:text-white transition duration-300"
                >
                  {t("footer.about")}
                </a>
              </li>
              <li>
                <a
                  href="/contact"
                  className="text-gray-300 hover:text-white transition duration-300"
                >
                  {t("footer.contact")}
                </a>
              </li>
              <li>
                <a
                  href="/services"
                  className="text-gray-300 hover:text-white transition duration-300"
                >
                  {t("footer.services")}
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-bold mb-4">{t("footer.contactUs")}</h3>
            <div className="text-gray-300 space-y-2">
              <p>{t("footer.email")}: info@ethiobroker.com</p>
              <p>{t("footer.phone")}: +251 924328087</p>
              <p>
                {t("footer.address")}: {t("footer.location")}
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-6 text-center text-gray-300">
          <p>
            &copy; {new Date().getFullYear()} ETHIO Broker.{" "}
            {t("footer.allRightsReserved")}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
