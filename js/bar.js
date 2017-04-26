/*
 Apache License, Version 2.0.
*/


var field_dict = {
    "car_postcode": [ /^(GIR ?0AA|(?:[A-PR-UWYZ](?:\d|\d{2}|[A-HK-Y]\d|[A-HK-Y]\d\d|\d[A-HJKSTUW]|[A-HK-Y]\d[ABEHMNPRV-Y])) ?\d[ABD-HJLNP-UW-Z]{2})$/i ], 
    "dealer_name": [ /dealer\s*name/i ], 
    "dealer_telephone": [/^[\\(]{0,1}([0-9]){3}[\\)]{0,1}[ ]?([^0-1]){1}([0-9]){2}[ ]?[-]?[ ]?([0-9]){4}[ ]*((x){0,1}([0-9]){1,5}){0,1}$/i, /^\(0[1-9]{1}\)[0-9]{8}$/i ], 
    "dealer_url": [/^((http:\/\/www\.)|(www\.)|(http:\/\/))[a-zA-Z0-9._-]+\.[a-zA-Z.]{2,5}$/i], 
    "dealer_email": [/^[A-Z0-9._-]+@[A-Z0-9.-]+\.[A-Z0-9.-]+$/i], 
    "car_model": [/car\s*model/i, /model/i], 
    "car_make": [/car\s*make/i, /make/i], 
    "make_model": [/make\s*model/i], 
    "model_variant": [/variant/i], 
    "car_price": [/price/i, /(\£|\$)\d+/], 
    "car_year": [/year/i], 
    "mileage": [/mileage/i, /^\d+,?(\d|X|k)+\smiles/], 
    "body_type": [/body\s*type/i, /body\s*style/i], 
    "fuel_type": [/fuel\s*tyoe/i, /fueltype/i, /fuel/i], 
    "engine_size": [/engine size/i, /cc$/i], 
    "fuel_consumption": [/fuel fuel_consumption/i], 
    "acceleration": [/acceleration/i], 
    "gearbox": [/gearbox/i, /transmission/i], 
    "drivetrain": [/drivetrain/i], 
    "co2_emissions": [/co2/i, /co2\s*emissions/i], 
    "doors": [/door/i], 
    "seats": [/seat/i], 
    "insurance_group": [/insurance/i, /ins\s*group/i],
    "annual_tax": [/annual\s*tax/i, /annual\s*rating/i], 
    "colour": [/color/i, /colour/i], 
    "advertiser_type": [/advertiser\s*type/i], 
    "car_description": [/description/i], 
    "car_specification": [/specification/i], 
    "image_urls": [/.*(jpeg|png|gif|bmp|jpg)/i], 
    "next_image": [/next/i], 
    "next_page": [/(next|next\s*page)/i]
}

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
        // console.log("EVALUATE PARAM FROM BARJS")
        // console.log(a); 
        chrome.runtime.sendMessage(a)
    },
    handleRequest = function(a, b, c) {
        "update" === a.type ? (null !== a.query && undefined !== a.query && (elementGroup.query.value = a.query, detect_field(a.query, a.results[0])), null !== a.results && (elementGroup.results.value = a.results[0], nodeCountText.nodeValue = a.results[1])) : "addQuery" === a.type ? (b=document.createElement("option"), b.text=a.data, b.value=a.data, elementGroup.queries.appendChild(b), elementGroup.queries.selectedIndex = 0) : "clearQuery" === a.type ? (document.getElementById("queries").innerHTML="") : "postResponse" === a.type && handleResponse(a); 
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
        if(a['data']['result'].length == 0) {
            save_id = -1;
            current_row = [];
            document.getElementById("dbrow").innerHTML = "Not registered to database!"; 
            document.getElementById("dbfield").disabled=true;
            document.getElementById("save-attr").disabled=true;
            document.getElementById("save-result").disabled=true;
            document.getElementById("review").disabled=true;
            return ;
        }
        save_id = a['data']['result'][0]['id'];
        current_row = a['data']['result'][0]; 
        document.getElementById("dbrow").innerHTML = a['data']['result'][0]['listing_url']; 
        document.getElementById("dbfield").disabled=false;
        document.getElementById("save-attr").disabled=false;
        document.getElementById("save-result").disabled=false;
        document.getElementById("review").disabled=false;
        document.getElementById("dbfield").dispatchEvent(new Event('change'));
        if(Number(current_row['is_complete']) == 1)
            document.getElementById('dbrow').style.backgroundColor = '#009F00';
        else 
            document.getElementById('dbrow').style.backgroundColor = 'transparent';
    }, 
    detect_field = function(xpath, result) {
        var k, i;
        for(k in field_dict) {
            for(i = 0; i < field_dict[k].length; i ++) {
                if(xpath.match(field_dict[k][i]) || result.match(field_dict[k][i])) {
                    $("#dbfield").val(k); 
                }
            }
        }
        // $("#dbfield").val('-'); 
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
        if(field === '-') {
            dbfield.css('border', '2px solid #f00');
            return; 
        }
        dbfield.css('border', 'none');
        var content = $("#query").val();
        // console.log("SAVING REQUEST: " + save_id + " | " + field + " - " + content); 
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
        if(field === '-') {
            dbfield.css('border', '2px solid #f00');
            return; 
        }
        dbfield.css('border', 'none');
        // console.log("SAVING REQUEST: " + save_id + " | " + field + " - " + content); 
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

    $("#xh-remove").click(function() {
        req['type'] = 'remove-xh-elem'; 
        chrome.runtime.sendMessage(req);
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

    $("#review").click(function() {
        var conatiner = $(".xh-review-section .modal-content > ul"), tp, cls; 
        console.log(current_row);
        conatiner.html('');
        $(".xh-review-section .modal-header").html('<h2>'+current_row['listing_url']+'</h2>');
        for(k in field_dict) {
            tp = '';
            if(current_row[k] == '') {
                tp = 'blank';
                cls = 'disabled'; 
            }
            else {
                tp = current_row[k]
                cls = '';
            }
            conatiner.append('<li> <label>'+k+':</label><span class = "'+cls+'">'+tp+'</span></li>'); 
        }
        if(Number(current_row['is_complete']) == 0)
            $("#markascomplete").text("Mark as Incomplete");
        console.log("SEINGING ELEMENT");
        console.log($(".xh-review-section").clone().wrap('<div/>').parent().html());
        chrome.runtime.sendMessage({
            'type': 'show-review-section', 
            'element': $(".xh-review-section").clone().wrap('<div/>').parent().html(), 
            'id': save_id
        }); 
    }); 

    $("#relative").change(function() {
        if($(this).prop('checked'))
            $("#query").attr('placeholder', 'Click right mouse button on each elements you want to get xpath from'); 
        else 
            $("#query").attr('placeholder', 'Hold shift key and hover over element you want to get xpath from'); 
        $("#query").val(''); 

        chrome.runtime.sendMessage({
            'type': 'change_relative_mode'
        }); 

    }); 

}); 
