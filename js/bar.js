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
    save_id = -1, 
    current_row = [], 
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
        "update" === a.type ? (null !== a.query && (elementGroup.query.value = a.query), null !== a.results && (elementGroup.results.value = a.results[0], nodeCountText.nodeValue = a.results[1])) : "analytics" === a.type ? _gaq.push(a.data) : "addQuery" === a.type ? (b=document.createElement("option"), b.text=a.data, b.value=a.data, elementGroup.queries.appendChild(b), elementGroup.queries.selectedIndex = elementGroup.queries.options.length - 1): "clearQuery" === a.type ? (document.getElementById("queries").innerHTML="") : "postResponse" === a.type && handleResponse(a); 
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
    },
    handleResponse = function(a) {
        console.log(a);
        if(a['data']['result'].length == 0) {
            save_id = -1;
            current_row = [];
            document.getElementById("dbrow").innerHTML = "Not registered to database!"; 
            document.getElementById("dbfield").disabled=true;
            document.getElementById("save-attr").disabled=true;
            return ;
        }
        save_id = a['data']['result'][0]['id'];
        current_row = a['data']['result'][0]; 
        document.getElementById("dbrow").innerHTML = a['data']['result'][0]['listing_url']; 
        document.getElementById("dbfield").disabled=false;
        document.getElementById("save-attr").disabled=false;
        document.getElementById("dbfield").dispatchEvent(new Event('change'));
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
    var ts;
    var home_url = window.location;
    var req = {}; 
    req['type'] = 'postRequest';
    // req['param'] = [];

    $("#save-attr").click(function() {
        var field = dbfield.val();
        var content = $("#query").val();
        console.log("SAVING REQUEST: " + save_id + " | " + field + " - " + content); 
        if(save_id == -1) {
            req['param'] = {'type': 'save', 'id': save_id, 'field': field, 'content': content};
        } else {
            req['param'] = {'type': 'update', 'id': save_id, 'field': field, 'content': content};
        }
        chrome.runtime.sendMessage(req);
    }); 

    $("#save-result").click(function() {
        var field = dbfield.val();
        var content = $("#results").val();
        console.log("SAVING REQUEST: " + save_id + " | " + field + " - " + content); 
        if(save_id == -1) {
            req['param'] = {'type': 'save', 'id': save_id, 'field': field, 'content': content};
        } else {
            req['param'] = {'type': 'update', 'id': save_id, 'field': field, 'content': content};
        }
        chrome.runtime.sendMessage(req);
    }); 

    $("#savelistingurl").click(function() {
        req['param'] = {'type': 'saveurl', 'id': save_id, 'home_url': '#####', field: "listing_url"};
        chrome.runtime.sendMessage(req);
    }); 

    $("#refresh-dbrow").click(function() {
        refreshdb(); 
    }); 

    function refreshdb() {
        req['param'] = {'type': 'get_this', 'home_url': '#####' }; 
        chrome.runtime.sendMessage(req);
    }

    refreshdb();

    $("#dbfield").change(function() {
        $("#last_field_name").text($(this).val()); 
        $("#last_field_value").text(current_row[$(this).val()]); 
    }); 


    $("#dbfield").change(); 

}); 
