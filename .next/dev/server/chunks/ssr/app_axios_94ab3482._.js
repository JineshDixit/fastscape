module.exports = [
"[project]/app/axios/services/chauffeurAssignment.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ChauffeurAssignmentService",
    ()=>ChauffeurAssignmentService,
    "chauffeurAssignmentService",
    ()=>chauffeurAssignmentService
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$axios$2f$base$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/axios/base.ts [app-ssr] (ecmascript)");
;
class ChauffeurAssignmentService extends __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$axios$2f$base$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BaseApiService"] {
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
}),
"[project]/app/axios/hooks/useChauffeurAssignment.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useChauffeurAssignment",
    ()=>useChauffeurAssignment
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$axios$2f$services$2f$chauffeurAssignment$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/axios/services/chauffeurAssignment.ts [app-ssr] (ecmascript)");
;
;
const useChauffeurAssignment = ()=>{
    const [isLoading, setIsLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const clearError = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>setError(null), []);
    const checkAssignmentStatus = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (bookingId)=>{
        setIsLoading(true);
        setError(null);
        try {
            const response = await __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$axios$2f$services$2f$chauffeurAssignment$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["chauffeurAssignmentService"].checkAssignmentStatus(bookingId);
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
    }, []);
    return {
        isLoading,
        error,
        clearError,
        checkAssignmentStatus
    };
};
}),
];

//# sourceMappingURL=app_axios_94ab3482._.js.map