var utilityFn = utilityFn || {};
utilityFn.getCommonAncestor = function(b, d) {
    var a = $(b).parents(),
        c = $(d).parents(),
        e = null;
    a.each(function() {
        var a = this;
        c.each(function() {
            if (a == this) return e = this, !1
        });
        if (e) return !1
    });
    return e
};
utilityFn.getCommonRoot = function(b, d) {
    var a = utilityFn.getCommonAncestor(b, d),
        c = $(b).parents(),
        a = _.indexOf(c, a);
    return c[a - 1]
};