angular.module("gc.fastRepeat", []).directive("fastRepeat", ["$compile", "$parse", "$animate", function (a, b, c) {
    "use strict";
    function d(a, b) {
        return a.slice && "$$" == a.slice(0, 2) ? void 0 : b
    }

    function e() {
        return window.performance && window.performance.now ? window.performance.now() : (new Date).getTime()
    }

    var f = angular.element, g = 0, h = !1, i = /^(\d+\.\d+)\./.exec(angular.version.full)[1] > 1.3;
    return {
        restrict: "A", transclude: "element", priority: 1e3, compile: function () {
            return function (a, j, k, l, m) {
                function n() {
                    a.$$postDigest(function () {
                        y.width(z.width()), w.$digest(), A(x, w, !0)
                    })
                }

                function o(a, b) {
                    var c = w.$new(!1);
                    c[s] = a, c.fastRepeatStatic = !1, c.fastRepeatDynamic = !0;
                    var d = m(c, function (a) {
                        y.append(a)
                    });
                    return c.$$postDigest(function () {
                        b(d)
                    }), c.$digest(), c
                }

                var p, q = k.fastRepeat.split(" in "), r = q[1], s = q[0], t = b(r), u = b(k.fastRepeatDisableOpts)(a), v = {}, w = a.$new();
                w[s] = t(w)[0] || {}, w.fastRepeatStatic = !0, w.fastRepeatDynamic = !1;
                var x = m(w, function (a) {
                    i ? c.enabled(a, !1) : c.enabled(!1, a)
                }), y = f("<div/>");
                f("body").append(y), w.$on("$destroy", function () {
                    y.remove(), x.remove()
                }), y.css({position: "absolute", top: "-100%"});
                var z = j.parents().filter(function () {
                    return "inline" !== f(this).css("display")
                }).first();
                y.width(z.width()), y.css({visibility: "hidden"}), y.append(x);
                var A = function (a, b, c) {
                    function d(c) {
                        return b[s] = c, b.$digest(), a.attr("fast-repeat-id", c.$$fastRepeatId), a.clone()
                    }

                    var e = t(b), h = {};
                    angular.forEach(e, function (a) {
                        a.$$fastRepeatId || (a.$$fastRepeatId = a.id ? a.id : a._id ? a._id : ++g), h[a.$$fastRepeatId] = a
                    }), angular.forEach(v, function (a, b) {
                        h[b] || a.el.detach()
                    });
                    var i = j;
                    angular.forEach(e, function (a) {
                        var b = a.$$fastRepeatId, e = v[b];
                        if (e) {
                            if (!e.compiled && (c || !angular.equals(e.copy, a)) || e.compiled && e.item !== a) {
                                var g = d(a);
                                e.el.replaceWith(g), e.el = g, e.copy = angular.copy(a), e.compiled = !1, e.item = a
                            }
                        } else u ? (e = {
                                copy: angular.copy(a),
                                item: a,
                                el: f("<div/>"),
                                compiled: !0
                            }, o(a, function (a) {
                                e.el.replaceWith(a), e.el = a
                            })) : e = {copy: angular.copy(a), item: a, el: d(a)}, v[b] = e;
                        i.after(e.el.last()), i = e.el.last()
                    })
                }, B = !1;
                a.$watch(function (a) {
                    return JSON.stringify(t(a), d)
                }, function (b) {
                    y.width(z.width()), B || (B = !0, h && (p = e()), a.$$postDigest(function () {
                        y.width(z.width()), w.$digest(), A(x, w), h && (p = e() - p, console.log("Total time: ", p, "ms"), console.log("time per row: ", p / b.length)), B = !1
                    }))
                }, !1), k.fastRepeatWatch && a.$watch(k.fastRepeatWatch, n, !0), a.$on("fastRepeatForceRedraw", n);
                var C = function (a) {
                    var b = f(this);
                    if (!b.parents().filter("[fast-repeat-id]").length) {
                        a.stopPropagation();
                        var c = b.attr("fast-repeat-id"), d = v[c].item, e = b.find("*").index(a.target), g = o(d, function (a) {
                            b.replaceWith(a), v[c] = {compiled: !0, el: a, item: d}, setTimeout(function () {
                                e >= 0 ? a.find("*").eq(e).trigger("click") : a.trigger("click")
                            }, 0)
                        });
                        g.$digest()
                    }
                };
                j.parent().on("click", "[fast-repeat-id]", C);
                var D = function () {
                    y.width(z.width())
                }, E = f(window);
                E.on("resize", D), w.$on("$destroy", function () {
                    E.off("resize", D), j.parent().off("click", "[fast-repeat-id]", C)
                })
            }
        }
    }
}]);
