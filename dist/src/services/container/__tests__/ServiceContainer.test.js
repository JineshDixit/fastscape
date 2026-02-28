"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ServiceContainer_1 = require("../ServiceContainer");
describe('ServiceContainer', () => {
    let container;
    beforeEach(() => {
        container = new ServiceContainer_1.ServiceContainer();
    });
    describe('register and resolve', () => {
        it('should register and resolve a service instance', () => {
            const service = { name: 'TestService', getValue: () => 'test' };
            container.register('testService', service);
            const resolved = container.resolve('testService');
            expect(resolved).toBe(service);
            expect(resolved.getValue()).toBe('test');
        });
        it('should throw error when resolving non-existent service', () => {
            expect(() => container.resolve('nonExistent')).toThrow("Service 'nonExistent' not found in container");
        });
    });
    describe('registerSingleton', () => {
        it('should register and resolve singleton service', () => {
            let instanceCount = 0;
            const factory = () => {
                instanceCount++;
                return { id: instanceCount, getValue: () => `instance-${instanceCount}` };
            };
            container.registerSingleton('singletonService', factory);
            const instance1 = container.resolve('singletonService');
            const instance2 = container.resolve('singletonService');
            expect(instance1).toBe(instance2);
            expect(instance1.id).toBe(1);
            expect(instanceCount).toBe(1); // Factory should only be called once
        });
        it('should create singleton instance only when first resolved', () => {
            let factoryCalled = false;
            const factory = () => {
                factoryCalled = true;
                return { name: 'singleton' };
            };
            container.registerSingleton('lazyService', factory);
            expect(factoryCalled).toBe(false);
            container.resolve('lazyService');
            expect(factoryCalled).toBe(true);
        });
    });
    describe('has', () => {
        it('should return true for registered services', () => {
            container.register('testService', { name: 'test' });
            expect(container.has('testService')).toBe(true);
        });
        it('should return false for non-registered services', () => {
            expect(container.has('nonExistent')).toBe(false);
        });
        it('should return true for registered singleton services', () => {
            container.registerSingleton('singletonService', () => ({ name: 'singleton' }));
            expect(container.has('singletonService')).toBe(true);
        });
    });
    describe('clear', () => {
        it('should clear all registered services', () => {
            container.register('service1', { name: 'service1' });
            container.registerSingleton('service2', () => ({ name: 'service2' }));
            expect(container.has('service1')).toBe(true);
            expect(container.has('service2')).toBe(true);
            container.clear();
            expect(container.has('service1')).toBe(false);
            expect(container.has('service2')).toBe(false);
        });
        it('should clear singleton instances', () => {
            let instanceCount = 0;
            const factory = () => ({ id: ++instanceCount });
            container.registerSingleton('singletonService', factory);
            const instance1 = container.resolve('singletonService');
            container.clear();
            container.registerSingleton('singletonService', factory);
            const instance2 = container.resolve('singletonService');
            expect(instance1.id).toBe(1);
            expect(instance2.id).toBe(2); // New instance created after clear
        });
    });
    describe('getRegisteredServices', () => {
        it('should return empty array when no services registered', () => {
            expect(container.getRegisteredServices()).toEqual([]);
        });
        it('should return all registered service names', () => {
            container.register('service1', { name: 'service1' });
            container.registerSingleton('service2', () => ({ name: 'service2' }));
            const services = container.getRegisteredServices();
            expect(services).toContain('service1');
            expect(services).toContain('service2');
            expect(services).toHaveLength(2);
        });
    });
    describe('mixed registration types', () => {
        it('should handle both regular and singleton services', () => {
            const regularService = { type: 'regular' };
            container.register('regular', regularService);
            container.registerSingleton('singleton', () => ({ type: 'singleton' }));
            const resolvedRegular = container.resolve('regular');
            const resolvedSingleton = container.resolve('singleton');
            expect(resolvedRegular).toBe(regularService);
            expect(resolvedSingleton.type).toBe('singleton');
        });
    });
});
//# sourceMappingURL=ServiceContainer.test.js.map