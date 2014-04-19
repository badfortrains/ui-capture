$(function(){
  var entry = $("#entry-template").html();
  var entry_template = Handlebars.compile(entry);
  var device_entry = $("#device-entry").html();
  var device_template = Handlebars.compile(device_entry);
  var all_offers = [];
  var all_devices = [];

  $.ajax({
    url: "/offers",
    success: function(data){
      $("tbody").append(entry_template({offers:data}));
      all_offers = data;
    }
  })

  Toast = function(message){
    $(".info").html(message);
    $(".info").show();
    setTimeout(function(){
      $(".info").hide()
    },3000)
  }

  $.ajax({
    url: "/devices",
    success:function(data){
      $("#devices").append(device_template({devices:data}))
      all_devices = data
    }
  })

  $("table").on("click",".removeIt",function(e){
    var row = $(e.currentTarget).parent().parent();
    $.ajax({
      url:"/offers/"+row.attr("item_id"),
      type: "DELETE",
      success: function(){
        row.remove();
      }
    })
  })

  $(".addIt").click(function(){
    var type = $("#type").val(),
        description = $("#description").val(),
        offer_id = $("#offer_id").val(),
        data = {type:type, description:description, offer_id:offer_id}
    $.ajax({
      url: "/offers",
      type: "POST",
      data: data,
      success:function(res){
        data.id = res.id
        $("table").append(entry_template({offers:[data]}));
        all_offers.push(data)
      },
      error:function(){
        alert("error adding offer")
      }
    })
  })

  $(".runSim").click(function(){
    var urls = generateURLs(),
        name = $("#testName").val(),
        devices = getDevices(urls);

    $("#screenshots").html("")
    Toast("Running tests "+name+" "+urls.length+" offer pages on "+devices.length+" devices")
    socket.emit("run",{name:name,urls:urls, devices:devices})
    // $.ajax({
    //   url: "/run/testme/SIMULATOR",
    //   data: {urls: generateURLs(), devices: getDevices()},
    //   type: "POST"
    // })
  })

  function getDevices(urls){
    var devices = [],
        checks = $("#devices input");
    $("#devices .done").html(0)
    $("#devices .total").html(0)
    for(var i=0;i<all_devices.length;i++){
      if(checks[i].checked){
        devices.push(all_devices[i])
        $($("#devices .total")[i]).html(urls.length)
      }
    }
    return devices
  }

  function generateURLs(){
    var completeUrl = "/videos/OFFERID/complete",
        baseUrl = $("#base_url").val() || "https://ws.tapjoyads.com/",
        params = "?action=webpage&ad_tracking_enabled=true&ad_view_id=41fd482e-ef59-4402-ab9a-8707dd470eee&advertising_id=3586ace381b04d5ea34e8f0a0f10075e&algorithm=324&algorithm_options[skip_country]=true&algorithm_options[skip_currency]=true&app_id=13b0ae6a-8516-4405-9dcf-fe4e526486b2&app_version=1.0&bridge_version=1.0.3&connection_type=wifi&controller=get_offers&country_code=US&currency_id=13b0ae6a-8516-4405-9dcf-fe4e526486b2&currency_selector=0&device_location=true&device_name=x86_64&device_type=iPhone+Simulator&display_multiplier=1.000000&exp=short_list_control&identifiers_provided=&impression_id=26ddd0bf-7c69-4061-8ac2-bf2351c680d6&install_id=2546BC97-6989-474F-AE4C-48767CCCBE60-73283-000106A057180D7B&lad=0&language_code=en&library_revision=8b68cf&library_version=10.0.0&mac_address=7cd1c3db3ceb&offer_id=b34ba460-aceb-477a-9c30-5f1c78b75272&offers_in_premium_feed=&offerwall_rank=1&os_version=6.0&platform=iOS&plugin=native&premium_feed_rank=&publisher_user_id=3586ace381b04d5ea34e8f0a0f10075e&sdk_type=event&session_id=99bb757dbef06db7cabb6040d83e486e57c7909be40b0ce9139fc7a6f2b80503&sha1_mac_address=353be8ef8df33087b1b720a133daecd42484e318&source=offerwall&store_view=true&threatmetrix_session_id=c98387e00ef34e848948056b9a5148e0&timestamp=1390429456&udid=3586ace381b04d5ea34e8f0a0f10075e&udid_is_temporary=false&udid_lookup_via=params&udid_via_lookup=false&verifier=3143b0ec35ed324d49d033eb74c866d8ce08d155330abef826ed9f9ac42aff32&view_id=short_list_control",
        urls = [],
        offer;          

    for(var i=0;i<all_offers.length;i++){
      offer = all_offers[i];
      if($("#offer_"+offer.id).find("input")[0].checked){
        urls.push({
          name: offer.description,
          url: baseUrl +completeUrl.replace("OFFERID",offer.offer_id)+params + "&offer_id="+offer.offer_id
        })
      }
    }
    return urls;
  }

  socket.on("progress",function(data){
    var devices = $("#devices input").filter(function(){
      return this.checked
    })
    var row = $(devices[data.index]).parent().parent()
    var numDone = parseFloat(row.find(".done").html())+1
    var numTotal = parseFloat(row.find(".total").html())
    var device  = $(row.find("td")[0]).html()

    Toast(device + " completed "+numDone+" of "+numTotal)
    row.find(".done").html(numDone)
  })
  socket.on("screenshot",function(data){
    var width = $("#screenshots").append("<img src="+data.filePath+"></img>").width()
    $("#screenshots").width(width+800)
  })
  socket.on("done",function(){
    Toast("All tests complete!")
  })

})