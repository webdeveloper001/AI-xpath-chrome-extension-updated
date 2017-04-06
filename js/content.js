/*
 Apache License, Version 2.0.
*/
// Warn if overriding existing method



if(Array.prototype.equals)
    console.warn("Overriding existing Array.prototype.equals. Possible causes: New API defines the method, there's a framework conflict or you've got double inclusions in your code.");
// attach the .equals method to Array's prototype to call it on any array
Array.prototype.equals = function (array) {
    // if the other array is a falsy value, return
    if (!array)
        return false;

    // compare lengths - can save a lot of time 
    if (this.length != array.length)
        return false;

    for (var i = 0, l=this.length; i < l; i++) {
        // Check if we have nested arrays
        if (this[i] instanceof Array && array[i] instanceof Array) {
            // recurse into the nested arrays
            if (!this[i].equals(array[i]))
                return false;       
        }           
        else if (this[i] != array[i]) { 
            // Warning - two different object instances will never be equal: {x:20} != {x:20}
            return false;   
        }           
    }       
    return true;
}

var xh = xh || {};
xh.SHIFT_KEYCODE = 16;
xh.X_KEYCODE = 88;
xh.idflag = false;
xh.all_queries = [];

xh.analytics = function(a) {
    chrome.runtime.sendMessage({
        type: "analytics",
        data: a
    })
};
xh.elementsShareFamily = function(a, c) {
    return a.tagName === c.tagName && (!a.className || a.className === c.className) && (!a.id || a.id === c.id)
};
xh.getElementIndex = function(a) {
    var c = 1,
        b;
    for (b = a.previousSibling; b; b = b.previousSibling) b.nodeType === Node.ELEMENT_NODE && xh.elementsShareFamily(a, b) && c++;
    if (1 < c) return c;
    for (b = a.nextSibling; b; b = b.nextSibling)
        if (b.nodeType === Node.ELEMENT_NODE && xh.elementsShareFamily(a, b)) return 1;
    return 0
};
xh.isUnique = function(a) {
    a = document.evaluate(a, document, null, XPathResult.ANY_TYPE, null);
    for (var c = 0, b = a.iterateNext(); b;) c += 1, b = a.iterateNext();
    return 1 === c
};
xh.getTopTwo = function(a) {
    a = document.evaluate(a, document, null, XPathResult.ANY_TYPE, null);
    var c, b;
    (c = a.iterateNext()) && (b = a.iterateNext());
    return b ? [c, b] : !1
};
xh.lastElemProcess = function(xp) {
    var t;
    if(xp[xp.lastIndexOf('/') + 1] == 'a'){
        if(xh.all_queries.indexOf(xp + '/@href') == -1)
            xh.all_queries.push(xp + '/@href');
    } else if(xp.indexOf("@src") == -1 && xp.indexOf('/img') == -1) {
        if(xh.all_queries.indexOf(xp + '/text()') == -1)
            xh.all_queries.push(xp + '/text()');
    } else if(xp.indexOf('@src') == -1) {
        if(xh.evaluateQuery(xp + '/@src')[0] != "[NULL]") {
            if(xh.all_queries.indexOf(xp + '/@src') == -1)
                xh.all_queries.push(xp + '/@src');
        } else {
            if(xh.all_queries.indexOf(xp + '/@srcset') == -1)
                xh.all_queries.push(xp + '/@srcset');
        }
    }
    var re = /tr\[\d+\]\/td/, c;
    // if(xp.match(re) != -1)
    //     xp.replace(re, )
    if(xp.match(re) != null) {
        t = xp;
        c = t.slice(xp.match(re));
        t = document.evaluate(t, document, null, XPathResult.ANY_TYPE, null)
        if (t.resultType === XPathResult.UNORDERED_NODE_ITERATOR_TYPE) {
            t = t.iterateNext();
            t = $(t).prev().text();
            console.log(t);
            t = xp.replace(re, `tr/th[text()="`+t+`"]/following-sibling::td`);
            if(xh.all_queries.indexOf(t) == -1) {
                xh.all_queries.push(t);
            }
        }
        // xh.all_queries.push(xp);
    }
    if(xh.all_queries.indexOf(xp) == -1) {
        xh.all_queries.push(xp);
    }
    return xp;
}; 

xh.mainCourse = function(a, c) {

    chrome.runtime.sendMessage({
        type: "clearQuery"
    }); 

    xh.all_queries = [];

    var id_depth = 0;
    var tp, i;
    for(id_depth = 0; id_depth < 3; id_depth ++) {
        console.log("DEPTH: "+id_depth);
        xh.idflag = false;
        tp=xh.optimizeQuery(xh.makeQueryForElement(a, c, id_depth)); 
        console.log(tp);
        if(!xh.idflag) break;
    }
    xh.lastElemProcess(tp)
    xh.evaluateQuery(tp, true);

    for(i = 0 ; i < xh.all_queries.length; i ++) {
        chrome.runtime.sendMessage({
            type: "addQuery",
            data: xh.all_queries[i]
        })
    }

    return tp;
}

xh.makeQueryForElement = function(a, c, idd) {
    var id_count = 0;
    for (var b = ""; a && a.nodeType === Node.ELEMENT_NODE; a = a.parentNode) {
        var d = a.tagName.toLowerCase(),
            g = xh.getElementIndex(a);
        if (c.minimal && xh.isUnique("//" + d + b)) {
            b = "//" + d + b;
            break
        }
        if (a.id.trim()) {
            xh.idflag = true;
            if(id_count > idd) {
                d += "[@id='" + a.id.trim() + "']";
            } id_count ++;
        }
        else if (a.className.trim()) {
            var f = a.className.trim();
            if (void 0 !== c.ignore)
                for (var h = c.ignore.split(" "), e = 0; e < h.length; e++) f = f.replace(h[e], "").trim();
            "" !== f && (d += "[contains(@class, '" + f + "')]")
        }
        if (c.minimal && xh.isUnique("//" + d + b)) {
            b = "//" + d + b;
            break
        }
        f = d;
        1 <= g && (d += "[" + g + "]");
        if (c.minimal && xh.isUnique("//" + d + b)) {
            b = c.similar ? "//" + f + b : "//" + d + b;
            break
        }
        "" === b && "img" === a.tagName.toLowerCase() && (d += "/@src");
        b = "/" + d + b;
        if (c.minimal && xh.isUnique("/" + b)) {
            b = "//" + d + b;
            break
        }
    }
    if (c.minimal && void 0 !== c.parent) {
        for (e = 0; e < b.length && e < c.parent.length && b[e] === c.parent[e]; e++);
        b = b.substr(e + 1)
    }
    return b
};
xh.highlight = function(a) {
    for (var c = 0, b = a.length; c < b; c++) a[c].classList.add("xh-highlight")
};
xh.clearHighlights = function() {
    for (var a = document.querySelectorAll(".xh-highlight"), c = 0, b = a.length; c < b; c++) a[c].classList.remove("xh-highlight")
};
xh.evaluateQuery = function(a, h=false) {
    var c = null,
        b = "",
        d = 0,
        g = [];
    try {
        c = document.evaluate(a, document, null, XPathResult.ANY_TYPE, null)
    } catch (f) {
        b = "[INVALID XPATH EXPRESSION]", d = 0
    }
    if (!c) return [b, d];
    if (c.resultType === XPathResult.BOOLEAN_TYPE) b = c.booleanValue ? "1" : "0", d = 1;
    else if (c.resultType === XPathResult.NUMBER_TYPE) b = c.numberValue.toString(), d = 1;
    else if (c.resultType === XPathResult.STRING_TYPE) b = c.stringValue, d = 1;
    else if (c.resultType === XPathResult.UNORDERED_NODE_ITERATOR_TYPE) {
        for (a = c.iterateNext(); a; a = c.iterateNext()) a.nodeType ===
            Node.ELEMENT_NODE && g.push(a), b && (b += "\n"), b += a.textContent, d++;
        0 === d && (b = "[NULL]")
    } else b = "[INTERNAL ERROR]", d = 0;
    if(h) xh.highlight(g);
    return [b, d, g];
};
xh.Bar = function() {
    this.boundHandleRequest_ = this.handleRequest_.bind(this);
    this.boundMouseMove_ = this.mouseMove_.bind(this);
    this.boundKeyDown_ = this.keyDown_.bind(this);
    this.opt_ = {};
    this.opt_.minimal = !0;
    this.opt_.similar = !0;
    this.inDOM_ = !1;
    this.currEl_ = null;
    this.barFrame_ = document.createElement("iframe");
    this.barFrame_.src = chrome.runtime.getURL("bar.html");
    this.barFrame_.id = "xh-bar";
    this.barFrame_.classList.add("hidden");
    document.addEventListener("keydown", this.boundKeyDown_);
    chrome.runtime.onMessage.addListener(this.boundHandleRequest_)
};
xh.Bar.prototype.hidden_ = function() {
    return this.barFrame_.classList.contains("hidden")
};
xh.optimizeQuery = function(oq) {

	var tp = oq;
	var original_result = xh.evaluateQuery(oq);
    var step1, step2, step2_5, step3;

    // console.log("ORIGINAL XPATH");
    console.log(oq);

    var s_points = []; // holds start index of every node
    var i, tm, s, r, nd, flag, j, e, sp1, sp2, sp2_5, sp3;

// STEP 1: Try to remove all possible nodes from start

	for(i = 0, flag=false; i < tp.length; i ++) {
		if(tp[i] == '/') {
			flag = false;
			continue;
		}
		if(flag) continue;
		s_points.push(i);
		flag=true;
	} // put first indecies of nodes in xpath string.

	for(i = 0, tm = tp; i < s_points.length; i ++) {
		s = tm[s_points[i] - 2] == '/'? 1: 0;
        e = tm.slice(s_points[i]).indexOf('/');
        e = e == -1? tp.length - 1: e;
		nd = tm.substring(s_points[i], e + s + s_points[i]); // get current node string
		tm = tm.replace(nd, ""); // remove current node ...
		// // console.log(tm);
		r = xh.evaluateQuery(tm); // and test
		if(!r.equals(original_result)) {
			tm = tp;
			continue;
		}
		for(j = i; j < s_points.length; j ++)
			s_points[j] -= nd.length;
		s_points.splice(i, 1);
		i = i - 1;
		tp = tm;
		// // console.log(tp);
	}

	// console.log("STEP 1: Node Optimization RESULT");
	console.log(tp);

    step1 = tp;

    xh.lastElemProcess(tp);

    // if(xh.all_queries.indexOf(step1) == -1)
    //     xh.all_queries.push(step1);

    // if(step1 != oq) {
    //     chrome.runtime.sendMessage({
    //         type: "addQuery",
    //         data: step1
    //     }); 
    // }

    sp1 = s_points.slice();

// STEP 2: Try to remove all possible classes from every node

    var re = /\[contains\(@class, '(.*)'\)\]/; // Regex for [container(@class= '')]
    var tr, tn, rs, k;

    for(i = 0, tm = tp; i < s_points.length; i ++) { // loop through each nodes
        e = tm.slice(s_points[i]).indexOf('/'); 
        e = e == -1? tp.length - 1: e; // get endpoint of current node including '/' at the end.
        nd = tm.substring(s_points[i], e + s_points[i]);
        s = nd.match(re); // get [...] from current node
        if(s == null) continue;
        tm = tp.replace(s[0], ""); // remove current matching class (whole)
        r = xh.evaluateQuery(tm);
        if(r.equals(original_result)) {
            tp = tm;
            for(k = i + 1; k < s_points.length; k ++)
                s_points[k] = s_points[k] - s[0].length;
            continue;
        }

        rs = s[1].split(' ');
        for(j = 0, tr = rs.slice(); j < tr.length; j ++) { 
            // loop through each classes of the node and try with each one
            // tr.splice(j, 1);
            tn = nd.replace(s[1], tr[j]);
            tm = tm.replace(nd, tn);
            // console.log(tm);
            r = xh.evaluateQuery(tm);
            if(!r.equals(original_result)) {
                tm = tp;
                tr = rs.slice();
                continue;
            }
            rs.splice(j, 1);
            for(k = i + 1; k < s_points.length; k ++)
                s_points[k] = s_points[k] - s[1].length + tr[j].length;
            tr = rs.splice(0);
            tp = tm;
            j = j - 1;
            // // console.log(tp);
        }
    }

    // console.log("STEP 2: Class Optimization RESULT");
    console.log(tp);

    step2 = tp;

    xh.lastElemProcess(step2);

    sp2 = s_points.slice();

// STEP 2.5: Multiple class delettion. Only run this procedure from step1 result

    var ss;

    tp = step1;
    s_points = sp1.slice();

    for(i = 0, tm = tp; i < s_points.length; i ++) { // loop through each nodes
        e = tm.slice(s_points[i]).indexOf('/');
        e = e == -1? tp.length - 1: e;
        nd = tm.substring(s_points[i], e + s_points[i]);
        s = nd.match(re);
        if(s == null) continue;

        rs = s[1].split(' ');
        for(j = 0, tr = rs.slice(); j < tr.length; j ++) { // loop through each classes of the node
            // tr.splice(j, 1);
            for(k = 0, ss=""; k < tr.length; k ++) {
                if(k == j) continue;
                if(ss.length != 0) ss += ` and `;
                ss = ss + `contains(@class, "`+tr[k] + `")`;
            }
            ss = ss == ""? ss: `[` + ss + `]`;
            tn = nd.replace(s[0], ss);
            tm = tm.replace(nd, tn);
            // console.log(tm);
            r = xh.evaluateQuery(tm);
            if(!r.equals(original_result)) {
                tm = tp;
                tr = rs.slice();
                continue;
            }
            for(k = i + 1; k < s_points.length; k ++)
                s_points[k] = s_points[k] - s[0].length + ss.length;
            rs.splice(j, 1);
            tr = rs.splice(0);
            j = j - 1;
            tp = tm;
            // // console.log(tp);
        }
    }

    // console.log("STEP 2.5: Multiple Class Optimization RESULT");
    console.log(tp);

    step2_5 = tp;

    if(step2 != step2_5) xh.lastElemProcess(step2_5);

    sp2_5 = s_points.slice();

// STEP I: Just try to remove first node (in case if its id)

    if(s_points.length >= 2) {
        tm = tp;
        s = tm[s_points[0] - 2] == '/'? 1: 0;
        e = tm.slice(s_points[0]).indexOf('/');
        e = e == -1? tp.length - 1: e;
        e = tm[e + s + s_points[0]] == '/'? e + 1: e;
        nd = tm.substring(s_points[0], e + s + s_points[0]);
        tm = tm.replace(nd, "");
        // chrome.runtime.sendMessage({
        //     type: "addQuery",
        //     data: tm
        // }); 
        xh.lastElemProcess(tm);

    }

	return oq;

}
xh.Bar.prototype.updateQueryAndBar_ = function(a) {
    xh.clearHighlights();
    this.query_ = a ? xh.mainCourse(a, this.opt_, 3) : "";
    this.updateBar_(!0)
};
xh.Bar.prototype.updateBar_ = function(a) {
    var c;
    c = void 0 === this.opt_.parent ? this.query_ : this.opt_.parent + "/" + this.query_;
    c = this.query_ ? xh.evaluateQuery(c, true) : ["", 0];
    chrome.runtime.sendMessage({
        type: "update",
        query: a ? this.query_ : null,
        results: c
    })
};
xh.Bar.prototype.showBar_ = function() {
    var a = this;
    this.inDOM_ || (this.inDOM_ = !0, document.body.appendChild(this.barFrame_));
    window.setTimeout(function() {
        a.barFrame_.classList.remove("hidden");
        $(document).on("mousemove", a.boundMouseMove_);
        // $("iframe").each(function() {
        //     $(this).load(function() {
        //         $(this.contentWindow.document).on("mousemove", a.boundMouseMove_);
        //     }); 
        // }); 
        a.updateBar_(!0)
    }, 10)
};
xh.Bar.prototype.hideBar_ = function() {
    var a = this;
    window.setTimeout(function() {
        a.barFrame_.classList.add("hidden");
        document.removeEventListener("mousemove", a.boundMouseMove_);
        xh.clearHighlights()
    }, 0)
};
xh.Bar.prototype.toggleBar_ = function() {
    this.hidden_() ? (xh.analytics(["_trackEvent", "ui", "bar", "show"]), this.showBar_()) : (xh.analytics(["_trackEvent", "ui", "bar", "hide"]), this.hideBar_())
};
xh.Bar.prototype.getParent_ = function() {
    xh.analytics(["_trackEvent", "ui", "get_parent"]);
    var a = xh.getTopTwo(this.query_);
    // console.log(a);
    a = utilityFn.getCommonRoot(a[0], a[1]);
    // console.log(a);
    a = xh.mainCourse(a, {
        minimal: !0,
        similar: !0
    }, 3);
    // console.log(a);
    chrome.runtime.sendMessage({
        type: "setParent",
        parent: a
    })
};
xh.Bar.prototype.handleRequest_ = function(a, c, b) {
    "evaluate" === a.type ? (xh.clearHighlights(), this.query_ = a.query, this.opt_ = a, this.updateBar_(!0)) : "moveBar" === a.type ? this.barFrame_.classList.toggle("bottom") : "hideBar" === a.type ? (this.hideBar_(), window.focus()) : "toggleBar" === a.type ? this.toggleBar_() : "getParent" === a.type ? this.getParent_() : "postRequest" === a.type && this.postRequest_(a.param)
};
xh.Bar.prototype.mouseMove_ = function(a) {
    this.currEl_ !== a.toElement && (this.currEl_ = a.toElement, a.shiftKey && this.updateQueryAndBar_(this.currEl_)); 
};
xh.Bar.prototype.keyDown_ = function(a) {
    var c = a.ctrlKey || a.metaKey,
        b = a.shiftKey;
    xh.analytics(["_trackEvent", "run", void 0 === this.opt_.parent ? "root" : "has_parent"]);
    a.keyCode === xh.X_KEYCODE && c && b && this.toggleBar_();
    this.hidden_() || c || a.keyCode !== xh.SHIFT_KEYCODE || this.updateQueryAndBar_(this.currEl_)
}; - 1 === location.href.indexOf("acid3.acidtests.org") && (window.xhBarInstance = new xh.Bar);
xh.Bar.prototype.postRequest_ = function(a) {
    if(a['home_url'] == '#####') {
        h = window.location.href; 
        a['home_url'] = h.slice(0, h.slice(9).search('/') + 9);
    }
    $.post(
        "http://94.46.223.90/xpath/api.php", 
        a, function(r) {
            r = JSON.parse(r);
            chrome.runtime.sendMessage({
                'type': 'postResponse', 
                'request': a,
                'data': r
            }); 
        }); 
}

// var interval = setInterval(function() {
//     if(document.readyState === 'complete') {
//         alert("HERE");
//         clearInterval(interval);
//         done();
//     }    
// }, 100);

// var everythingLoaded = setInterval(function() {
//   if (/loaded|complete/.test(document.readyState)) {
//     // clearInterval(everythingLoaded);
//     console.log(document.readyState);
//   }
// }, 10);

// setTimeout(function() {
//     clearInterval(everythingLoaded);
// }, 30000);