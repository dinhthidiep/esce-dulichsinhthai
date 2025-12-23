!function () {
    "use strict";
    var t = window.wp.element, e = window.wp.htmlEntities, a = window.wp.i18n, n = window.wc.wcBlocksRegistry, i = window.wc.wcSettings;
    const l = () => {
        const t = (0, i.getSetting)("payos_data", null); if (!t) throw new Error("payOS initialization data is not available");
        return t
    };
    var o;
    const r = () => (0, e.decodeEntities)(l()?.description || "");
    const title = () => (0, e.decodeEntities)(l()?.title || "");
    (0, n.registerPaymentMethod)
        ({
            name: "payos",
            label: (0, t.createElement)('div', {},
                (0, t.createElement)(title, null),
                (0, t.createElement)("img", { src: l()?.logo_url, alt: l()?.title, style: { marginLeft: "10px", height: "1rem" } })
            ),
            ariaLabel: (0, a.__)("payOS Payment Method", "woocommerce-gateway-payos"), canMakePayment: () => !0,
            content: (0, t.createElement)('div', {},
                (0, t.createElement)(r, null)
            ),
            edit: (0, t.createElement)('div', {},
                (0, t.createElement)(r, null)
            ),
            supports: { features: null !== (o = l()?.supports) && void 0 !== o ? o : [] }
        })
}();
