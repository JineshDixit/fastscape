"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateMultipleInvoicesPDF = exports.generateInvoicePDF = void 0;
const pdfkit_1 = __importDefault(require("pdfkit"));
const models_1 = require("../../models");
const logger_1 = __importDefault(require("../../config/logger"));
const formatCurrency = (amount, currency = 'AED') => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
    }).format(numAmount);
};
const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};
const generateInvoicePDF = (bookingId) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.info('Generating invoice PDF', { bookingId });
    try {
        // Fetch all required data
        const financial = yield models_1.BookingFinancial.findOne({
            where: { bookingId },
            include: [
                {
                    model: models_1.Booking,
                    include: [
                        {
                            model: models_1.User,
                            attributes: ['id', 'firstName', 'lastName', 'email', 'phone'],
                        },
                        {
                            model: models_1.Vehicle,
                            attributes: ['id', 'make', 'model', 'year', 'bodyType'],
                        },
                    ],
                },
            ],
        });
        if (!financial) {
            throw new Error('Financial record not found');
        }
        const booking = financial.Booking;
        const user = booking === null || booking === void 0 ? void 0 : booking.User;
        const vehicle = booking === null || booking === void 0 ? void 0 : booking.Vehicle;
        // Get payments
        const payments = yield models_1.Payment.findAll({
            where: { bookingId },
            order: [['createdAt', 'DESC']],
        });
        // Create PDF document with smaller margins for single page
        const doc = new pdfkit_1.default({
            size: 'A4',
            margins: { top: 30, bottom: 30, left: 40, right: 40 },
        });
        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        // Header
        doc.fontSize(24).fillColor('#2563eb').text('FASTSCAPE', { align: 'left' });
        doc.fontSize(10).fillColor('#666666').text('Premium Car Rental Services', { align: 'left' });
        doc.moveDown(0.3);
        // Invoice info on the right
        doc.fontSize(18).fillColor('#333333').text('INVOICE', 450, 30, { align: 'right' });
        doc.fontSize(9).fillColor('#666666');
        doc.text(`Invoice #: ${bookingId.slice(0, 8).toUpperCase()}`, 450, 55, { align: 'right' });
        doc.text(`Date: ${formatDate(financial.createdAt)}`, 450, 68, { align: 'right' });
        doc.text(`Status: ${booking === null || booking === void 0 ? void 0 : booking.paymentStatus}`, 450, 81, { align: 'right' });
        doc.moveDown(1);
        // Horizontal line
        doc.strokeColor('#2563eb').lineWidth(2).moveTo(40, 110).lineTo(555, 110).stroke();
        doc.moveDown(0.5);
        // Bill To and Rental Details - Side by side
        const leftColumn = 40;
        const rightColumn = 300;
        let yPos = 125;
        // Bill To
        doc.fontSize(10).fillColor('#2563eb').text('BILL TO', leftColumn, yPos);
        doc.fontSize(9).fillColor('#333333');
        doc.text(`${user === null || user === void 0 ? void 0 : user.firstName} ${user === null || user === void 0 ? void 0 : user.lastName}`, leftColumn, yPos + 15);
        doc.text((user === null || user === void 0 ? void 0 : user.email) || '', leftColumn, yPos + 28);
        if (user === null || user === void 0 ? void 0 : user.phone) {
            doc.text(user.phone, leftColumn, yPos + 41);
        }
        // Rental Details
        doc.fontSize(10).fillColor('#2563eb').text('RENTAL DETAILS', rightColumn, yPos);
        doc.fontSize(9).fillColor('#333333');
        doc.text(`${vehicle === null || vehicle === void 0 ? void 0 : vehicle.make} ${vehicle === null || vehicle === void 0 ? void 0 : vehicle.model} ${vehicle === null || vehicle === void 0 ? void 0 : vehicle.year}`, rightColumn, yPos + 15);
        doc.text(`Type: ${vehicle === null || vehicle === void 0 ? void 0 : vehicle.bodyType}`, rightColumn, yPos + 28);
        doc.text(`Pickup: ${formatDate(booking === null || booking === void 0 ? void 0 : booking.startDatetime)}`, rightColumn, yPos + 41);
        doc.text(`Return: ${formatDate(booking === null || booking === void 0 ? void 0 : booking.endDatetime)}`, rightColumn, yPos + 54);
        yPos += 85;
        // Items table
        doc.fontSize(10).fillColor('#2563eb').text('DESCRIPTION', leftColumn, yPos);
        doc.text('AMOUNT', 480, yPos, { align: 'right' });
        yPos += 15;
        doc.strokeColor('#e5e7eb').lineWidth(1).moveTo(40, yPos).lineTo(555, yPos).stroke();
        yPos += 10;
        // Line items
        doc.fontSize(9).fillColor('#333333');
        // Base Amount
        doc.text('Base Rental Amount', leftColumn, yPos);
        doc.text(formatCurrency(financial.baseAmount, financial.currency), 480, yPos, { align: 'right', width: 75 });
        yPos += 15;
        // Chauffeur
        if (financial.chauffeurAmount > 0) {
            doc.text(`Chauffeur Service (${financial.chauffeurHours}h)`, leftColumn, yPos);
            doc.text(formatCurrency(financial.chauffeurAmount, financial.currency), 480, yPos, { align: 'right', width: 75 });
            yPos += 15;
        }
        // Tax
        if (financial.taxAmount > 0) {
            doc.text('Tax', leftColumn, yPos);
            doc.text(formatCurrency(financial.taxAmount, financial.currency), 480, yPos, { align: 'right', width: 75 });
            yPos += 15;
        }
        // Platform Charge
        if (financial.platformChargeAmount > 0) {
            doc.text(`Platform Charge (${financial.platformChargeRate}%)`, leftColumn, yPos);
            doc.text(formatCurrency(financial.platformChargeAmount, financial.currency), 480, yPos, {
                align: 'right',
                width: 75,
            });
            yPos += 15;
        }
        // Delay Charge
        if (financial.delayChargeAmount > 0) {
            doc.fillColor('#dc2626').text('Delay Charge', leftColumn, yPos);
            doc.text(formatCurrency(financial.delayChargeAmount, financial.currency), 480, yPos, {
                align: 'right',
                width: 75,
            });
            doc.fillColor('#333333');
            yPos += 15;
        }
        yPos += 5;
        doc.strokeColor('#e5e7eb').lineWidth(1).moveTo(40, yPos).lineTo(555, yPos).stroke();
        yPos += 10;
        // Totals
        doc.fontSize(9);
        doc.text('Subtotal:', 400, yPos);
        doc.text(formatCurrency(financial.totalAmount, financial.currency), 480, yPos, { align: 'right' });
        yPos += 15;
        doc.text(`Deposit (${financial.depositPercentage}%):`, 400, yPos);
        doc.text(formatCurrency(financial.depositAmount, financial.currency), 480, yPos, { align: 'right' });
        yPos += 15;
        doc.text('Balance Due:', 400, yPos);
        doc.text(formatCurrency(financial.balanceAmount, financial.currency), 480, yPos, { align: 'right' });
        yPos += 15;
        yPos += 5;
        doc.strokeColor('#2563eb').lineWidth(2).moveTo(380, yPos).lineTo(555, yPos).stroke();
        yPos += 10;
        doc.fontSize(11).fillColor('#2563eb');
        doc.text('Total Amount:', 400, yPos);
        doc.text(formatCurrency(financial.totalAmount, financial.currency), 480, yPos, { align: 'right' });
        yPos += 30;
        // Payment Summary Box
        doc.rect(40, yPos, 515, 60).fillAndStroke('#f0f9ff', '#2563eb');
        yPos += 15;
        doc.fontSize(10).fillColor('#2563eb').text('PAYMENT SUMMARY', 50, yPos);
        yPos += 18;
        doc.fontSize(9).fillColor('#059669');
        doc.text('Amount Paid:', 50, yPos);
        doc.text(formatCurrency(financial.paidAmount, financial.currency), 480, yPos, { align: 'right' });
        yPos += 15;
        doc.fillColor('#dc2626');
        doc.text('Amount Remaining:', 50, yPos);
        doc.text(formatCurrency(financial.remainingAmount, financial.currency), 480, yPos, { align: 'right' });
        // Footer
        yPos = 750; // Fixed position near bottom
        doc.fontSize(8).fillColor('#666666');
        doc.text('Thank you for choosing Fastscape!', 40, yPos, { align: 'center', width: 515 });
        doc.text('For any queries, please contact us at info@fastscape.com', 40, yPos + 12, {
            align: 'center',
            width: 515,
        });
        doc.end();
        return new Promise((resolve, reject) => {
            doc.on('end', () => {
                const pdfBuffer = Buffer.concat(buffers);
                logger_1.default.info('Invoice PDF generated successfully', { bookingId, size: pdfBuffer.length });
                resolve(pdfBuffer);
            });
            doc.on('error', reject);
        });
    }
    catch (error) {
        logger_1.default.error('Failed to generate invoice PDF', { bookingId, error });
        throw error;
    }
});
exports.generateInvoicePDF = generateInvoicePDF;
const generateMultipleInvoicesPDF = (bookingIds) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.info('Generating multiple invoices PDF', { count: bookingIds.length });
    try {
        // Create PDF document
        const doc = new pdfkit_1.default({
            size: 'A4',
            margins: { top: 30, bottom: 30, left: 40, right: 40 },
        });
        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        for (let i = 0; i < bookingIds.length; i++) {
            const bookingId = bookingIds[i];
            // Fetch data for this invoice
            const financial = yield models_1.BookingFinancial.findOne({
                where: { bookingId },
                include: [
                    {
                        model: models_1.Booking,
                        include: [
                            {
                                model: models_1.User,
                                attributes: ['id', 'firstName', 'lastName', 'email', 'phone'],
                            },
                            {
                                model: models_1.Vehicle,
                                attributes: ['id', 'make', 'model', 'year', 'bodyType'],
                            },
                        ],
                    },
                ],
            });
            if (!financial) {
                logger_1.default.warn('Financial record not found, skipping', { bookingId });
                continue;
            }
            const booking = financial.Booking;
            const user = booking === null || booking === void 0 ? void 0 : booking.User;
            const vehicle = booking === null || booking === void 0 ? void 0 : booking.Vehicle;
            // Add new page for each invoice except the first
            if (i > 0) {
                doc.addPage();
            }
            // Generate invoice content (same as single invoice)
            let yPos = 30;
            // Header
            doc.fontSize(24).fillColor('#2563eb').text('FASTSCAPE', 40, yPos);
            doc
                .fontSize(10)
                .fillColor('#666666')
                .text('Premium Car Rental Services', 40, yPos + 28);
            // Invoice info
            doc.fontSize(18).fillColor('#333333').text('INVOICE', 450, yPos, { align: 'right' });
            doc.fontSize(9).fillColor('#666666');
            doc.text(`Invoice #: ${bookingId.slice(0, 8).toUpperCase()}`, 450, yPos + 25, { align: 'right' });
            doc.text(`Date: ${formatDate(financial.createdAt)}`, 450, yPos + 38, { align: 'right' });
            doc.text(`Status: ${booking === null || booking === void 0 ? void 0 : booking.paymentStatus}`, 450, yPos + 51, { align: 'right' });
            yPos = 110;
            doc.strokeColor('#2563eb').lineWidth(2).moveTo(40, yPos).lineTo(555, yPos).stroke();
            yPos = 125;
            // Bill To and Rental Details
            doc.fontSize(10).fillColor('#2563eb').text('BILL TO', 40, yPos);
            doc.fontSize(9).fillColor('#333333');
            doc.text(`${user === null || user === void 0 ? void 0 : user.firstName} ${user === null || user === void 0 ? void 0 : user.lastName}`, 40, yPos + 15);
            doc.text((user === null || user === void 0 ? void 0 : user.email) || '', 40, yPos + 28);
            if (user === null || user === void 0 ? void 0 : user.phone) {
                doc.text(user.phone, 40, yPos + 41);
            }
            doc.fontSize(10).fillColor('#2563eb').text('RENTAL DETAILS', 300, yPos);
            doc.fontSize(9).fillColor('#333333');
            doc.text(`${vehicle === null || vehicle === void 0 ? void 0 : vehicle.make} ${vehicle === null || vehicle === void 0 ? void 0 : vehicle.model} ${vehicle === null || vehicle === void 0 ? void 0 : vehicle.year}`, 300, yPos + 15);
            doc.text(`Type: ${vehicle === null || vehicle === void 0 ? void 0 : vehicle.bodyType}`, 300, yPos + 28);
            doc.text(`Pickup: ${formatDate(booking === null || booking === void 0 ? void 0 : booking.startDatetime)}`, 300, yPos + 41);
            doc.text(`Return: ${formatDate(booking === null || booking === void 0 ? void 0 : booking.endDatetime)}`, 300, yPos + 54);
            yPos = 210;
            // Items table header
            doc.fontSize(10).fillColor('#2563eb').text('DESCRIPTION', 40, yPos);
            doc.text('AMOUNT', 480, yPos, { align: 'right' });
            yPos += 15;
            doc.strokeColor('#e5e7eb').lineWidth(1).moveTo(40, yPos).lineTo(555, yPos).stroke();
            yPos += 10;
            // Line items
            doc.fontSize(9).fillColor('#333333');
            doc.text('Base Rental Amount', 40, yPos);
            doc.text(formatCurrency(financial.baseAmount, financial.currency), 480, yPos, { align: 'right', width: 75 });
            yPos += 15;
            if (financial.chauffeurAmount > 0) {
                doc.text(`Chauffeur Service (${financial.chauffeurHours}h)`, 40, yPos);
                doc.text(formatCurrency(financial.chauffeurAmount, financial.currency), 480, yPos, {
                    align: 'right',
                    width: 75,
                });
                yPos += 15;
            }
            if (financial.taxAmount > 0) {
                doc.text('Tax', 40, yPos);
                doc.text(formatCurrency(financial.taxAmount, financial.currency), 480, yPos, { align: 'right', width: 75 });
                yPos += 15;
            }
            if (financial.platformChargeAmount > 0) {
                doc.text(`Platform Charge (${financial.platformChargeRate}%)`, 40, yPos);
                doc.text(formatCurrency(financial.platformChargeAmount, financial.currency), 480, yPos, {
                    align: 'right',
                    width: 75,
                });
                yPos += 15;
            }
            if (financial.delayChargeAmount > 0) {
                doc.fillColor('#dc2626').text('Delay Charge', 40, yPos);
                doc.text(formatCurrency(financial.delayChargeAmount, financial.currency), 480, yPos, {
                    align: 'right',
                    width: 75,
                });
                doc.fillColor('#333333');
                yPos += 15;
            }
            yPos += 5;
            doc.strokeColor('#e5e7eb').lineWidth(1).moveTo(40, yPos).lineTo(555, yPos).stroke();
            yPos += 10;
            // Totals
            doc.text('Subtotal:', 400, yPos);
            doc.text(formatCurrency(financial.totalAmount, financial.currency), 480, yPos, { align: 'right' });
            yPos += 15;
            doc.text(`Deposit (${financial.depositPercentage}%):`, 400, yPos);
            doc.text(formatCurrency(financial.depositAmount, financial.currency), 480, yPos, { align: 'right' });
            yPos += 15;
            doc.text('Balance Due:', 400, yPos);
            doc.text(formatCurrency(financial.balanceAmount, financial.currency), 480, yPos, { align: 'right' });
            yPos += 15;
            yPos += 5;
            doc.strokeColor('#2563eb').lineWidth(2).moveTo(380, yPos).lineTo(555, yPos).stroke();
            yPos += 10;
            doc.fontSize(11).fillColor('#2563eb');
            doc.text('Total Amount:', 400, yPos);
            doc.text(formatCurrency(financial.totalAmount, financial.currency), 480, yPos, { align: 'right' });
            yPos += 30;
            // Payment Summary
            doc.rect(40, yPos, 515, 60).fillAndStroke('#f0f9ff', '#2563eb');
            yPos += 15;
            doc.fontSize(10).fillColor('#2563eb').text('PAYMENT SUMMARY', 50, yPos);
            yPos += 18;
            doc.fontSize(9).fillColor('#059669');
            doc.text('Amount Paid:', 50, yPos);
            doc.text(formatCurrency(financial.paidAmount, financial.currency), 480, yPos, { align: 'right' });
            yPos += 15;
            doc.fillColor('#dc2626');
            doc.text('Amount Remaining:', 50, yPos);
            doc.text(formatCurrency(financial.remainingAmount, financial.currency), 480, yPos, { align: 'right' });
            // Footer
            doc.fontSize(8).fillColor('#666666');
            doc.text('Thank you for choosing Fastscape!', 40, 750, { align: 'center', width: 515 });
            doc.text('For any queries, please contact us at info@fastscape.com', 40, 762, {
                align: 'center',
                width: 515,
            });
        }
        doc.end();
        return new Promise((resolve, reject) => {
            doc.on('end', () => {
                const pdfBuffer = Buffer.concat(buffers);
                logger_1.default.info('Multiple invoices PDF generated successfully', {
                    count: bookingIds.length,
                    size: pdfBuffer.length,
                });
                resolve(pdfBuffer);
            });
            doc.on('error', reject);
        });
    }
    catch (error) {
        logger_1.default.error('Failed to generate multiple invoices PDF', { error });
        throw error;
    }
});
exports.generateMultipleInvoicesPDF = generateMultipleInvoicesPDF;
//# sourceMappingURL=pdfGenerator.service.js.map