module.exports = [
"[project]/locale/ar.json (json, async loader)", ((__turbopack_context__) => {

__turbopack_context__.v((parentImport) => {
    return Promise.all([
  "server/chunks/ssr/locale_ar_json_fc089174._.js"
].map((chunk) => __turbopack_context__.l(chunk))).then(() => {
        return parentImport("[project]/locale/ar.json (json)");
    });
});
}),
"[project]/locale/en.json (json, async loader)", ((__turbopack_context__) => {

__turbopack_context__.v((parentImport) => {
    return Promise.all([
  "server/chunks/ssr/locale_en_json_4cf51394._.js"
].map((chunk) => __turbopack_context__.l(chunk))).then(() => {
        return parentImport("[project]/locale/en.json (json)");
    });
});
}),
];