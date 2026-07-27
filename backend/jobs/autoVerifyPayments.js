// Automatic payment verification job
// This runs periodically to verify pending payments with Chapa
const Payment = require("../models/paymentModel");
const { updatePropertyStatusAfterPayment } = require("../utils/propertyStatusUpdater");
const axios = require("axios");

// Flag to prevent concurrent executions
let isAutoVerifyRunning = false;

/**
 * Automatically verify pending payments with Chapa
 * This function is called by the cron job
 */
const autoVerifyPendingPayments = async () => {
    // Prevent concurrent executions
    if (isAutoVerifyRunning) {
        console.log("⏳ [AUTO-VERIFY] Previous verification still running, skipping...");
        return { success: true, skipped: true };
    }

    isAutoVerifyRunning = true;

    try {
        console.log("\n🔄 [AUTO-VERIFY] Starting automatic payment verification...");

        // Find all pending payments that are less than 24 hours old
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const pendingPayments = await Payment.find({
            paymentStatus: "Pending",
            paymentType: "full_payment",
            createdAt: { $gte: oneDayAgo } // Only check recent payments
        })
            .populate("property")
            .populate("user", "fname lname email")
            .limit(10); // Limit to 10 payments per run to prevent overload

        if (pendingPayments.length === 0) {
            console.log("✅ [AUTO-VERIFY] No pending payments to verify");
            return {
                success: true,
                verified: 0,
                total: 0
            };
        }

        console.log(`📊 [AUTO-VERIFY] Found ${pendingPayments.length} pending payment(s) to verify`);

        let verified = 0;
        let failed = 0;

        // Process payments with concurrency limit to prevent blocking
        const concurrencyLimit = 3; // Process max 3 payments simultaneously
        const chunks = [];
        for (let i = 0; i < pendingPayments.length; i += concurrencyLimit) {
            chunks.push(pendingPayments.slice(i, i + concurrencyLimit));
        }

        for (const chunk of chunks) {
            const promises = chunk.map(async (payment) => {
                try {
                    // Skip if no Chapa reference
                    if (!payment.chapaReference) {
                        console.log(`⚠️ [AUTO-VERIFY] Payment ${payment._id} has no Chapa reference, skipping`);
                        return { status: 'skipped' };
                    }

                    // Skip if no Chapa API key
                    if (!process.env.CHAPA_SECRET_KEY) {
                        console.log(`⚠️ [AUTO-VERIFY] No Chapa API key configured, skipping verification`);
                        return { status: 'no_api_key' };
                    }

                    console.log(`🔍 [AUTO-VERIFY] Verifying payment ${payment._id} (${payment.chapaReference})`);

                    // Verify with Chapa with shorter timeout
                    const chapaResponse = await axios.get(
                        `https://api.chapa.co/v1/transaction/verify/${payment.chapaReference}`,
                        {
                            headers: {
                                Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`
                            },
                            timeout: 5000 // Reduced to 5 second timeout
                        }
                    );

                    // Check if payment was successful
                    if (
                        chapaResponse.data.status === "success" &&
                        chapaResponse.data.data.status === "success"
                    ) {
                        console.log(`✅ [AUTO-VERIFY] Payment ${payment._id} verified as COMPLETED`);

                        // Update payment status
                        payment.paymentStatus = "Completed";
                        payment.paymentDate = new Date();
                        payment.chapaTransactionId = chapaResponse.data.data.id;
                        await payment.save();

                        // Update property status (non-blocking)
                        setImmediate(async () => {
                            try {
                                const updateResult = await updatePropertyStatusAfterPayment(payment._id, {
                                    forceUpdate: true,
                                    skipNotifications: false
                                });

                                if (updateResult.success) {
                                    console.log(`✅ [AUTO-VERIFY] Property status updated for payment ${payment._id}`);
                                } else {
                                    console.log(`⚠️ [AUTO-VERIFY] Property status update failed for payment ${payment._id}`);
                                }
                            } catch (updateError) {
                                console.error(`❌ [AUTO-VERIFY] Error updating property status:`, updateError.message);
                            }
                        });

                        return { status: 'verified' };

                    } else {
                        console.log(`⏳ [AUTO-VERIFY] Payment ${payment._id} still pending in Chapa`);
                        return { status: 'pending' };
                    }

                } catch (error) {
                    if (error.response?.status === 404) {
                        console.log(`⚠️ [AUTO-VERIFY] Payment ${payment._id} not found in Chapa`);
                    } else if (error.code === 'ECONNABORTED') {
                        console.log(`⚠️ [AUTO-VERIFY] Timeout verifying payment ${payment._id}`);
                    } else {
                        console.error(`❌ [AUTO-VERIFY] Error verifying payment ${payment._id}:`, error.message);
                    }
                    return { status: 'failed' };
                }
            });

            // Wait for current chunk to complete before processing next
            const results = await Promise.allSettled(promises);
            
            results.forEach(result => {
                if (result.status === 'fulfilled') {
                    if (result.value.status === 'verified') verified++;
                    else if (result.value.status === 'failed') failed++;
                } else {
                    failed++;
                }
            });
        }

        console.log(`✅ [AUTO-VERIFY] Completed: ${verified} verified, ${failed} failed`);

        return {
            success: true,
            verified,
            failed,
            total: pendingPayments.length
        };

    } catch (error) {
        console.error("❌ [AUTO-VERIFY] Fatal error:", error);
        return {
            success: false,
            error: error.message
        };
    } finally {
        isAutoVerifyRunning = false;
    }
};

module.exports = {
    autoVerifyPendingPayments
};
