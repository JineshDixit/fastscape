/**
 * Payment Services Index
 * 
 * Centralized exports for all payment-related services and interfaces
 */

// Core payment gateway interfaces and types
export * from './paymentGateway.interface';

// Payment gateway implementations
export { MockPaymentGateway } from './mockPaymentGateway';

// Payment gateway factory and service
export { paymentGatewayFactory, PaymentGatewayFactoryImpl } from './paymentGatewayFactory';
export { paymentGatewayService, PaymentGatewayService } from './paymentGatewayService';

// Enhanced payment services
export * from './enhancedPayment.service';
export * from './gatewayIntegratedPayment.service';

// Legacy exports for backward compatibility
export {
    calculatePaymentBreakdown,
    processDepositPayment,
    processBalancePayment,
    applyDelayCharges,
    getPaymentSummary,
    markPaymentCompleted,
    getOverduePayments,
} from './enhancedPayment.service';