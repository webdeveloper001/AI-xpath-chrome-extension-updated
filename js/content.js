/*
 Apache License, Version 2.0.
*/
// Warn if overriding existing method


var relative_mode=false;


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
            // console.log(t);
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
    xp = xp.replace('[@class=\'\']', '');
    xp = xp.replace('[contains(@class, \'\']', '');
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
        // console.log("DEPTH: "+id_depth);
        xh.idflag = false;
        tp=xh.optimizeQuery(xh.makeQueryForElement(a, c, id_depth)); 
        // console.log(tp);
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

    this.boundMouseClick_ = this.mouseClick_.bind(this); 

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
    // console.log(oq);

    var s_points = []; // holds start index of every node
    var i, tm, s, r, nd, flag, j, e, sp1, sp2, sp2_5, sp3;

// STEP 1x: Delete tailing [text()="..."] on relative xpath if possible

    var tx_re = /\[text\(\)\=\'\w+\'\]?$/;
    
    s = tp.match(tx_re);
    if(s != null) {
        tm = tp.replace(s[0], ""); 
        r = xh.evaluateQuery(tm);
        if(r.equals(original_result)) {
            tp = tm; 
        }
    }

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
	// console.log(tp);

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
        for(j = 0, tr = rs.slice(), tm=tp; j < tr.length; j ++) { 
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
    // console.log(tp);

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
    // console.log(tp);

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
    this.hidden_() ? this.showBar_() : this.hideBar_()
};
xh.Bar.prototype.getParent_ = function() {
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
    // "evaluate" === a.type ? (xh.clearHighlights(), this.query_ = a.query, this.opt_ = a, this.updateBar_(!0)) : "moveBar" === a.type ? this.barFrame_.classList.toggle("bottom") : "hideBar" === a.type ? (this.hideBar_(), window.focus()) : "toggleBar" === a.type ? this.toggleBar_() : "getParent" === a.type ? this.getParent_() : "postRequest" === a.type ? this.postRequest_(a.param) : "remove-xh-elem" === a.type && this.remove_xh_elem();
    if("evaluate" === a.type) {
        xh.clearHighlights();
        this.query_ = a.query;
        this.opt_ = a;
        this.updateBar_(!0); 
    }
    if("moveBar" === a.type) {
        this.barFrame_.classList.toggle("bottom"); 
    }
    if("hideBar" === a.type) {
        this.hideBar_(), window.focus(); 
    }
    if("toggleBar" === a.type) {
        this.toggleBar_(); 
    }
    if("getParent" === a.type) {
        this.getParent_(); 
    }
    if("postRequest" === a.type) {
        this.postRequest_(a.param); 
    }
    if("remove-xh-elem" === a.type) {
        this.remove_xh_elem();
    }
    if("change_relative_mode" === a.type) {
        var p = this;
        // console.log(p); 
        relative_mode = !relative_mode; 
        if(relative_mode) {
            document.addEventListener('contextmenu', p.boundMouseClick_); 
        } else {
            document.removeEventListener('contextmenu', p.boundMouseClick_); 
            firingElement2.style.border = origColor2;
            firingElement1.style.border = origColor1;
        }
    }
    if("show-review-section" == a.type) {
        $("body .xh-review-section").remove();
        $("body").append(a.element);
        console.log(a.element);
        // $(".xh-review-section")
        $(".xh-review-section .modal-background").click(function() {
            $(this).parent().hide();
            $(this).parent().remove();
        }); 
        $("#markascomplete").click(function() {
            param = {
                'type': 'completeinverse', 
                'id': a.id
            }; 
            $.post(
                "http://94.46.223.90/xpath/api.php", 
                param, function(r) {
                    r = JSON.parse(r);
                    chrome.runtime.sendMessage({
                        'type': 'postResponse', 
                        'request': param,
                        'data': r
                    }); 
                    if(Number(r['result'][0]['is_complete']) == 1) 
                        $("#markascomplete").text("Mark as Incomplete"); 
                    else 
                        $("#markascomplete").text("Mark as Complete"); 
                }); 
        }); 
        $(".xh-review-section button.nexturl").click(function() {
            param = {
                'type': 'nexturl', 
                'new_url': $(this).hasClass('new'), 
                'url': window.location.href
            }
            $.post(
                "http://94.46.223.90/xpath/api.php", 
                param, function(r) {
                    r = JSON.parse(r);
                    console.log(r);
                    window.location = 'http://'+r['url'];
                }); 
        }); 
    }

};
xh.Bar.prototype.mouseMove_ = function(a) {
    this.currEl_ !== a.toElement && (this.currEl_ = a.toElement, a.shiftKey && this.updateQueryAndBar_(this.currEl_)); 
};
xh.Bar.prototype.mouseClick_ = function(a) {
    a.preventDefault(); 
    // console.log(a); 
    analyseRightClick(a); 
    return false;
}; 
xh.Bar.prototype.keyDown_ = function(a) {
    var c = a.ctrlKey || a.metaKey,
        b = a.shiftKey;
    a.keyCode === xh.X_KEYCODE && c && b && this.toggleBar_();
    this.hidden_() || c || a.keyCode !== xh.SHIFT_KEYCODE || this.updateQueryAndBar_(this.currEl_)
}; - 1 === location.href.indexOf("acid3.acidtests.org") && (window.xhBarInstance = new xh.Bar);
xh.Bar.prototype.postRequest_ = function(a) {
    if(a['home_url'] == '#####') {
        h = window.location.href; 
        // a['home_url'] = h.slice(0, h.slice(9).search('/') + 9);
        a['home_url'] = h;
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
};
xh.Bar.prototype.remove_xh_elem = function() {
    $(".xh-highlight").css('display', 'none'); 
}; 

function analyseRightClick(e) {

    try{

    xh.clearHighlights(); 

    e.preventDefault();
    // changeNodeBgToOriginal();


    if (firstClick == false && secondClick == false) {// first element going
                                                        // to be selected
        printConsole("Clicked on First Element");
        firstClick = true;
        secondClick == false;
        node1 = e.srcElement;
        printConsole("node1="+node1)
        xpath1 = getXpath(node1);
        printConsole("xpath1="+xpath1)

        // if xpath1 is undefined, this element may not be in main document, so traverse all the iframes


        // updateXPath1(xpath1);

        if (firingElement2 != null) {

            firingElement2.style.border = origColor2;
            firingElement1.style.border = origColor1;

        }

        firingElement1 = node1;

        origColor1 = firingElement1.style.border;
        firingElement1.style.border = '5px groove #ff0000';
        selectElement1 = firingElement1;


    }

    else if (firstClick == true && secondClick == false) {
        printConsole("Clicked on Second Element");
        secondClick = true;
        node2 = e.srcElement;
        firingElement2 = node2;

        xpath2 = getXpath(node2);
        // updateXPath2(xpath2);

        origColor2 = firingElement2.style.border;

        firingElement2.style.border = '5px groove #F4FA58';
        selectElement2 = firingElement2;
        // bringBackOriginalBackground();

        // Element 1 and Element 2 are at same level

        chrome.runtime.sendMessage({
            type: "clearQuery"
        }); 
        xh.all_queries = [];
        findRelXPath(node1, node2, xpath1, xpath2);

        firstClick = false;
        secondClick = false;

    }

    }
    catch(err){
        printConsole("Err Happened, "+err.message);
    }
}


'use strict';

var debug=false;
var interv = 3000;
var selectElement1, origColor1, selectElement2, origColor2;
var temp;
var xpath1, xpath2;
var firstClick = false;
var secondClick = false;
var node1, node2;
var firingElement1 = null;
var firingElement2 = null;
var attr = null;
var normal = true;
var customxpathelementlist=[];
var customxpathelementoriginalbglist=[];


function printConsole(msg){
    if(debug==true){
    console.log(msg);
    }
}

function removeParenthesis(xpath) {

    var charArr = xpath.split('');

    var count = charArr.length;
    var indexArray = [];

    while (charArr[count - 2] != '[') {

        indexArray.push(charArr[count - 2]);
        count--;
    }

    indexArray.reverse();
    var finalStr = '';
    for (var i = 0; i < indexArray.length; i++) {

        finalStr = finalStr + indexArray[i];
    }

    var secndpart = "[" + finalStr + "]";
    var pre = xpath.split(secndpart);
    var firstpart = pre[0];

    firstpart = firstpart.substring(1, firstpart.length - 1)

    var newxpath = firstpart + secndpart;

    return firstpart;
}

function findRelXPath(element1, element2, xpath1, xpath2) {

    printConsole("In findRelXPath")


    try{
        var par1 = element1.parentNode;
        var par2 = element2.parentNode;
        var rel_xpath = '';

        var parentFlag = 0, parentCount = 1;
        var childFlag = 0, childCount = 1;

        printConsole("xpath1="+xpath1);

        if (xpath1 != undefined && xpath1.charAt(0) == '(') {
            xpath1 = removeParenthesis(xpath1);
        }


        printConsole("xpath1 after removing parenthesis="+xpath1);
        printConsole("xpath2="+xpath2);

       //both are same

        if(element1.isSameNode(element2)){
            printConsole("Both elements are same");

            rel_xpath=xpath1+"/self::"+element1.tagName;
            updateRelativeXPath(rel_xpath);

            return;
        }

        // both has same parent
        if (par1.isSameNode(par2)) {
            printConsole("Parent of the elements are same");

            var next = element1.nextElementSibling;
            var previous = element1.previousElementSibling;

            if ((next != null) && (next.isSameNode(element2))) {

                printConsole("Element 2 is just after Element 1");
                rel_xpath = xpath2 + "/preceding-sibling::*";

            } else if ((previous != null) && (previous.isSameNode(element2))) {
                printConsole("Element 1 is just after Element 2");
                rel_xpath = xpath2 + "/following-sibling::*";

            }

            else{

                rel_xpath=xpath2+"/.."+xpath1;
                var rel_count = getXpathCount(rel_xpath);

                if(rel_count>1){

                    rel_xpath= findXpathWithIndex(rel_xpath,element1);

                }
            }

            updateRelativeXPath(rel_xpath);

            return;

        }// if both has same parent

        // check for Element 1 is one of the parent of element2

        var temp = element2.parentNode;

        while (temp != null || temp != undefined) {

            if (temp.isSameNode(element1)) {
                parentFlag = 1;
                break;
            } else {
                parentCount++;
                temp = temp.parentNode;
            }
        }

        // check for Element 2 is one of the parent of element1

        var tagArray = [];
        var temp = element1.parentNode;
        tagArray.push(element1.tagName);

        while (temp != null || temp != undefined) {

            if (temp.isSameNode(element2)) {
                childFlag = 1;
                break;
            } else {
                tagArray.push(temp.tagName);
                childCount++;
                temp = temp.parentNode;

            }

        }

        // Element 1 is one of the parent of element2

        if (parentFlag == 1) {

            // appendlevels
            printConsole("Element 1 is one of the parent of element2");

            var lv = '';
            for (var x = 0; x < parentCount; x++) {
                lv = lv + "/..";
            }
            rel_xpath = xpath2 + lv;
            var rel_count = getXpathCount(rel_xpath);

            if (rel_count > 1) {

                rel_xpath = findXpathWithIndex(rel_xpath, element1);

            }
            updateRelativeXPath(rel_xpath);
            return;

        }

        // Element 2 is the parent of element1

        if (childFlag == 1) {

            printConsole("Element 2 is one of the parent of element 1");

            tagArray.reverse();
            var postPart = '';
            tagArray[tagArray.length - 1] = xpath1.substring(2);

            postPart = "//" + tagArray[tagArray.length - 1]

            rel_xpath = xpath2 + postPart

            var rel_count = getXpathCount(rel_xpath);

            if (rel_count > 1) {

                rel_xpath = findXpathWithIndex(rel_xpath, element1);

            }
            updateRelativeXPath(rel_xpath);
            return;

        }

        var common = commonAncestor(node1, node2);
        parentCount = 1;

        if (common != null) {

            printConsole("Element 1 and 2 has a common parent node");

            var temp = element2.parentNode;

            while (temp != null || temp != undefined) {

                if (temp.isSameNode(common)) {
                    parentFlag = 1;
                    break;
                } else {
                    parentCount++;
                    temp = temp.parentNode;
                }
            }

            var lv = '';
            for (var x = 0; x < parentCount; x++) {

                lv = lv + "/..";
            }
            var first = xpath2 + lv;

            var tagArray = [];
            var temp = element1.parentNode;
            tagArray.push(element1.tagName);

            while (temp != null || temp != undefined) {

                if (temp.isSameNode(common)) {
                    childFlag = 1;
                    break;
                } else {
                    tagArray.push(temp.tagName);
                    childCount++;
                    temp = temp.parentNode;

                }

            }

            tagArray.reverse();
            var postPart = '';
            tagArray[tagArray.length - 1] = xpath1.substring(2);

            postPart = "//" + tagArray[tagArray.length - 1];
            rel_xpath = first + postPart;
            var rel_count = getXpathCount(rel_xpath);

            if (rel_count > 1) {

                rel_xpath = findXpathWithIndex(rel_xpath, element1);

            }

        printConsole("rel_xpath zzzzzz="+rel_xpath)
            updateRelativeXPath(rel_xpath);
            return;

        }// if(common!=null)
    }
    catch(err){
        printConsole("err="+err);

    }

    updateRelativeXPath("Sorry! It is not possible to calculate relative xpath of two elements between an iframe to document or two iframes. For More details please check http://stackoverflow.com/questions/9942928/how-to-handle-iframe-in-webdriver");
}

function getTheLastTag(exp){
    var expArr=[]
    printConsole("exp="+exp);
    expArr=exp.split("//");
    printConsole("Last Tag="+expArr[expArr.length-1])
    return expArr[expArr.length-1];
}

function isNotEmpty(val) {
    return (val === undefined || val == null || val.length <= 0) ? false : true;
}

function inherit_xpath_from_parents(nodez) {

    // check any of the parent has unique id
    var new_xpath = '';
    var id_flag = 0;
    var tempNode = nodez;
    var all_Parents = [];
    while (tempNode) {

        if (tempNode != undefined) {
            all_Parents.push(tempNode);
            if (tempNode.id != undefined && tempNode.id.length > 0) {
                id_flag = 1;
                break;
            }

            tempNode = tempNode.parentNode;
        }
    }
    all_Parents = all_Parents.reverse();
    for (var k = 0; k < all_Parents.length; k++) {
        if (k == 0) {
            if (id_flag == 1) {
                new_xpath = "//" + all_Parents[k].tagName + "[@id='"
                        + all_Parents[k].id + "']";
            } else {
                new_xpath = "//" + all_Parents[k].tagName;

            }
        } else {
            new_xpath = new_xpath + "//" + all_Parents[k].tagName;
        }
    }

    var count = getXpathCount(new_xpath);
    if (count == 1) {
        return new_xpath;
    }
    if (count > 1) {
        new_xpath = findXpathWithIndex(new_xpath, nodez);
        return new_xpath;
    }
}

function checkHtmlEntities(str){


    var res =null;

    var exp1="&nbsp;";
    var exp2="&lt;";
    var exp3="&gt;";
    var exp4="&amp;";
    var exp5="&quot;";
    var exp6="&apos;";
    var exp7="&pound;";
    var exp8="&yen;";
    var exp9="&euro;";
    var exp10="&copy;";
    var exp11="&reg;";


    if(str.includes(exp1)){
    res = str.split(exp1);
    }
    else if(str.includes(exp2)){
    res = str.split(exp2);
    }
    else if(str.includes(exp3)){
    res = str.split(exp3);
    }
    else if(str.includes(exp4)){
    res = str.split(exp4);
    }
    else if(str.includes(exp5)){
    res = str.split(exp5);
    }
    else if(str.includes(exp6)){
    res = str.split(exp6);
    }
    else if(str.includes(exp7)){
    res = str.split(exp7);
    }
    else if(str.includes(exp8)){
    res = str.split(exp8);
    }
    else if(str.includes(exp9)){
    res = str.split(exp9);
    }
    else if(str.includes(exp10)){
    res = str.split(exp10);
    }
    else if(str.includes(exp11)){
    res = str.split(exp11);
    }
    else {
        return str;
    }

    return res[0];
}

function getXpath(node) {

    printConsole("document.activeElement="+document.activeElement)


    var attrs = node.attributes;
    var i = attrs.length;
    var tagName = node.tagName.toLowerCase();;
    var map = {};
    var j = 0;
    var val = '';
    var count = 0;
    printConsole("i="+i)
    printConsole("tagName="+tagName)


    // no attributes
    if (i == 0) {

        var text = node.innerHTML;
        var oldText=text;
        text= checkHtmlEntities(text);
        printConsole("text="+text)
        if ((text.length > 0) && (!text.includes("<"))
                && (text.indexOf('\'') == -1) && (text.indexOf('"') == -1)) {

            text= checkHtmlEntities(text);
            if(oldText==text){
                val = "//" + tagName + "[text()='" + text + "']";
            }
            else{
                val = "//" + tagName + "[contains(text(),'" + text + "')]";
            }
            count = getXpathCount(val);
            if (count == 1) {
                return val;
            }
            if (count > 1) {
                val = findXpathWithIndex(val, node);
                return val;
            } else {
                return findXpathWithIndex("//"+node.tagName,node);
            }
        } else {

            return findXpathWithIndex("//"+node.tagName,node);

        }

    } // end if i==0

    var realCount = 0;
    while (j < i) {
        attr = attrs[j];

        if ((attr.name != "style") && (attr.value.indexOf('\'') < 0)) {
            map[attr.name] = attr.value;
            realCount++;
        }
        j++;

    }
    var attrLength = j;

    printConsole("realCount="+realCount)
    if (realCount == 0) {// undefined case
        printConsole("tagName="+tagName)
        var xp = findXpathWithIndex("//"+tagName,node);
        return xp;
    }// end of realCount==0

    // Since Id going to be unique , no need to check further attributes

    if (isNotEmpty(map['id'])) {

        val = "//" + tagName + "[@id='" + map['id'] + "']";
        return val;

    }

    // find which attribute combination gives the xpath count 1

    for ( var attribute in map) {
        if (map.hasOwnProperty('class'))
            attribute = 'class'

        if (map.hasOwnProperty(attribute)) {

            val = "//" + tagName + "[@" + attribute + "='" + map[attribute] + "']";

            var text = node.innerHTML;
            var oldText=text;
                text= checkHtmlEntities(text);
                printConsole('text='+text)
            if ((text.length > 0) && (!text.includes("<"))
                    && (text.indexOf('\'') == -1) && (text.indexOf('"') == -1)) {
                if(oldText==text){
                val = val + "[text()='" + text + "']";
                }
                else{
                    val = val + "[contains(text(),'" + text + "')]";
                }
            }
            printConsole("val="+val)

            count = getXpathCount(val);
            printConsole("count hi="+count)
            if (count == 1) {
                return val;
            }

            if (count > 1) {
                val = findXpathWithIndex(val, node);
                return val;
            } else {
                return "No Unique Identifiers found";
            }

        }
    }
}

function getXpathCount(val) {

var nodes=null;
    if(document.activeElement== document.querySelector('iframe')){

     var currentIframe = document.activeElement;
     var iDoc = currentIframe.contentWindow  || currentIframe.contentDocument;

     nodes = iDoc.document.evaluate(val, iDoc.document, null, XPathResult.ANY_TYPE,
            null);
    } else {
     nodes = document.evaluate(val, document, null, XPathResult.ANY_TYPE, null);
    }
    var results = [], nodex;

    while (nodex = nodes.iterateNext()) {
        results.push(nodex);
    }
    return results.length;
}

function findXpathWithIndex(val, node) {
   printConsole("val="+val)


     var text = node.innerHTML;
     text = $(node).clone()    //clone the element
        .children() //select all the children
        .remove()   //remove all the children
        .end()  //again go back to selected element
        .text();
     var oldText=text;
        text= checkHtmlEntities(text);
     printConsole("text in findXpathWithIndex="+text)
     if ((text.length > 0) && (!text.includes("<"))
             && (text.indexOf('\'') == -1) && (text.indexOf('"') == -1)) {
                 if(oldText==text){
             val=val+"[text()='"+text+"']";
             }
             else{
                 val=val+"[contains(text(),'"+text+"')]";
             }

     }
    var nodes=null;
     if(document.activeElement== document.querySelector('iframe')){

         var currentIframe = document.activeElement;
         var iDoc = currentIframe.contentWindow  || currentIframe.contentDocument;

         nodes = iDoc.document.evaluate(val, iDoc.document, null, XPathResult.ANY_TYPE,
                null);
    } else {
        nodes = document.evaluate(val, document, null, XPathResult.ANY_TYPE, null);
    }
    printConsole("nodes="+nodes)
    var results = [], nodex;
    var index = 0;
    while (nodex= nodes.iterateNext()) {

        index++;

        if (nodex.isSameNode(node)) {

            return "(" + val + ")[" + index + "]";
        }
    }
}

function commonAncestor(node1, node2) {
    var parents1 = parents(node1)
    var parents2 = parents(node2)

    if (parents1[0] != parents2[0])
        return null;

    for (var i = 0; i < parents1.length; i++) {
        if (parents1[i] != parents2[i])
            return parents1[i - 1]
    }
}

function parents(node) {
    var nodes = [ node ];
    for (; node; node = node.parentNode) {
        nodes.unshift(node);
    }
    return nodes;
}

function updateRelativeXPath(xpath) {
    var results = '';
    var nodex = '';


    try {

        if((xpath.indexOf("/following-sibling::*")>-1) || (xpath.indexOf("/preceding-sibling::*")>-1)){
            xpath = xpath.substring(0, xpath.length - 1);
            xpath=xpath+firingElement1.tagName;
        }

        if(document.activeElement== document.querySelector('iframe')){

            var currentIframe = document.activeElement;
            var iDoc = currentIframe.contentWindow  || currentIframe.contentDocument;

            results = iDoc.document.evaluate(xpath, iDoc.document, null,
                    XPathResult.ANY_TYPE, null);
        } else {
        results = document.evaluate(xpath, document, null,
                XPathResult.ANY_TYPE, null);
        }
        var nodex = results.iterateNext();

    } catch (err) {
        printConsole(err.message)
    }
    printConsole("Final Xpath="+xpath);

    var inHTML=  nodex.innerHTML;
    var tgName= nodex.tagName;

    if(!(isNotEmpty(inHTML))){
        inHTML=' ';
        tgName=' ';
    }
    chrome.runtime.sendMessage({
        type : 'addQuery',
        data : xpath,
    });
    xh.optimizeQuery(xpath); 
    xh.lastElemProcess(xpath)
    xh.evaluateQuery(xpath, true); 
    for(i = 0 ; i < xh.all_queries.length; i ++) {
        chrome.runtime.sendMessage({
            type: "addQuery",
            data: xh.all_queries[i]
        })
    }
};
