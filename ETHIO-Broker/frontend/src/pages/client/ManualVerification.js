import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import axios from '../../api/axios';

const ManualVerification = () => {
  const { propertyId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    transactionReference: '',
    amount: '',
    paymentMethod: 'Chapa',
    transactionDate: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [verificationData, setVerificationData] = useState(null);
  const [property, setProperty] = useState(null);

  // Get URL parameters
  const txRef = searchParams.get('tx_ref');
  const amount = searchParams.get('amount');
  const paymentId = searchParams.get('payment_id');

  useEffect(() => {
    if (propertyId) {
      fetchVerificationData();
      fetchPropertyDetails();
    }

    // Pre-fill form with URL parameters if available
    if (txRef) {
      setFormData(prev => ({
        ...prev,
        transactionReference: txRef
      }));
    }
    if (amount) {
      setFormData(prev => ({
        ...prev,
        amount: amount
      }));
    }
  }, [propertyId, txRef, amount]);

  const fetchVerificationData = async () => {
    try {
      const response = await axios.get(`/api/manual-verification/verification-form/${propertyId}`);
      if (response.data.success) {
        setVerificationData(response.data.data);
        // Pre-fill expected amount if not already set
        if (!amount) {
          setFormData(prev => ({
            ...prev,
            amount: response.data.data.paymentInfo.totalAmount.toString()
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching verification data:', error);
      setError('Failed to load verification form data');
    }
  };

  const fetchPropertyDetails = async () => {
    try {
      const response = await axios.get(`/api/property/${propertyId}`);
      setProperty(response.data.property || response.data);
    } catch (error) {
      console.error('Error fetching property details:', error);
    }
  };

  const isValidTransactionReference = (reference) => {
    if (!reference || reference.length < 10) return false;
    
    // Exclude commission payment references
    if (reference.startsWith('broker-comm-')) return false;
    
    // Updated pattern to exclude commission payments but include valid property payment formats
    const chapaReferencePattern = /^(ethio_broker_|chapa_|tx_ref_|CHK_|TXN_)\w+/i;
    return chapaReferencePattern.test(reference);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear errors when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validate required fields
      if (!formData.transactionReference.trim()) {
        throw new Error('Transaction reference is required');
      }
      if (!formData.amount || parseFloat(formData.amount) <= 0) {
        throw new Error('Valid amount is required');
      }

      // Validate transaction reference format
      if (!isValidTransactionReference(formData.transactionReference.trim())) {
        if (formData.transactionReference.trim().startsWith('broker-comm-')) {
          throw new Error('Commission payment references cannot be used for property verification. Commission payments are handled automatically. Please use the main property payment transaction reference instead.');
        }
        throw new Error('Invalid transaction reference format. Please use the exact reference from your property payment success page. It should start with "ethio_broker_", "chapa_", "tx_ref_", "CHK_", or "TXN_" and be at least 10 characters long.');
      }

      console.log('🔍 Submitting manual verification:', {
        propertyId,
        ...formData
      });

      const response = await axios.post('/api/manual-verification/manual-verify-transaction', {
        propertyId,
        transactionReference: formData.transactionReference.trim(),
        amount: parseFloat(formData.amount),
        paymentMethod: formData.paymentMethod,
        transactionDate: formData.transactionDate || new Date().toISOString()
      });

      if (response.data.success) {
        setSuccess('Payment verified successfully! Redirecting to payment success page...');
        
        // Redirect to payment success page after successful verification
        setTimeout(() => {
          const successUrl = `/payment/success?property_id=${propertyId}&tx_ref=${formData.transactionReference}&amount=${formData.amount}&payment_id=${paymentId || response.data.data.payment.id}&verified=true`;
          navigate(successUrl);
        }, 2000);
      } else {
        throw new Error(response.data.message || 'Verification failed');
      }

    } catch (error) {
      console.error('❌ Manual verification error:', error);
      
      let errorMessage = 'Verification failed. ';
      if (error.response?.data?.message) {
        errorMessage += error.response.data.message;
        
        // Add helpful hints for common errors
        if (error.response.data.message.includes('Invalid transaction reference format')) {
          errorMessage += '\n\n💡 Tip: Copy the transaction reference from your Chapa payment confirmation email or SMS.';
        }
      } else if (error.message) {
        errorMessage += error.message;
      } else {
        errorMessage += 'Please check your details and try again.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyReference = () => {
    if (txRef) {
      navigator.clipboard.writeText(txRef).then(() => {
        // Show success message
        const button = document.querySelector('button:contains("📋 Copy")');
        alert('✅ Transaction reference copied to clipboard!\n\nNow paste it in the "Transaction Reference" field below.');
      }).catch(() => {
        // Fallback for older browsers
        alert(`Copy this transaction reference:\n\n${txRef}`);
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-8">
            <div className="text-center">
              <div className="text-6xl mb-4">🔐</div>
              <h1 className="text-3xl font-bold mb-2">Manual Payment Verification</h1>
              <p className="text-blue-100 text-lg">
                Verify your payment to complete the property transaction
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Property Info */}
            {property && (
              <div className="bg-blue-50 rounded-xl p-6 mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Property Details</h2>
                <div className="flex items-start space-x-4">
                  {property.images && property.images.length > 0 && (
                    <img
                      src={property.images[0]}
                      alt={property.title}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {property.title}
                    </h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-600">Type:</span>
                        <span className="ml-2 font-medium">{property.propertyType}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Purpose:</span>
                        <span className="ml-2 font-medium capitalize">{property.purpose}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Info */}
            {verificationData && (
              <div className="bg-gray-50 rounded-xl p-6 mb-8">
                <h3 className="font-semibold text-gray-900 mb-4">Expected Payment Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Property Price:</span>
                    <span className="font-medium">{verificationData.paymentInfo.baseAmount.toLocaleString()} ETB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Buyer Commission (2%):</span>
                    <span className="font-medium">{verificationData.paymentInfo.buyerCommission.toLocaleString()} ETB</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-gray-900 font-semibold">Total Amount:</span>
                    <span className="font-bold text-blue-600">{verificationData.paymentInfo.totalAmount.toLocaleString()} ETB</span>
                  </div>
                </div>
              </div>
            )}

            {/* Transaction Reference Display for Copying */}
            {txRef && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
                <h3 className="font-semibold text-blue-800 mb-3 text-lg">
                  📋 Your Transaction Reference
                </h3>
                <p className="text-blue-700 text-sm mb-4">
                  Copy the reference and paste to transaction ID to verify:
                </p>
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-lg font-semibold text-gray-900 break-all">
                      {txRef}
                    </span>
                    <button
                      onClick={handleCopyReference}
                      className="ml-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded font-medium transition-colors flex-shrink-0"
                    >
                      📋 Copy
                    </button>
                  </div>
                </div>
                <p className="text-blue-600 text-xs mt-2">
                  ✅ This reference has been automatically copied from your Chapa payment
                </p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                <div className="flex items-start">
                  <div className="text-red-500 text-xl mr-3">❌</div>
                  <div className="flex-1">
                    <p className="font-medium mb-1">Verification Failed</p>
                    <p className="text-sm whitespace-pre-line">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
                <div className="flex items-start">
                  <div className="text-green-500 text-xl mr-3">✅</div>
                  <div className="flex-1">
                    <p className="font-medium mb-1">Verification Successful</p>
                    <p className="text-sm">{success}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Verification Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="transactionReference" className="block text-sm font-medium text-gray-700 mb-2">
                  Transaction Reference * 
                  <span className="text-blue-600 text-xs ml-2">(Paste the copied reference here)</span>
                </label>
                <input
                  type="text"
                  id="transactionReference"
                  name="transactionReference"
                  value={formData.transactionReference}
                  onChange={handleInputChange}
                  placeholder="Paste your transaction reference here (e.g., ethio_broker_1234567890_abcdef)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  📋 Paste the copied reference here
                </p>
              </div>

              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                  Amount Paid (ETB) *
                </label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  placeholder="Enter the exact amount you paid"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  min="1"
                  step="0.01"
                />
              </div>

              <div>
                <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method
                </label>
                <select
                  id="paymentMethod"
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Chapa">Chapa</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Mobile Money">Mobile Money</option>
                </select>
              </div>

              <div>
                <label htmlFor="transactionDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Transaction Date (Optional)
                </label>
                <input
                  type="datetime-local"
                  id="transactionDate"
                  name="transactionDate"
                  value={formData.transactionDate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 px-6 rounded-lg font-semibold text-lg transition duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Verifying Payment...
                  </>
                ) : (
                  <>
                    🔐 Verify Payment
                  </>
                )}
              </button>
            </form>

            {/* Simple Help Section */}
            <div className="mt-8 p-6 bg-blue-50 rounded-lg text-center">
              <p className="text-blue-800 font-medium text-lg">
                Copy the reference and paste to transaction ID to verify
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManualVerification;