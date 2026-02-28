(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/app/axios/services/chauffeurAssignment.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ChauffeurAssignmentService",
    ()=>ChauffeurAssignmentService,
    "chauffeurAssignmentService",
    ()=>chauffeurAssignmentService
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$axios$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/axios/base.ts [app-client] (ecmascript)");
;
class ChauffeurAssignmentService extends __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$axios$2f$base$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BaseApiService"] {
    constructor(){
        super('/chauffeur-assignment');
    }
    /**
   * Check chauffeur assignment status for a booking
   */ async checkAssignmentStatus(bookingId) {
        return this.get(`/${bookingId}/status`);
    }
}
const chauffeurAssignmentService = new ChauffeurAssignmentService();
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/app/axios/hooks/useChauffeurAssignment.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useChauffeurAssignment",
    ()=>useChauffeurAssignment
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$axios$2f$services$2f$chauffeurAssignment$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/axios/services/chauffeurAssignment.ts [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
;
;
const useChauffeurAssignment = ()=>{
    _s();
    const [isLoading, setIsLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const clearError = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useChauffeurAssignment.useCallback[clearError]": ()=>setError(null)
    }["useChauffeurAssignment.useCallback[clearError]"], []);
    const checkAssignmentStatus = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useChauffeurAssignment.useCallback[checkAssignmentStatus]": async (bookingId)=>{
            setIsLoading(true);
            setError(null);
            try {
                const response = await __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$axios$2f$services$2f$chauffeurAssignment$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["chauffeurAssignmentService"].checkAssignmentStatus(bookingId);
                if (response.success && response.data) {
                    return response.data;
                } else {
                    setError(response.message || 'Failed to check assignment status');
                    return null;
                }
            } catch (err) {
                const errorMessage = err?.response?.data?.message || err?.message || 'Failed to check assignment status';
                setError(errorMessage);
                return null;
            } finally{
                setIsLoading(false);
            }
        }
    }["useChauffeurAssignment.useCallback[checkAssignmentStatus]"], []);
    return {
        isLoading,
        error,
        clearError,
        checkAssignmentStatus
    };
};
_s(useChauffeurAssignment, "VLPGenyfbtLItcqrjCF8MASG2I0=");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=app_axios_1561f40c._.js.map