/*
 Apache License, Version 2.0.
*/
var MOVE_COOLDOWN_PERIOD_MS = 400,
    X_KEYCODE = 88,
    nodeCountEl = document.getElementById("node-count"),
    elementGroup = {},
    elementGroupNames = ["query", "similar", "minimal", "results", "queries"],
    nodeCountText = document.createTextNode("0");
nodeCountEl.appendChild(nodeCountText);
var lastMoveTimeInMs = 0,
    evaluateQuery = function() {
        var a = {
            type: "evaluate"
        };
        _.each(elementGroup, function(b) {
            var c;
            "textarea" == b.type ? c = b.value && "" !== b.value.trim() ? b.value : void 0 : "checkbox" == b.type && (c = b.checked);
            a[b.id] = c
        });
        chrome.runtime.sendMessage(a)
    },
    handleRequest = function(a, b, c) {
        "update" === a.type ? (null !== a.query && (elementGroup.query.value = a.query), null !== a.results && (elementGroup.results.value = a.results[0], nodeCountText.nodeValue = a.results[1])) : "analytics" === a.type ? _gaq.push(a.data) : "addQuery" === a.type ? (b=document.createElement("option"), b.text=a.data, b.value=a.data, elementGroup.queries.appendChild(b), elementGroup.queries.selectedIndex = elementGroup.queries.options.length - 1): "clearQuery" === a.type && (document.getElementById("queries").innerHTML=""); 
        // console.log(a);
    },
    handleMouseMove = function(a) {
        a.shiftKey && (a = (new Date).getTime(), a - lastMoveTimeInMs < MOVE_COOLDOWN_PERIOD_MS || (lastMoveTimeInMs = a, chrome.runtime.sendMessage({
            type: "moveBar"
        })))
    },
    handleKeyDown = function(a) {
        var b = a.ctrlKey || a.metaKey,
            c = a.shiftKey;
        a.keyCode === X_KEYCODE && b && c && chrome.runtime.sendMessage({
            type: "hideBar"
        })
    };
document.getElementById("move-button").addEventListener("click", function() {
    chrome.runtime.sendMessage({
        type: "moveBar"
    })
});
document.addEventListener("keydown", handleKeyDown);
chrome.runtime.onMessage.addListener(handleRequest);
document.getElementById("queries").addEventListener("change", function(a) {
	document.getElementById("query").value = this.options[this.selectedIndex].value;
	// console.log("changeActiveQuery Called: set to  "+document.getElementById("query").value);
	evaluateQuery(document.getElementById("query").value);
});
for (var i = 0; i < elementGroupNames.length; i++) {
    var elem = document.getElementById(elementGroupNames[i]);
    "textarea" == elem.type ? elem.addEventListener("keyup", evaluateQuery) : "checkbox" == elem.type && elem.addEventListener("click", evaluateQuery);
    elementGroup[elementGroupNames[i]] = elem
}
var _gaq = _gaq || [];
_gaq.push(["_setAccount", utilityFn.analyticsID]);
_gaq.push(["_trackPageview"]);
(function() {
    var a = document.createElement("script");
    a.type = "text/javascript";
    a.async = !0;
    a.src = "https://ssl.google-analytics.com/ga.js";
    var b = document.getElementsByTagName("script")[0];
    b.parentNode.insertBefore(a, b)
})();

$(document).ready(function() {

    var dbfield = $("#dbfield"); 
    var dbrow = $("#dbrow"); 
    var save_id = -1, ts;

    $("#save-attr").click(function() {
        var field = dbfield.val();
        var id = dbrow.val();
        var content = $("#query").val();
        save_id = id;
        console.log("SAVING REQUEST: " + id + " | " + field + " - " + content); 
        if(id == -1) {
            $.post(
                "http://94.46.223.90/xpath/api.php", 
                {'type': 'save', 'id': id, 'field': field, 'content': content}, 
                function(r) {
                    r = JSON.parse(r);
                    console.log(r);
                    if(r.result.status == 'error') {
                        alert(r.result.error); 
                        return ;
                    }
                    refreshdb(); 
                }); 
        } else {
            $.post(
                "http://94.46.223.90/xpath/api.php", 
                {'type': 'update', 'id': id, 'field': field, 'content': content}, 
                function(r) {
                    r = JSON.parse(r);
                    console.log(r);
                    if(r.result.status == 'error') {
                        alert(r.result.error); 
                        return ;
                    }
                    refreshdb(); 
                }); 
        }
    }); 
    $("#deleterow").click(function() {
        var id = dbrow.val();
        $.post(
                "http://94.46.223.90/xpath/api.php", 
                {'type': 'delete', 'id': id}, 
                function(r) {
                    r = JSON.parse(r);
                    console.log(r); 
                    if(r.result.status == 'error') {
                        alert(r.result.error); 
                    }
                    refreshdb(); 
                }); 
    }); 

    $("#refresh-dbrow").click(function() {
        refreshdb(); 
    }); 

    $("#dbrow").change(function() {
        if($(this).val() == -1) {
            $("#save-attr").text("Save (New)"); 
        } else {
            $("#save-attr").text("Save (Update)"); 
        }
    }); 

    function refreshdb() {
        $.post(
            "http://94.46.223.90/xpath/api.php", 
            {'type': 'get_all'}, 
            function(r) {
                r = JSON.parse(r);
                console.log(r); 
                dbrow.html(`<option value="-1"> -------------------- </option> `);
                for(i = 0; i < r.result.length; i ++) {
                    ts = save_id == r.result[i].id? " selected ": " "; 
                    dbrow.append(`<option value="`+r.result[i][0]+`"`+ts+`>`+r.result[i]['listing_url']+`</option>`);
                }
            }); 
    }

    refreshdb();

}); 
